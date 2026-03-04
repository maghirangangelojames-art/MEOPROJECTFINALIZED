import { eq, desc, and, like, gte, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, applications, activityLogs, notifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;
let _connectionRetries = 0;
let _lastConnectionAttempt = 0;
const MAX_RETRIES = 3;
const RETRY_RESET_MS = 60000; // Reset retry counter after 1 minute

async function resolveDatabaseUrl(): Promise<string | undefined> {
  let databaseUrl = process.env.DATABASE_URL || ENV.databaseUrl;
  if (databaseUrl) return databaseUrl;

  try {
    await import("dotenv/config");
  } catch {
    // no-op
  }

  databaseUrl = process.env.DATABASE_URL || ENV.databaseUrl;
  return databaseUrl || undefined;
}

// Sleep helper for retry backoff
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (_db) {
    return _db;
  }

  // Reset retry counter after RETRY_RESET_MS to allow new connection attempts
  const now = Date.now();
  if (_connectionRetries >= MAX_RETRIES && (now - _lastConnectionAttempt) > RETRY_RESET_MS) {
    console.log("[Database] Resetting retry counter after cooldown period");
    _connectionRetries = 0;
  }

  if (_connectionRetries >= MAX_RETRIES) {
    return null;
  }

  _lastConnectionAttempt = now;

  const connectionString = await resolveDatabaseUrl();
  if (!connectionString) {
    console.warn("[Database] DATABASE_URL is not set. Check your .env and restart the server.");
    return null;
  }

  // Log connection info (without password)
  const urlSafe = connectionString.replace(/:([^@]+)@/, ':****@');
  console.log("[Database] Connection URL:", urlSafe);
  console.log("[Database] Attempting connection (attempt", _connectionRetries + 1, "of", MAX_RETRIES, ")");

  // Determine if we're on Railway or using Supabase (both require SSL)
  const isRailway = connectionString.includes('railway') || process.env.RAILWAY_ENVIRONMENT;
  const isSupabase = connectionString.includes('supabase');
  const requiresSsl = isRailway || isSupabase;
  
  try {
    _pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 10,
      // Railway and Supabase require SSL for all connections
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    });
    await _pool.query("select 1");
    _db = drizzle(_pool);
    console.log("[Database] Connected successfully");
    _connectionRetries = 0; // Reset on success
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    _connectionRetries++;
    _db = null;
    
    // Retry with backoff if we haven't exhausted retries
    if (_connectionRetries < MAX_RETRIES) {
      const delay = _connectionRetries * 2000; // 2s, 4s backoff
      console.log(`[Database] Retrying in ${delay}ms...`);
      await sleep(delay);
      return getDb(); // Recursive retry
    }
  }

  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as any,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Application Queries ============

/**
 * Get all applications ordered by submission date (FIFO)
 */
export async function getApplicationsFIFO(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get FIFO applications: database not available");
    return [];
  }

  try {
    console.log("[Database] Fetching applications FIFO - limit:", limit, "offset:", offset);
    const result = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.submittedAt))
      .limit(limit)
      .offset(offset);
    console.log("[Database] Found", result.length, "applications");
    return result;
  } catch (error) {
    console.error("[Database] Error fetching FIFO applications:", error);
    return [];
  }
}

/**
 * Get applications by status
 */
export async function getApplicationsByStatus(status: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get applications by status: database not available");
    return [];
  }

  try {
    console.log("[Database] Fetching applications by status:", status, "- limit:", limit, "offset:", offset);
    const result = await db
      .select()
      .from(applications)
      .where(eq(applications.status, status as any))
      .orderBy(desc(applications.submittedAt))
      .limit(limit)
      .offset(offset);
    console.log("[Database] Found", result.length, "applications with status:", status);
    return result;
  } catch (error) {
    console.error("[Database] Error fetching applications by status:", error);
    return [];
  }
}

/**
 * Search applications by name, reference number, or property location
 */
export async function searchApplications(query: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;

  return db
    .select()
    .from(applications)
    .where(
      or(
        like(applications.applicantName, searchPattern),
        like(applications.referenceNumber, searchPattern),
        like(applications.propertyLocation, searchPattern)
      )
    )
    .orderBy(desc(applications.submittedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get application by applicant email (one per email)
 */
export async function getApplicationByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    console.log("[Database] Querying application by email:", email);
    const result = await db
      .select()
      .from(applications)
      .where(eq(applications.applicantEmail, email))
      .limit(1);

    console.log("[Database] Query result for", email, ":", result.length > 0 ? "Found" : "Not found");
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Error querying application by email:", error);
    throw error;
  }
}

/**
 * Get application by reference number
 */
export async function getApplicationByRefNumber(refNumber: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    console.log("[Database] Querying application by reference number:", refNumber);
    const result = await db
      .select()
      .from(applications)
      .where(eq(applications.referenceNumber, refNumber))
      .limit(1);

    console.log("[Database] Query result for ref", refNumber, ":", result.length > 0 ? "Found" : "Not found");
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Error querying application by reference number:", error);
    throw error;
  }
}

/**
 * Create a new application
 */
export async function createApplication(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log("[Database] Creating application with data:", JSON.stringify(data, null, 2));
    const result = await db.insert(applications).values(data);
    console.log("[Database] Application created successfully");
    return result;
  } catch (error) {
    console.error("[Database] Error creating application:", error);
    throw error;
  }
}

/**
 * Update application status and remarks
 */
export async function updateApplicationStatus(id: number, status: string, remarks?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
    processedAt: new Date(),
  };

  if (remarks) {
    updateData.staffRemarks = remarks;
  }

  // If application is being approved, clear all file remarks
  if (status === "approved") {
    const app = await getApplicationById(id);
    if (app && app.attachments && Array.isArray(app.attachments)) {
      updateData.attachments = (app.attachments as any[]).map((attachment: any) => ({
        ...attachment,
        remarks: "", // Clear remarks for all files when approved
      }));
    }
  }

  return db
    .update(applications)
    .set(updateData)
    .where(eq(applications.id, id));
}

// ============ Activity Log Queries ============

/**
 * Create an activity log entry
 */
export async function createActivityLog(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(activityLogs).values(data);
}

/**
 * Get activity logs for an application
 */
export async function getActivityLogsByApplicationId(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.applicationId, applicationId))
    .orderBy(desc(activityLogs.createdAt));
}

// ============ Notification Queries ============

/**
 * Create a notification record
 */
export async function createNotification(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(notifications).values(data);
}

/**
 * Get pending notifications
 */
export async function getPendingNotifications(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.deliveryStatus, "pending"))
    .limit(limit);
}

/**
 * Update notification delivery status
 */
export async function updateNotificationStatus(id: number, status: string, sentAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    deliveryStatus: status,
    sent: status === "sent" ? 1 : 0,
  };

  if (sentAt) {
    updateData.sentAt = sentAt;
  }

  return db
    .update(notifications)
    .set(updateData)
    .where(eq(notifications.id, id));
}

/**
 * Delete an application by ID
 */
export async function deleteApplication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(applications).where(eq(applications.id, id));
}


