import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration
app.set("trust proxy", 1);

// Force development mode for now
const isProduction = false;

// Use default memory store for session persistence
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction ? true : false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? 'none' : 'lax',
      // Remove domain restriction for Replit
    },
  })
);



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
      try {
        // For OAuth callbacks, we need to preserve the full URL including query params
        const redirectUrl = `http://localhost:5000${req.url}`;
        
        // Only log the path to avoid cluttering logs with long OAuth URLs
        const path = req.url?.split('?')[0] || '/';
        console.log(`[OAuth Redirect] :3000${path} → :5000${path} (with params)`);
        
        // Set appropriate headers for the redirect
        res.writeHead(302, { 
          'Location': redirectUrl,
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'close'
        });
        res.end('Redirecting...');
      } catch (err) {
        console.error('[OAuth Redirect] Error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });
    
    redirectServer.listen(3000, '0.0.0.0', () => {
      log('OAuth redirect server listening on port 3000 → redirecting to port 5000');
    });
    
    // Handle server errors
    redirectServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn('Port 3000 is already in use - OAuth redirect may not work');
      } else {
        console.error('OAuth redirect server error:', err);
      }
    });
    
    // Handle connection errors
    redirectServer.on('connection', (socket) => {
      socket.on('error', (err) => {
        console.error('[OAuth Redirect] Socket error:', err.message);
      });
    });
    
    // Increase header size limit for OAuth callbacks with long URLs
    redirectServer.maxHeadersCount = 100;
    redirectServer.headersTimeout = 10000;
  }
})();
