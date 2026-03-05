import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";

export function getSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  const PgSession = connectPgSimple(session);
  const sessionStore = new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true,
  });

  // Trust the Render proxy so secure cookies are sent
  app.set('trust proxy', 1);

  return session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // requires trust proxy on Render
      maxAge: sessionTtl,
      sameSite: 'lax', // Helps with cross-origin redirects if any
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession(app));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/test-login", async (req, res) => {
    const testUser = {
      id: "test-user-id",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: "https://via.placeholder.com/150",
      claims: {
        sub: "test-user-id",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        profile_image_url: "https://via.placeholder.com/150",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      access_token: "test-access-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    try {
      await storage.upsertUser({
        id: testUser.claims.sub,
        email: testUser.claims.email,
        firstName: testUser.claims.first_name,
        lastName: testUser.claims.last_name,
        profileImageUrl: testUser.claims.profile_image_url,
      });
      req.login(testUser, (err) => {
        if (err) return res.status(500).send(err.message);
        res.redirect("/");
      });
    } catch (error) {
      console.error("Test login error:", error);
      res.status(500).send("Failed to create test user");
    }
  });

  // Mock endpoints for local dev
  app.get("/api/login", (req, res) => {
    res.redirect("/api/test-login");
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
