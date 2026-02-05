import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Helper to remove password from user object before sending to client
function sanitizeUser(user: any) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- Auth Setup ---
  app.use(
    session({
      store: storage.sessionStore,
      secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: app.get("env") === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // --- WebSocket Setup ---
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Broadcast helper
  const broadcast = (message: any) => {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  wss.on('connection', (ws) => {
    // console.log("Client connected");
  });

  // --- API Routes ---

  // Auth
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) return next(regenerateErr);

        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.status(201).json(sanitizeUser(user));
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      next(err);
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) return next(regenerateErr);

        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.status(200).json(sanitizeUser(user));
        });
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((logoutErr) => {
      if (logoutErr) return next(logoutErr);

      // Destroy the session completely
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logged out" });
      });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.status(200).json(sanitizeUser(req.user));
  });

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    // Add isRegistered flag if user is logged in
    const userId = (req.user as any)?.id;

    const eventsWithStatus = await Promise.all(events.map(async (event) => {
      let isRegistered = false;
      if (userId) {
        const reg = await storage.getRegistration(userId, event.id);
        isRegistered = !!reg;
      }
      return { ...event, isRegistered };
    }));

    res.json(eventsWithStatus);
  });

  app.post(api.events.create.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'organizer') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const bodySchema = api.events.create.input.extend({
        date: z.coerce.date(),
        maxParticipants: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const event = await storage.createEvent({ ...input, organizerId: (req.user as any).id });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check registration status
    let isRegistered = false;
    if (req.isAuthenticated()) {
      const reg = await storage.getRegistration((req.user as any).id, event.id);
      isRegistered = !!reg;
    }

    res.json({ ...event, isRegistered });
  });

  app.delete(api.events.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Not found" });

    if ((req.user as any).role !== 'organizer' || event.organizerId !== (req.user as any).id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteEvent(event.id);
    res.status(204).send();
  });

  // Registrations
  app.post(api.registrations.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const eventId = Number(req.params.id);
    const userId = (req.user as any).id;

    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check capacity
    if (event.registrationCount >= event.maxParticipants) {
      return res.status(400).json({ message: "Event is full" });
    }

    // Check duplicate
    const existing = await storage.getRegistration(userId, eventId);
    if (existing) {
      return res.status(400).json({ message: "Already registered" });
    }

    const reg = await storage.createRegistration(userId, eventId);

    // Broadcast update
    broadcast({ type: 'UPDATE_REGISTRATIONS', eventId });

    res.status(201).json(reg);
  });

  // Seed Data
  if (process.env.NODE_ENV !== 'production') {
    const users = await storage.getUserByUsername('organizer');
    if (!users) {
      const hashedPassword = await hashPassword('password123');
      const org = await storage.createUser({
        username: 'organizer',
        password: hashedPassword,
        role: 'organizer'
      });
      const user = await storage.createUser({
        username: 'user',
        password: hashedPassword,
        role: 'user'
      });

      await storage.createEvent({
        organizerId: org.id,
        title: "Tech Conference 2024",
        description: "Annual tech gathering",
        date: new Date('2024-12-01'),
        location: "San Francisco",
        maxParticipants: 100
      });

      await storage.createEvent({
        organizerId: org.id,
        title: "Local Meetup",
        description: "Weekly developer meetup",
        date: new Date('2024-10-15'),
        location: "Community Center",
        maxParticipants: 20
      });
    }
  }

  return httpServer;
}
