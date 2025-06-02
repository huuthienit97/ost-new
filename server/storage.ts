import { 
  members, 
  departments,
  users,
  roles,
  settings,
  uploads,
  beePoints,
  pointTransactions,
  type Member, 
  type Department, 
  type InsertMember, 
  type InsertDepartment, 
  type MemberWithDepartment,
  type User,
  type Role,
  type InsertUser,
  type InsertRole,
  type UserWithRole,
  type UserWithBeePoints,
  type Setting,
  type Upload,
  type InsertSetting,
  type InsertUpload,
  type BeePoint,
  type InsertBeePoint,
  type PointTransaction,
  type InsertPointTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc } from "drizzle-orm";

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

  // BeePoint methods
  getUserBeePoints(userId: number): Promise<BeePoint | undefined>;
  createUserBeePoints(userId: number): Promise<BeePoint>;
  updateUserBeePoints(userId: number, points: number): Promise<BeePoint>;
  addPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  getUserPointTransactions(userId: number): Promise<PointTransaction[]>;
  getUserWithBeePoints(userId: number): Promise<UserWithBeePoints | undefined>;
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

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.key);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string, description?: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value, description, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, description, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  async deleteSetting(key: string): Promise<boolean> {
    const result = await db.delete(settings).where(eq(settings.key, key));
    return (result.rowCount ?? 0) > 0;
  }

  // Upload methods
  async getUploads(): Promise<Upload[]> {
    return await db.select().from(uploads).orderBy(desc(uploads.createdAt));
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async createUpload(upload: InsertUpload): Promise<Upload> {
    const [newUpload] = await db.insert(uploads).values(upload).returning();
    return newUpload;
  }

  async deleteUpload(id: number): Promise<boolean> {
    const result = await db.delete(uploads).where(eq(uploads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUploadsByUser(userId: number): Promise<Upload[]> {
    return await db.select().from(uploads).where(eq(uploads.uploadedBy, userId)).orderBy(desc(uploads.uploadedAt));
  }

  // BeePoint methods
  async getUserBeePoints(userId: number): Promise<BeePoint | undefined> {
    const [beePoint] = await db.select().from(beePoints).where(eq(beePoints.userId, userId));
    return beePoint;
  }

  async createUserBeePoints(userId: number): Promise<BeePoint> {
    const [beePoint] = await db
      .insert(beePoints)
      .values({
        userId,
        currentPoints: 50, // Welcome bonus
        totalEarned: 50,
        totalSpent: 0,
      })
      .returning();
    return beePoint;
  }

  async updateUserBeePoints(userId: number, pointsChange: number): Promise<BeePoint> {
    const currentBeePoints = await this.getUserBeePoints(userId);
    if (!currentBeePoints) {
      throw new Error("BeePoints record not found for user");
    }

    const newCurrentPoints = currentBeePoints.currentPoints + pointsChange;
    const newTotalEarned = pointsChange > 0 ? currentBeePoints.totalEarned + pointsChange : currentBeePoints.totalEarned;
    const newTotalSpent = pointsChange < 0 ? currentBeePoints.totalSpent + Math.abs(pointsChange) : currentBeePoints.totalSpent;

    const [updatedBeePoints] = await db
      .update(beePoints)
      .set({
        currentPoints: newCurrentPoints,
        totalEarned: newTotalEarned,
        totalSpent: newTotalSpent,
        updatedAt: new Date(),
      })
      .where(eq(beePoints.userId, userId))
      .returning();

    return updatedBeePoints;
  }

  async addPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction> {
    const [newTransaction] = await db
      .insert(pointTransactions)
      .values(transaction)
      .returning();

    // Update user's bee points
    await this.updateUserBeePoints(transaction.userId, transaction.amount);

    return newTransaction;
  }

  async getUserPointTransactions(userId: number): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt));
  }

  async getUserWithBeePoints(userId: number): Promise<UserWithBeePoints | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const userBeePoints = await this.getUserBeePoints(userId);
    return {
      ...user,
      beePoints: userBeePoints,
    };
  }
}

export const storage = new DatabaseStorage();
