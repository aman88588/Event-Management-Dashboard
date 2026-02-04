import { db } from "./db";
import { users, events, registrations, type User, type InsertUser, type InsertEvent, type Event, type Registration } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Events
  getEvents(): Promise<(Event & { registrationCount: number })[]>;
  getEvent(id: number): Promise<(Event & { registrationCount: number }) | undefined>;
  getEventsByOrganizer(organizerId: number): Promise<(Event & { registrationCount: number })[]>;
  createEvent(event: InsertEvent & { organizerId: number }): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // Registrations
  createRegistration(userId: number, eventId: number): Promise<Registration>;
  getRegistration(userId: number, eventId: number): Promise<Registration | undefined>;
  getRegistrationsByEvent(eventId: number): Promise<Registration[]>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getEvents(): Promise<(Event & { registrationCount: number })[]> {
    // Join with registrations to count them
    const result = await db
      .select({
        ...events,
        registrationCount: sql<number>`count(${registrations.id})::int`
      })
      .from(events)
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .groupBy(events.id);
    return result;
  }

  async getEvent(id: number): Promise<(Event & { registrationCount: number }) | undefined> {
    const [event] = await db
      .select({
        ...events,
        registrationCount: sql<number>`count(${registrations.id})::int`
      })
      .from(events)
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .where(eq(events.id, id))
      .groupBy(events.id);
    return event;
  }

  async getEventsByOrganizer(organizerId: number): Promise<(Event & { registrationCount: number })[]> {
    const result = await db
      .select({
        ...events,
        registrationCount: sql<number>`count(${registrations.id})::int`
      })
      .from(events)
      .leftJoin(registrations, eq(events.id, registrations.eventId))
      .where(eq(events.organizerId, organizerId))
      .groupBy(events.id);
    return result;
  }

  async createEvent(event: InsertEvent & { organizerId: number }): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    // Delete registrations first (cascade manually if not set in DB, though good to be explicit)
    await db.delete(registrations).where(eq(registrations.eventId, id));
    await db.delete(events).where(eq(events.id, id));
  }

  async createRegistration(userId: number, eventId: number): Promise<Registration> {
    const [reg] = await db.insert(registrations).values({ userId, eventId }).returning();
    return reg;
  }

  async getRegistration(userId: number, eventId: number): Promise<Registration | undefined> {
    const [reg] = await db.select().from(registrations).where(
      and(eq(registrations.userId, userId), eq(registrations.eventId, eventId))
    );
    return reg;
  }
  
  async getRegistrationsByEvent(eventId: number): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.eventId, eventId));
  }
}

export const storage = new DatabaseStorage();
