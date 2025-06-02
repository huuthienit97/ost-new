import { 
  members, 
  departments,
  users,
  roles,
  type Member, 
  type Department, 
  type InsertMember, 
  type InsertDepartment, 
  type MemberWithDepartment,
  type User,
  type Role,
  type InsertUser,
  type InsertRole,
  type UserWithRole
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Role methods
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, updates: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // User methods
  getUsers(): Promise<User[]>;
  getUsersWithRoles(): Promise<UserWithRole[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserWithRole(id: number): Promise<UserWithRole | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Department methods
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Member methods
  getMembers(): Promise<Member[]>;
  getMembersWithDepartments(): Promise<MemberWithDepartment[]>;
  getMember(id: number): Promise<Member | undefined>;
  getMemberWithDepartment(id: number): Promise<MemberWithDepartment | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: number): Promise<boolean>;
  getMembersByDepartment(departmentId: number): Promise<Member[]>;
  getMembersByType(memberType: string): Promise<Member[]>;
  getMembersByPosition(position: string): Promise<Member[]>;
  searchMembers(query: string): Promise<Member[]>;

  // Settings methods
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<Setting>;
  deleteSetting(key: string): Promise<boolean>;

  // Upload methods
  getUploads(): Promise<Upload[]>;
  getUpload(id: number): Promise<Upload | undefined>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  deleteUpload(id: number): Promise<boolean>;
  getUploadsByUser(userId: number): Promise<Upload[]>;
}

export class DatabaseStorage implements IStorage {
  // Role methods
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }

  async updateRole(id: number, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, id))
      .returning();
    return role || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersWithRoles(): Promise<UserWithRole[]> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id));
    
    return result.map(row => ({
      ...row.users,
      role: row.roles!,
    }));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserWithRole(id: number): Promise<UserWithRole | undefined> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id));
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.users,
      role: row.roles!,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async getMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async getMembersWithDepartments(): Promise<MemberWithDepartment[]> {
    const result = await db
      .select()
      .from(members)
      .leftJoin(departments, eq(members.departmentId, departments.id));
    
    return result.map(row => ({
      ...row.members,
      department: row.departments!,
    }));
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberWithDepartment(id: number): Promise<MemberWithDepartment | undefined> {
    const result = await db
      .select()
      .from(members)
      .leftJoin(departments, eq(members.departmentId, departments.id))
      .where(eq(members.id, id));
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.members,
      department: row.departments!,
    };
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db
      .insert(members)
      .values({ ...insertMember, isActive: true })
      .returning();
    return member;
  }

  async updateMember(id: number, updates: Partial<InsertMember>): Promise<Member | undefined> {
    const [member] = await db
      .update(members)
      .set(updates)
      .where(eq(members.id, id))
      .returning();
    return member || undefined;
  }

  async deleteMember(id: number): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getMembersByDepartment(departmentId: number): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.departmentId, departmentId));
  }

  async getMembersByType(memberType: string): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.memberType, memberType));
  }

  async getMembersByPosition(position: string): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.position, position));
  }

  async searchMembers(query: string): Promise<Member[]> {
    return await db
      .select()
      .from(members)
      .where(
        or(
          ilike(members.fullName, `%${query}%`),
          ilike(members.studentId, `%${query}%`),
          ilike(members.class, `%${query}%`),
          ilike(members.email, `%${query}%`)
        )
      );
  }
}

export const storage = new DatabaseStorage();
