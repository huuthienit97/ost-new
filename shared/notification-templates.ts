import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notificationTemplates = pgTable("notification_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().$type<'system' | 'mission' | 'achievement' | 'beepoint' | 'social' | 'custom'>(),
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates, {
  name: z.string().min(1, "Tên mẫu không được để trống").max(255),
  title: z.string().min(1, "Tiêu đề không được để trống").max(500),
  content: z.string().min(1, "Nội dung không được để trống"),
  type: z.enum(['system', 'mission', 'achievement', 'beepoint', 'social', 'custom']),
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;