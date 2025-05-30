import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  isActive: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Extended type for member with department info
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

// Validation schemas
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
