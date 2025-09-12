import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionStatus: varchar("subscription_status").default('free'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calculator definitions
export const calculators = pgTable("calculators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  description: text("description"),
  template: varchar("template"),
  formula: text("formula"),
  fields: jsonb("fields").notNull().$type<CalculatorField[]>(),
  styling: jsonb("styling").$type<CalculatorStyling>(),
  isPublished: boolean("is_published").default(false),
  requiresPayment: boolean("requires_payment").default(false),
  price: integer("price"), // in cents
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),
  revenue: integer("revenue").default(0), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calculator field types
export type CalculatorField = {
  id: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'result';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  position: {
    x: number;
    y: number;
  };
};

export type CalculatorStyling = {
  theme: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
};

// Templates
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  fields: jsonb("fields").notNull().$type<CalculatorField[]>(),
  formula: text("formula").notNull(),
  preview: varchar("preview"),
  isPopular: boolean("is_popular").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertCalculatorSchema = createInsertSchema(calculators).omit({
  id: true,
  userId: true,
  views: true,
  conversions: true,
  revenue: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Calculator = typeof calculators.$inferSelect;
export type InsertCalculator = z.infer<typeof insertCalculatorSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
