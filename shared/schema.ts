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

// Positions management table (quản lý chức vụ)
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // president, vice-president, secretary, head, vice-head, member
  displayName: text("display_name").notNull(), // Chủ nhiệm, Phó chủ nhiệm, etc.
  level: integer("level").notNull(), // Higher number = higher position
  isLeadership: boolean("is_leadership").notNull().default(false), // true for president, vice-president
  isDepartmentLevel: boolean("is_department_level").notNull().default(false), // true for head, vice-head
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Divisions/sections table (bảng ban)
export const divisions = pgTable("divisions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#3B82F6"),
  icon: text("icon").notNull().default("Users"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  studentId: text("student_id"),
  email: text("email"),
  phone: text("phone"),
  class: text("class").notNull(),
  divisionId: integer("division_id").references(() => divisions.id).notNull(), // Main division assignment
  positionId: integer("position_id").references(() => positions.id).notNull(), // Reference to positions table
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(), // Which academic year they belong to
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

// Academic years/terms table (khóa)
export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Khóa 2024-2025"
  startDate: timestamp("start_date").notNull(), // November of current year
  endDate: timestamp("end_date").notNull(), // November of next year
  isActive: boolean("is_active").notNull().default(false),
  description: text("description"),
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
  division: one(divisions, {
    fields: [members.divisionId],
    references: [divisions.id],
  }),
  position: one(positions, {
    fields: [members.positionId],
    references: [positions.id],
  }),
  academicYear: one(academicYears, {
    fields: [members.academicYearId],
    references: [academicYears.id],
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

// API Keys table for third-party access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Tên mô tả của API key
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(), // Hash của API key
  permissions: text("permissions").array().notNull(), // Array of permissions
  isActive: boolean("is_active").default(true).notNull(),
  lastUsed: timestamp("last_used"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiry date
});

// Missions/Tasks table
export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'daily', 'weekly', 'monthly', 'special', 'project'
  type: text("type").notNull(), // 'one_time', 'repeatable'
  maxParticipants: integer("max_participants"), // null = unlimited
  currentParticipants: integer("current_participants").default(0).notNull(),
  beePointsReward: integer("bee_points_reward").default(0).notNull(),
  requiresPhoto: boolean("requires_photo").default(false).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  priority: text("priority").default("medium").notNull(), // 'low', 'medium', 'high', 'urgent'
  status: text("status").default("active").notNull(), // 'active', 'paused', 'completed', 'cancelled'
  tags: text("tags").array().default([]),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Mission Assignments table (many-to-many between users and missions)
export const missionAssignments = pgTable("mission_assignments", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("assigned").notNull(), // 'assigned', 'in_progress', 'completed', 'submitted', 'rejected'
  assignedDate: timestamp("assigned_date").defaultNow().notNull(),
  startedDate: timestamp("started_date"),
  completedDate: timestamp("completed_date"),
  submissionNote: text("submission_note"),
  reviewNote: text("review_note"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  pointsAwarded: integer("points_awarded").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Mission Submissions table (for photo uploads and proof)
export const missionSubmissions = pgTable("mission_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => missionAssignments.id, { onDelete: "cascade" }).notNull(),
  uploadId: integer("upload_id").references(() => uploads.id, { onDelete: "cascade" }),
  submissionText: text("submission_text"),
  submissionData: jsonb("submission_data"), // For additional structured data
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
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
  createdBy: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

// Mission relations
export const missionsRelations = relations(missions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [missions.createdBy],
    references: [users.id],
    relationName: "missionCreatedBy",
  }),
  updatedBy: one(users, {
    fields: [missions.updatedBy],
    references: [users.id],
    relationName: "missionUpdatedBy",
  }),
  assignments: many(missionAssignments),
}));

export const missionAssignmentsRelations = relations(missionAssignments, ({ one, many }) => ({
  mission: one(missions, {
    fields: [missionAssignments.missionId],
    references: [missions.id],
  }),
  user: one(users, {
    fields: [missionAssignments.userId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [missionAssignments.reviewedBy],
    references: [users.id],
    relationName: "assignmentReviewedBy",
  }),
  submissions: many(missionSubmissions),
}));

export const missionSubmissionsRelations = relations(missionSubmissions, ({ one }) => ({
  assignment: one(missionAssignments, {
    fields: [missionSubmissions.assignmentId],
    references: [missionAssignments.id],
  }),
  upload: one(uploads, {
    fields: [missionSubmissions.uploadId],
    references: [uploads.id],
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
  createdMissions: many(missions, { relationName: "missionCreatedBy" }),
  updatedMissions: many(missions, { relationName: "missionUpdatedBy" }),
  missionAssignments: many(missionAssignments),
  reviewedAssignments: many(missionAssignments, { relationName: "assignmentReviewedBy" }),
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

// Mission schemas
export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  currentParticipants: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tags: z.array(z.string()).default([]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const insertMissionAssignmentSchema = createInsertSchema(missionAssignments).omit({
  id: true,
  assignedDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMissionSubmissionSchema = createInsertSchema(missionSubmissions).omit({
  id: true,
  submittedAt: true,
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

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

export type InsertMissionAssignment = z.infer<typeof insertMissionAssignmentSchema>;
export type MissionAssignment = typeof missionAssignments.$inferSelect;

export type InsertMissionSubmission = z.infer<typeof insertMissionSubmissionSchema>;
export type MissionSubmission = typeof missionSubmissions.$inferSelect;

// Extended types
export type UserWithRole = User & {
  role: Role;
};

export type MemberWithDepartment = Member & {
  department?: Department;
  division?: Division;
  position?: Position;
  academicYear?: AcademicYear;
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

// API Key types
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

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
  
  // Division permissions
  DIVISION_VIEW: "division:view",
  DIVISION_CREATE: "division:create",
  DIVISION_EDIT: "division:edit",
  DIVISION_DELETE: "division:delete",
  
  // Position permissions
  POSITION_VIEW: "position:view",
  POSITION_CREATE: "position:create",
  POSITION_EDIT: "position:edit",
  POSITION_DELETE: "position:delete",
  
  // Academic Year permissions
  ACADEMIC_YEAR_VIEW: "academic_year:view",
  ACADEMIC_YEAR_CREATE: "academic_year:create",
  ACADEMIC_YEAR_EDIT: "academic_year:edit",
  ACADEMIC_YEAR_DELETE: "academic_year:delete",
  ACADEMIC_YEAR_ACTIVATE: "academic_year:activate",
  
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
  
  // BeePoint permissions
  BEEPOINT_VIEW: "beepoint:view",
  BEEPOINT_MANAGE: "beepoint:manage",
  BEEPOINT_AWARD: "beepoint:award",
  BEEPOINT_CONFIG: "beepoint:config",
  BEEPOINT_TRANSACTION_VIEW: "beepoint_transaction:view",
  
  // API Key permissions
  API_KEY_VIEW: "api_key:view",
  API_KEY_CREATE: "api_key:create",
  API_KEY_EDIT: "api_key:edit",
  API_KEY_DELETE: "api_key:delete",
  
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
  divisionId: z.number().min(1, "Ban là bắt buộc"),
  positionId: z.number().min(1, "Chức vụ là bắt buộc"),
  academicYearId: z.number().min(1, "Khóa học là bắt buộc"),
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

// Dynamic statistics table for flexible data tracking
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // members, achievements, points, events, departments
  type: text("type").notNull(), // count, sum, avg, percentage
  name: text("name").notNull(), // descriptive name
  description: text("description"),
  value: text("value").notNull(), // stored as text to handle different data types
  metadata: jsonb("metadata").default({}), // additional data like filters, time range, etc.
  isPublic: boolean("is_public").notNull().default(false), // whether to show in public stats
  isActive: boolean("is_active").notNull().default(true),
  lastCalculated: timestamp("last_calculated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table types and schemas
export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = typeof academicYears.$inferInsert;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

export type Division = typeof divisions.$inferSelect;
export type InsertDivision = typeof divisions.$inferInsert;

export type Statistic = typeof statistics.$inferSelect;
export type InsertStatistic = typeof statistics.$inferInsert;

export const insertAcademicYearSchema = createInsertSchema(academicYears);
export const insertPositionSchema = createInsertSchema(positions);
export const insertDivisionSchema = createInsertSchema(divisions);
export const insertStatisticSchema = createInsertSchema(statistics);
