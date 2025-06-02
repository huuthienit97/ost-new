import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Roles table for permission system
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  permissions: text("permissions").array().notNull().default([]),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table for authentication and role assignment
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phone: text("phone"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  studentId: text("student_id"),
  email: text("email"),
  phone: text("phone"),
  class: text("class").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  position: text("position").notNull(), // president, vice-president, secretary, head, vice-head, member
  memberType: text("member_type").notNull(), // active, alumni
  joinDate: text("join_date").notNull(),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));



export const uploadsRelations = relations(uploads, ({ one }) => ({
  uploader: one(users, {
    fields: [uploads.uploadedBy],
    references: [users.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one }) => ({
  department: one(departments, {
    fields: [members.departmentId],
    references: [departments.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [members.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  updatedByUser: one(users, {
    fields: [members.updatedBy],
    references: [users.id],
    relationName: "updatedBy",
  }),
}));

// BeePoint system tables
export const beePoints = pgTable("bee_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  currentPoints: integer("current_points").default(0).notNull(),
  totalEarned: integer("total_earned").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // Positive for earning, negative for spending
  type: text("type").notNull(), // 'welcome_bonus', 'activity', 'reward', 'purchase', etc.
  description: text("description").notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// BeePoint relations
export const beePointsRelations = relations(beePoints, ({ one }) => ({
  user: one(users, {
    fields: [beePoints.userId],
    references: [users.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [pointTransactions.createdBy],
    references: [users.id],
    relationName: "transactionCreatedBy",
  }),
}));

// Achievements/Awards table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'academic', 'creative', 'leadership', 'participation', 'special'
  level: text("level").notNull(), // 'bronze', 'silver', 'gold', 'special'
  badgeIcon: text("badge_icon"), // Icon name or emoji
  badgeColor: text("badge_color").default("#3B82F6"), // Badge color
  pointsReward: integer("points_reward").default(0), // BeePoints awarded
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User achievements (many-to-many relationship)
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  awardedDate: timestamp("awarded_date").defaultNow().notNull(),
  awardedBy: integer("awarded_by").references(() => users.id), // Who granted the achievement
  notes: text("notes"), // Additional notes about the achievement
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Keys table for public API access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  permissions: jsonb("permissions").notNull().default('[]'), // Array of permissions
  isActive: boolean("is_active").default(true).notNull(),
  rateLimit: integer("rate_limit").default(1000).notNull(), // Requests per hour
  lastUsed: timestamp("last_used"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration
});

// Achievement relations
export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
  awardedByUser: one(users, {
    fields: [userAchievements.awardedBy],
    references: [users.id],
    relationName: "achievementAwardedBy",
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  createdByUser: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  createdMembers: many(members, { relationName: "createdBy" }),
  updatedMembers: many(members, { relationName: "updatedBy" }),
  uploads: many(uploads),
  beePoints: one(beePoints),
  pointTransactions: many(pointTransactions),
  createdTransactions: many(pointTransactions, {
    relationName: "transactionCreatedBy",
  }),
  userAchievements: many(userAchievements),
  awardedAchievements: many(userAchievements, { relationName: "achievementAwardedBy" }),
  createdApiKeys: many(apiKeys),
}));

// Insert schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  studentId: z.string().optional(),
});

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  bio: z.string().optional(),
  phone: z.string().optional(),
  facebookUrl: z.string().url("URL Facebook không hợp lệ").optional().or(z.literal("")),
  instagramUrl: z.string().url("URL Instagram không hợp lệ").optional().or(z.literal("")),
  tiktokUrl: z.string().url("URL TikTok không hợp lệ").optional().or(z.literal("")),
  youtubeUrl: z.string().url("URL YouTube không hợp lệ").optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL LinkedIn không hợp lệ").optional().or(z.literal("")),
  githubUrl: z.string().url("URL GitHub không hợp lệ").optional().or(z.literal("")),
});

// Types
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Extended types
export type UserWithRole = User & {
  role: Role;
};

export type MemberWithDepartment = Member & {
  department: Department;
  user?: {
    id: number;
    username: string;
    fullName: string;
    email: string;
  } | null;
};

// Settings and uploads types
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

export type BeePoint = typeof beePoints.$inferSelect;
export type InsertBeePoint = typeof beePoints.$inferInsert;

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;

export type UserWithBeePoints = User & {
  beePoints?: BeePoint;
};

// Position hierarchy enum
export const POSITIONS = {
  president: "Chủ nhiệm",
  "vice-president": "Phó chủ nhiệm", 
  secretary: "Thư ký",
  head: "Trưởng ban",
  "vice-head": "Phó ban",
  member: "Thành viên",
} as const;

export const MEMBER_TYPES = {
  active: "Thành viên hiện tại",
  alumni: "Cựu thành viên",
} as const;

// Permissions constants
export const PERMISSIONS = {
  // Member permissions
  MEMBER_VIEW: "member:view",
  MEMBER_CREATE: "member:create",
  MEMBER_EDIT: "member:edit",
  MEMBER_DELETE: "member:delete",
  
  // Department permissions
  DEPARTMENT_VIEW: "department:view",
  DEPARTMENT_CREATE: "department:create",
  DEPARTMENT_EDIT: "department:edit",
  DEPARTMENT_DELETE: "department:delete",
  
  // User permissions
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_EDIT: "user:edit",
  USER_DELETE: "user:delete",
  
  // Role permissions
  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_EDIT: "role:edit",
  ROLE_DELETE: "role:delete",
  
  // Settings permissions
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",
  
  // Upload permissions
  UPLOAD_CREATE: "upload:create",
  UPLOAD_VIEW: "upload:view",
  UPLOAD_DELETE: "upload:delete",
  
  // Achievement permissions
  ACHIEVEMENT_VIEW: "achievement:view",
  ACHIEVEMENT_CREATE: "achievement:create",
  ACHIEVEMENT_EDIT: "achievement:edit",
  ACHIEVEMENT_DELETE: "achievement:delete",
  ACHIEVEMENT_AWARD: "achievement:award",
  
  // System permissions
  SYSTEM_ADMIN: "system:admin",
  STATS_VIEW: "stats:view",
} as const;

// Role constants
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

// Validation schemas
export const createRoleSchema = insertRoleSchema.extend({
  name: z.string().min(1, "Tên vai trò là bắt buộc"),
  displayName: z.string().min(1, "Tên hiển thị là bắt buộc"),
  permissions: z.array(z.string()).min(1, "Ít nhất một quyền hạn là bắt buộc"),
});

export const createUserSchema = insertUserSchema.extend({
  username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  fullName: z.string().min(1, "Họ và tên là bắt buộc"),
  roleId: z.number().min(1, "Vai trò là bắt buộc"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
});

export const createMemberSchema = insertMemberSchema.extend({
  fullName: z.string().min(1, "Họ và tên là bắt buộc"),
  studentId: z.string().optional().or(z.literal("")),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional(),
  class: z.string().min(1, "Lớp là bắt buộc"),
  departmentId: z.number().min(1, "Ban là bắt buộc"),
  position: z.enum(["president", "vice-president", "secretary", "head", "vice-head", "member"]),
  memberType: z.enum(["active", "alumni"]),
  joinDate: z.string().min(1, "Ngày gia nhập là bắt buộc"),
  createUserAccount: z.boolean().optional(),
});

// Achievement constants
export const ACHIEVEMENT_CATEGORIES = {
  academic: "Học tập",
  creative: "Sáng tạo", 
  leadership: "Lãnh đạo",
  participation: "Tham gia",
  special: "Đặc biệt",
} as const;

export const ACHIEVEMENT_LEVELS = {
  bronze: "Đồng",
  silver: "Bạc", 
  gold: "Vàng",
  special: "Đặc biệt",
} as const;

// Achievement types
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// Achievement schemas
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);

export const createAchievementSchema = insertAchievementSchema.extend({
  title: z.string().min(1, "Tiêu đề thành tích là bắt buộc"),
  category: z.enum(["academic", "creative", "leadership", "participation", "special"]),
  level: z.enum(["bronze", "silver", "gold", "special"]),
  pointsReward: z.number().min(0, "Điểm thưởng phải là số dương"),
});

export const awardAchievementSchema = z.object({
  userId: z.number().min(1, "Người dùng là bắt buộc"),
  achievementId: z.number().min(1, "Thành tích là bắt buộc"),
  notes: z.string().optional(),
});
