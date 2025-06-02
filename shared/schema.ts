import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  studentId: text("student_id").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  class: text("class").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  position: text("position").notNull(), // president, vice-president, secretary, head, vice-head, member
  memberType: text("member_type").notNull(), // active, alumni
  joinDate: text("join_date").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  createdMembers: many(members, { relationName: "createdBy" }),
  updatedMembers: many(members, { relationName: "updatedBy" }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one }) => ({
  department: one(departments, {
    fields: [members.departmentId],
    references: [departments.id],
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

// Extended types
export type UserWithRole = User & {
  role: Role;
};

export type MemberWithDepartment = Member & {
  department: Department;
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
  studentId: z.string().min(1, "Mã học sinh là bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional(),
  class: z.string().min(1, "Lớp là bắt buộc"),
  departmentId: z.number().min(1, "Ban là bắt buộc"),
  position: z.enum(["president", "vice-president", "secretary", "head", "vice-head", "member"]),
  memberType: z.enum(["active", "alumni"]),
  joinDate: z.string().min(1, "Ngày gia nhập là bắt buộc"),
});
