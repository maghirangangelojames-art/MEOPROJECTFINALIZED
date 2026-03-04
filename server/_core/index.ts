import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  console.log(`[Server] Starting in ${process.env.NODE_ENV} mode`);
  console.log(`[Server] Current working directory: ${process.cwd()}`);
  console.log(`[Server] Expected dist path: ${path.join(process.cwd(), "dist", "public")}`);
  
  // Configure body parser with very large size limit for file uploads
  // Base64 encoding increases file size by ~33%, so we need a generous limit
  // This supports multiple large files (up to 100MB total)
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // Increase timeout for large file uploads
  app.use((req, res, next) => {
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000); // 5 minutes
    next();
  });

  // Error handling for payload too large
  app.use((err: any, _req: any, res: any, next: any) => {
    if (err.status === 413) {
      return res.status(413).json({
        error: "Payload too large",
        message: "The request body is too large. Maximum file size is 100MB.",
      });
    }
    next(err);
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Database health check endpoint
  app.get("/api/db-health", async (_req, res) => {
    try {
      const db = await getDb();
      if (db) {
        res.status(200).json({ status: "connected", timestamp: new Date().toISOString() });
      } else {
        res.status(503).json({ status: "disconnected", message: "Database not available", timestamp: new Date().toISOString() });
      }
    } catch (err) {
      res.status(500).json({ status: "error", message: String(err), timestamp: new Date().toISOString() });
    }
  });

  // Simple logout endpoint for sendBeacon (used when closing tab/window)
  app.post("/api/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.status(200).json({ success: true });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  console.log(`[Server] About to setup routes, NODE_ENV=${process.env.NODE_ENV}`);
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    console.log(`[Server] Setting up development mode with Vite`);
    await setupVite(app, server);
  } else {
    console.log(`[Server] Setting up production mode with static files`);
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
