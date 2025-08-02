import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Create a simple redirect server on port 3000 for Supabase OAuth
  // This is needed because Supabase redirects to localhost:3000 after Google login
  if (port !== 3000) {
    const http = await import('http');
    const redirectServer = http.createServer((req, res) => {
      const redirectUrl = `http://localhost:5000${req.url}`;
      console.log(`[OAuth Redirect] :3000${req.url} → :5000${req.url}`);
      res.writeHead(302, { 'Location': redirectUrl });
      res.end();
    });
    
    redirectServer.listen(3000, '0.0.0.0', () => {
      log('OAuth redirect server listening on port 3000 → redirecting to port 5000');
    });
    
    // Handle errors
    redirectServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn('Port 3000 is already in use - OAuth redirect may not work');
      } else {
        console.error('OAuth redirect server error:', err);
      }
    });
  }
})();
