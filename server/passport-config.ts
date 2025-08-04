import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Configure Google OAuth strategy with Gmail scope included
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: (process.env.NODE_ENV === 'production' || 
                    process.env.REPL_SLUG === 'workspace')
        ? 'https://gigfloww.com/api/auth/google/callback'
        : 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth callback with profile:', profile.id, profile.emails?.[0]?.value);
        console.log('Tokens received:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });
        
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Find user by email first
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        let user;
        if (existingUser.length > 0) {
          // Update existing user
          [user] = await db
            .update(users)
            .set({
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              profileImageUrl: profile.photos?.[0]?.value || null,
            })
            .where(eq(users.email, email))
            .returning();
        } else {
          // Create new user
          [user] = await db
            .insert(users)
            .values({
              id: profile.id,
              email: email,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              profileImageUrl: profile.photos?.[0]?.value || null,
            })
            .returning();
        }

        // Don't save Gmail credentials here - only basic auth
        console.log('User authenticated with basic scope:', user.email);

        return done(null, user);
      } catch (error) {
        console.error('OAuth error:', error);
        return done(error as Error);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    done(null, user || null);
  } catch (error) {
    done(error);
  }
});

export default passport;