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
  
  // Temporarily use memory store to fix the connection issue
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
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
  // Handle production URL properly
  let baseUrl;
  if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://service-genie-ashutoshlathrep.replit.app';
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  } else {
    baseUrl = 'http://localhost:5000';
  }
    
  console.log("Configuring Google OAuth with base URL:", baseUrl);
  console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: `${baseUrl}/api/auth/google/callback`,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log("Google OAuth callback - Profile:", JSON.stringify(profile, null, 2));
          console.log("Access Token received:", accessToken ? "Yes" : "No");
          console.log("Refresh Token received:", refreshToken ? "Yes" : "No");
          
          const user = await upsertUser(profile, accessToken, refreshToken);
          console.log("User upserted successfully:", user);
          
          done(null, user);
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
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
      failureRedirect: "/",
      failureMessage: true
    }),
    (req, res) => {
      console.log("Authentication successful, redirecting to home");
      res.redirect("/");
    }
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