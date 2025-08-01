import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Session configuration
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  });
}

// Setup Google OAuth authentication
export async function setupGoogleAuth(app: Express) {
  // Configure session
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  // Get the correct callback URL based on environment
  const getCallbackURL = (req?: any) => {
    if (process.env.NODE_ENV === "production") {
      // In production, use the request hostname
      const protocol = req?.protocol || "https";
      const host = req?.hostname || process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost";
      return `${protocol}://${host}/api/auth/google/callback`;
    }
    return "/api/auth/google/callback";
  };

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        passReqToCallback: true,
        scope: [
          'openid',
          'profile',
          'email',
          'https://www.googleapis.com/auth/gmail.send'
        ]
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Extract user data from Google profile
          const userData = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value || '',
          };

          // Create or update user in database
          const user = await storage.upsertUser(userData);
          
          // Store tokens in session
          const sessionUser = {
            ...user,
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken,
          };
          
          return done(null, sessionUser);
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
          return done(error as Error);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Auth routes
  app.get("/api/login", (req, res, next) => {
    passport.authenticate("google", {
      scope: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
      prompt: 'consent',
      accessType: 'offline'
    })(req, res, next);
  });

  app.get("/api/auth/google", (req, res, next) => {
    passport.authenticate("google", {
      scope: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
      prompt: 'consent',
      accessType: 'offline'
    })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};