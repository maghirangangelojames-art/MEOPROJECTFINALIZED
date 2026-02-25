import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

// Helper to get client IP address
function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ips.trim();
  }
  return req.socket.remoteAddress || "Unknown";
}

function getRequestOrigin(req: Request): string {
  const forwardedProto = req.header("x-forwarded-proto");
  const forwardedHost = req.header("x-forwarded-host");
  const protocol = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host");
  if (!host) return "";
  return `${protocol}://${host}`;
}

function getGoogleRedirectUri(req: Request): string {
  if (ENV.googleRedirectUri) {
    return ENV.googleRedirectUri;
  }

  const origin = getRequestOrigin(req);
  return origin ? `${origin}/api/oauth/google/callback` : "";
}

function encodeGoogleState(nextPath: string): string {
  return Buffer.from(JSON.stringify({ next: nextPath }), "utf8").toString("base64url");
}

function decodeGoogleState(state: string | undefined): string {
  if (!state) return "/";
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as { next?: string };
    if (parsed.next && parsed.next.startsWith("/")) {
      return parsed.next;
    }
  } catch {
    // no-op
  }
  return "/";
}

function resolveRoleByEmail(email: string | null | undefined): "admin" | "staff" | undefined {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return undefined;
  }

  if (ENV.adminEmails.includes(normalizedEmail)) {
    return "admin";
  }

  if (ENV.staffEmails.includes(normalizedEmail)) {
    return "staff";
  }

  return undefined;
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", async (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured" });
      return;
    }

    const redirectUri = getGoogleRedirectUri(req);
    if (!redirectUri) {
      res.status(500).json({ error: "Unable to resolve Google redirect URI" });
      return;
    }

    const next = getQueryParam(req, "next");
    const safeNext = next && next.startsWith("/") ? next : "/";
    const state = encodeGoogleState(safeNext);

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", ENV.googleClientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", state);

    res.redirect(302, googleAuthUrl.toString());
  });

  app.get("/api/auth/local-login", async (req: Request, res: Response) => {
    if (ENV.isProduction) {
      res.status(403).json({ error: "Local login is disabled in production" });
      return;
    }

    const roleParam = getQueryParam(req, "role");
    const role = roleParam === "admin" || roleParam === "staff" || roleParam === "user"
      ? roleParam
      : "staff";
    const name = getQueryParam(req, "name")?.trim() || "Local Developer";
    const email = getQueryParam(req, "email")?.trim() || `${role}@local.dev`;
    const openId = `local-dev-${role}`;

    try {
      await db.upsertUser({
        openId,
        role,
        name,
        email,
        loginMethod: "local",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const next = getQueryParam(req, "next");
      const redirectPath = next && next.startsWith("/") ? next : "/";
      res.redirect(302, redirectPath);
    } catch (error) {
      console.error("[Auth] Local login failed", error);
      res.status(500).json({ error: "Local login failed" });
    }
  });

  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(500).json({ error: "Google OAuth is not fully configured" });
      return;
    }

    const redirectUri = getGoogleRedirectUri(req);
    if (!redirectUri) {
      res.status(500).json({ error: "Unable to resolve Google redirect URI" });
      return;
    }

    try {
      const tokenPayload = new URLSearchParams({
        code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenPayload,
      });

      if (!tokenResponse.ok) {
        const message = await tokenResponse.text().catch(() => tokenResponse.statusText);
        throw new Error(`Google token exchange failed: ${message}`);
      }

      const tokenData = (await tokenResponse.json()) as { access_token?: string };
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new Error("Google token exchange returned no access token");
      }

      const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        const message = await userInfoResponse.text().catch(() => userInfoResponse.statusText);
        throw new Error(`Google user info fetch failed: ${message}`);
      }

      const userInfo = (await userInfoResponse.json()) as {
        sub?: string;
        email?: string;
        name?: string;
      };

      if (!userInfo.sub) {
        throw new Error("Google user info response missing sub");
      }

      const openId = userInfo.sub;
      const name = userInfo.name || "";

      await db.upsertUser({
        openId,
        name: name || null,
        email: userInfo.email ?? null,
        role: resolveRoleByEmail(userInfo.email ?? null),
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        email: userInfo.email,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const redirectPath = decodeGoogleState(state);
      res.redirect(302, redirectPath);
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        role: resolveRoleByEmail(userInfo.email ?? null),
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
