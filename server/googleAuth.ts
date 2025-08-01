import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Gmail scopes for full email access
const GOOGLE_SCOPES = [
  "openid",
  "email", 
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify"
];

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "lax"
    },
  });
}

async function upsertUser(profile: any, accessToken: string, refreshToken: string) {
  const userData = {
    id: profile.id,
    email: profile.emails?.[0]?.value || "",
    firstName: profile.name?.givenName || "",
    lastName: profile.name?.familyName || "",
    profileImageUrl: profile.photos?.[0]?.value || "",
  };

  const user = await storage.upsertUser(userData);
  
  // Store tokens in session (you might want to encrypt these in production)
  return {
    ...user,
    googleAccessToken: accessToken,
    googleRefreshToken: refreshToken,
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: "/api/auth/google/callback",
        scope: GOOGLE_SCOPES,
        accessType: "offline",
        prompt: "consent"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await upsertUser(profile, accessToken, refreshToken);
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, {
      id: user.id,
      email: user.email,
      googleAccessToken: user.googleAccessToken,
      googleRefreshToken: user.googleRefreshToken
    });
  });

  passport.deserializeUser(async (sessionUser: any, done) => {
    try {
      const user = await storage.getUser(sessionUser.id);
      if (user) {
        done(null, {
          ...user,
          googleAccessToken: sessionUser.googleAccessToken,
          googleRefreshToken: sessionUser.googleRefreshToken
        });
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });

  // Google OAuth routes
  app.get("/api/login", 
    passport.authenticate("google", { 
      scope: GOOGLE_SCOPES,
      accessType: "offline",
      prompt: "consent"
    })
  );

  app.get("/api/auth/google",
    passport.authenticate("google", { 
      scope: GOOGLE_SCOPES,
      accessType: "offline",
      prompt: "consent"
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
      successRedirect: "/"
    })
  );

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};