import {
  users,
  calculators,
  templates,
  type User,
  type UpsertUser,
  type Calculator,
  type InsertCalculator,
  type Template,
  type InsertTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  
  // Calculator operations
  getCalculators(userId: string): Promise<Calculator[]>;
  getCalculator(id: string, userId?: string): Promise<Calculator | undefined>;
  getPublicCalculator(id: string): Promise<Calculator | undefined>;
  createCalculator(calculator: InsertCalculator & { userId: string }): Promise<Calculator>;
  updateCalculator(id: string, calculator: Partial<InsertCalculator>, userId: string): Promise<Calculator>;
  deleteCalculator(id: string, userId: string): Promise<void>;
  incrementCalculatorViews(id: string): Promise<void>;
  incrementCalculatorConversions(id: string, revenue?: number): Promise<void>;
  
  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: stripeSubscriptionId ? 'active' : 'free',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Calculator operations
  async getCalculators(userId: string): Promise<Calculator[]> {
    return await db
      .select()
      .from(calculators)
      .where(eq(calculators.userId, userId))
      .orderBy(desc(calculators.updatedAt));
  }

  async getCalculator(id: string, userId?: string): Promise<Calculator | undefined> {
    const conditions = userId 
      ? and(eq(calculators.id, id), eq(calculators.userId, userId))
      : eq(calculators.id, id);
    
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(conditions);
    return calculator;
  }

  async getPublicCalculator(id: string): Promise<Calculator | undefined> {
    const [calculator] = await db
      .select()
      .from(calculators)
      .where(and(eq(calculators.id, id), eq(calculators.isPublished, true)));
    return calculator;
  }

  async createCalculator(calculator: InsertCalculator & { userId: string }): Promise<Calculator> {
    const [newCalculator] = await db
      .insert(calculators)
      .values({
        ...calculator,
        fields: calculator.fields || [],
      })
      .returning();
    return newCalculator;
  }

  async updateCalculator(id: string, calculator: Partial<InsertCalculator>, userId: string): Promise<Calculator> {
    const updateData = {
      ...calculator,
      updatedAt: new Date(),
    };
    if (calculator.fields) {
      updateData.fields = calculator.fields;
    }
    
    const [updatedCalculator] = await db
      .update(calculators)
      .set(updateData)
      .where(and(eq(calculators.id, id), eq(calculators.userId, userId)))
      .returning();
    return updatedCalculator;
  }

  async deleteCalculator(id: string, userId: string): Promise<void> {
    await db
      .delete(calculators)
      .where(and(eq(calculators.id, id), eq(calculators.userId, userId)));
  }

  async incrementCalculatorViews(id: string): Promise<void> {
    await db
      .update(calculators)
      .set({
        views: sql`${calculators.views} + 1`,
      })
      .where(eq(calculators.id, id));
  }

  async incrementCalculatorConversions(id: string, revenue = 0): Promise<void> {
    await db
      .update(calculators)
      .set({
        conversions: sql`${calculators.conversions} + 1`,
        revenue: sql`${calculators.revenue} + ${revenue}`,
      })
      .where(eq(calculators.id, id));
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .orderBy(desc(templates.isPopular), desc(templates.createdAt));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id));
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db
      .insert(templates)
      .values({
        ...template,
        fields: template.fields || [],
      })
      .returning();
    return newTemplate;
  }
}

export const storage = new DatabaseStorage();
