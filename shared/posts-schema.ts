import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./schema";

// User Posts table for social media features
export const userPosts = pgTable("user_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  imageUrls: text("image_urls").array().default([]),
  likes: integer("likes").default(0).notNull(),
  comments: integer("comments").default(0).notNull(),
  visibility: text("visibility").notNull().default("public"), // public, friends, private
  isPinned: boolean("is_pinned").default(false).notNull(), // For admin pinned posts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Post Likes table
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => userPosts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post Comments table
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => userPosts.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const userPostsRelations = relations(userPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [userPosts.userId],
    references: [users.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(userPosts, {
    fields: [postLikes.postId],
    references: [userPosts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(userPosts, {
    fields: [postComments.postId],
    references: [userPosts.id],
  }),
  author: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserPostSchema = createInsertSchema(userPosts).omit({
  id: true,
  likes: true,
  comments: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserPost = z.infer<typeof insertUserPostSchema>;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type UserPost = typeof userPosts.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type PostLike = typeof postLikes.$inferSelect;