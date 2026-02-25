import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// Use process.cwd() for runtime resolution which works better with bundled code
// This ensures we always get the correct working directory at runtime
const getDistPath = () => path.join(process.cwd(), "dist", "public");

export async function setupVite(app: Express, server: Server) {
  const { default: viteConfig } = await import("../../vite.config");

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // In development, resolve from current working directory
      const clientTemplate = path.join(process.cwd(), "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = getDistPath();
  console.log(`[Static] Serving static files from: ${distPath}`);
  console.log(`[Static] Directory exists: ${fs.existsSync(distPath)}`);
  
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log(`[Static] Files in directory: ${files.join(", ")}`);
  }

  app.use(
    express.static(distPath, {
      etag: false,
      lastModified: false,
      setHeaders: (res, servedPath) => {
        // Always disable caching for everything - force fresh fetch
        res.setHeader("Cache-Control", "no-store, no-cache, no-transform, must-revalidate, proxy-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Surrogate-Control", "no-store");
      },
    })
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    // DO NOT serve index.html for API routes - let them 404 naturally
    // API routes should be registered BEFORE this catch-all middleware
    if (_req.path.startsWith("/api/")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    
    const indexPath = path.join(distPath, "index.html");
    // Force browser to always fetch fresh - no caching of SPA
    res.setHeader("Cache-Control", "no-store, no-cache, no-transform, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.sendFile(indexPath);
  });
}
