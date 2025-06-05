import { 
  members, 
  departments,
  divisions,
  positions,
  academicYears,
  users,
  roles,
  settings,
  uploads,
  beePoints,
  pointTransactions,
  apiKeys,
  achievements,
  userAchievements,
  type Member, 
  type Department, 
  type Division,
  type Position,
  type AcademicYear,
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
  type InsertPointTransaction,
  type ApiKey,
  type InsertApiKey,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement
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

  // Department methods (deprecated - keeping for backward compatibility)
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Division methods
  getDivisions(): Promise<Division[]>;
  getDivision(id: number): Promise<Division | undefined>;

  // Member methods
  getMembers(): Promise<Member[]>;
  getMembersWithDepartments(): Promise<MemberWithDepartment[]>;
  getMember(id: number): Promise<Member | undefined>;
  getMemberWithDepartment(id: number): Promise<MemberWithDepartment | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: number): Promise<boolean>;
  getMembersByDepartment(departmentId: number): Promise<Member[]>;
  getMembersByDivision(divisionId: number): Promise<Member[]>;
  getMembersByType(memberType: string): Promise<Member[]>;
  getMembersByPosition(position: string): Promise<Member[]>;
  searchMembers(query: string): Promise<Member[]>;

  // Settings methods
  getSettings(): Promise<Setting[]>;
  getAllSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<Setting>;
  createSetting(key: string, value: string, description?: string): Promise<Setting>;
  updateSetting(key: string, value: string, description?: string): Promise<Setting>;
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

  // Achievement methods
  getAchievements(): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, updates: Partial<InsertAchievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: number): Promise<boolean>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;

  // API Key methods
  getApiKeys(): Promise<ApiKey[]>;
  getApiKey(id: number): Promise<ApiKey | undefined>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, updates: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<boolean>;
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

  // Division methods
  async getDivisions(): Promise<Division[]> {
    return await db.select().from(divisions);
  }

  async getDivision(id: number): Promise<Division | undefined> {
    const [division] = await db.select().from(divisions).where(eq(divisions.id, id));
    return division || undefined;
  }

  async getMembersByDivision(divisionId: number): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.divisionId, divisionId));
  }

  async getMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async getMembersWithDepartments(): Promise<MemberWithDepartment[]> {
    const result = await db
      .select({
        id: members.id,
        fullName: members.fullName,
        studentId: members.studentId,
        email: members.email,
        phone: members.phone,
        class: members.class,
        departmentId: members.departmentId,
        position: members.position,
        memberType: members.memberType,
        joinDate: members.joinDate,
        notes: members.notes,
        userId: members.userId,
        isActive: members.isActive,
        createdBy: members.createdBy,
        updatedBy: members.updatedBy,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt,
        department: {
          id: departments.id,
          name: departments.name,
          icon: departments.icon,
          color: departments.color,
        },
        user: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
        }
      })
      .from(members)
      .leftJoin(departments, eq(members.departmentId, departments.id))
      .leftJoin(users, eq(members.userId, users.id));
    
    return result
      .filter(row => row.department !== null)
      .map(row => ({
        id: row.id,
        fullName: row.fullName,
        studentId: row.studentId,
        email: row.email,
        phone: row.phone,
        class: row.class,
        departmentId: row.departmentId,
        position: row.position,
        memberType: row.memberType,
        joinDate: row.joinDate,
        notes: row.notes,
        userId: row.userId,
        isActive: row.isActive,
        createdBy: row.createdBy,
        updatedBy: row.updatedBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        department: row.department as Department,
        user: row.user,
      }));
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberWithDepartment(id: number): Promise<MemberWithDepartment | undefined> {
    const result = await db
      .select({
        id: members.id,
        fullName: members.fullName,
        studentId: members.studentId,
        email: members.email,
        phone: members.phone,
        class: members.class,
        departmentId: members.departmentId,
        position: members.position,
        memberType: members.memberType,
        joinDate: members.joinDate,
        notes: members.notes,
        userId: members.userId,
        isActive: members.isActive,
        createdBy: members.createdBy,
        updatedBy: members.updatedBy,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt,
        department: {
          id: departments.id,
          name: departments.name,
          icon: departments.icon,
          color: departments.color,
        },
        user: {
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
        }
      })
      .from(members)
      .leftJoin(departments, eq(members.departmentId, departments.id))
      .leftJoin(users, eq(members.userId, users.id))
      .where(eq(members.id, id));
    
    if (result.length === 0 || !result[0].department) return undefined;
    
    const row = result[0];
    return {
      id: row.id,
      fullName: row.fullName,
      studentId: row.studentId,
      email: row.email,
      phone: row.phone,
      class: row.class,
      departmentId: row.departmentId,
      position: row.position,
      memberType: row.memberType,
      joinDate: row.joinDate,
      notes: row.notes,
      userId: row.userId,
      isActive: row.isActive,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      department: row.department as Department,
      user: row.user,
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

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.key);
  }

  async createSetting(key: string, value: string, description?: string): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values({ key, value, description, updatedAt: new Date() })
      .returning();
    return setting;
  }

  async updateSetting(key: string, value: string, description?: string): Promise<Setting> {
    const [setting] = await db
      .update(settings)
      .set({ value, description, updatedAt: new Date() })
      .where(eq(settings.key, key))
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
    return await db.select().from(uploads).where(eq(uploads.uploadedBy, userId)).orderBy(desc(uploads.createdAt));
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

    // Update user's bee points (only for the transaction user, not the creator)
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

  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement || undefined;
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
    return achievement;
  }

  async updateAchievement(id: number, updates: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const [achievement] = await db
      .update(achievements)
      .set(updates)
      .where(eq(achievements.id, id))
      .returning();
    return achievement || undefined;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    const result = await db.delete(achievements).where(eq(achievements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [awarded] = await db
      .insert(userAchievements)
      .values(userAchievement)
      .returning();
    return awarded;
  }

  // API Key methods
  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys);
  }

  async getApiKey(id: number): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return apiKey || undefined;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return apiKey || undefined;
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(insertApiKey)
      .returning();
    return apiKey;
  }

  async updateApiKey(id: number, updates: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, id))
      .returning();
    return apiKey || undefined;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Shop system methods
  async getShopProducts(): Promise<ShopProduct[]> {
    return await db.select().from(shopProducts).where(eq(shopProducts.isActive, true));
  }

  async getShopProduct(id: number): Promise<ShopProduct | undefined> {
    const [product] = await db.select().from(shopProducts).where(eq(shopProducts.id, id));
    return product || undefined;
  }

  async createShopProduct(insertProduct: InsertShopProduct): Promise<ShopProduct> {
    const [product] = await db
      .insert(shopProducts)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateShopProduct(id: number, updates: Partial<InsertShopProduct>): Promise<ShopProduct | undefined> {
    const [product] = await db
      .update(shopProducts)
      .set(updates)
      .where(eq(shopProducts.id, id))
      .returning();
    return product || undefined;
  }

  async deleteShopProduct(id: number): Promise<boolean> {
    const result = await db.delete(shopProducts).where(eq(shopProducts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Shop order methods
  async getShopOrders(): Promise<ShopOrder[]> {
    return await db.select().from(shopOrders);
  }

  async getShopOrder(id: number): Promise<ShopOrder | undefined> {
    const [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, id));
    return order || undefined;
  }

  async getUserShopOrders(userId: number): Promise<ShopOrder[]> {
    return await db.select().from(shopOrders).where(eq(shopOrders.userId, userId));
  }

  async createShopOrder(insertOrder: InsertShopOrder): Promise<ShopOrder> {
    const [order] = await db
      .insert(shopOrders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateShopOrder(id: number, updates: Partial<InsertShopOrder>): Promise<ShopOrder | undefined> {
    const [order] = await db
      .update(shopOrders)
      .set(updates)
      .where(eq(shopOrders.id, id))
      .returning();
    return order || undefined;
  }

  // BeePoint circulation methods
  async getBeePointCirculation(): Promise<BeePointCirculation | undefined> {
    const [circulation] = await db.select().from(beePointCirculation).limit(1);
    return circulation || undefined;
  }

  async updateBeePointCirculation(updates: Partial<BeePointCirculation>): Promise<BeePointCirculation> {
    let circulation = await this.getBeePointCirculation();
    
    if (!circulation) {
      // Initialize circulation if it doesn't exist
      const [newCirculation] = await db
        .insert(beePointCirculation)
        .values({
          totalSupply: updates.totalSupply || 0,
          totalDistributed: updates.totalDistributed || 0,
          totalRedeemed: updates.totalRedeemed || 0,
          circulatingSupply: updates.circulatingSupply || 0,
        })
        .returning();
      return newCirculation;
    }

    const [updatedCirculation] = await db
      .update(beePointCirculation)
      .set({
        ...updates,
        lastUpdated: new Date(),
      })
      .where(eq(beePointCirculation.id, circulation.id))
      .returning();
    
    return updatedCirculation;
  }

  // Transaction method for BeePoint redemption
  async redeemBeePoints(userId: number, orderId: number, pointsToRedeem: number): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // Get user's current BeePoints
        const [userBeePoints] = await tx
          .select()
          .from(beePoints)
          .where(eq(beePoints.userId, userId));

        if (!userBeePoints || userBeePoints.currentPoints < pointsToRedeem) {
          throw new Error("Insufficient BeePoints");
        }

        // Deduct points from user
        await tx
          .update(beePoints)
          .set({
            currentPoints: userBeePoints.currentPoints - pointsToRedeem,
            totalSpent: userBeePoints.totalSpent + pointsToRedeem,
          })
          .where(eq(beePoints.userId, userId));

        // Record transaction
        await tx
          .insert(pointTransactions)
          .values({
            userId,
            type: "redemption",
            amount: -pointsToRedeem,
            description: `Đổi thưởng - Order #${orderId}`,
            relatedId: orderId,
          });

        // Update circulation - points return to system
        const circulation = await this.getBeePointCirculation();
        if (circulation) {
          await tx
            .update(beePointCirculation)
            .set({
              totalRedeemed: circulation.totalRedeemed + pointsToRedeem,
              circulatingSupply: circulation.circulatingSupply - pointsToRedeem,
              lastUpdated: new Date(),
            })
            .where(eq(beePointCirculation.id, circulation.id));
        }

        return true;
      });
    } catch (error) {
      console.error("Error redeeming BeePoints:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
