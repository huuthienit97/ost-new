import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { 
  members, 
  divisions, 
  positions, 
  academicYears, 
  users,
  roles,
  beePoints,
  pointTransactions,
  achievements,
  userAchievements,
  apiKeys,
  type InsertMember,
  createMemberSchema,
  insertMemberSchema
} from "@shared/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { authenticate, authorize, hashPassword, AuthenticatedRequest } from "./auth";
import { apiKeyAuth, requireApiPermission, flexibleAuth, ApiKeyRequest } from "./apiKeyAuth";
import { PERMISSIONS } from "@shared/schema";
import { dbStorage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all members with division info
  app.get("/api/members", authenticate, authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const { type, department, position, search } = req.query;
      
      const membersWithDetails = await db
        .select({
          id: members.id,
          fullName: members.fullName,
          studentId: members.studentId,
          email: members.email,
          phone: members.phone,
          class: members.class,
          divisionId: members.divisionId,
          positionId: members.positionId,
          academicYearId: members.academicYearId,
          memberType: members.memberType,
          joinDate: members.joinDate,
          notes: members.notes,
          userId: members.userId,
          isActive: members.isActive,
          createdAt: members.createdAt,
          division: {
            id: divisions.id,
            name: divisions.name,
            color: divisions.color,
            icon: divisions.icon,
          },
          position: {
            id: positions.id,
            name: positions.name,
            displayName: positions.displayName,
            level: positions.level,
          },
          academicYear: {
            id: academicYears.id,
            name: academicYears.name,
          },
          user: {
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            email: users.email,
          },
        })
        .from(members)
        .leftJoin(divisions, eq(divisions.id, members.divisionId))
        .leftJoin(positions, eq(positions.id, members.positionId))
        .leftJoin(academicYears, eq(academicYears.id, members.academicYearId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(eq(members.isActive, true));
      
      let filteredMembers = membersWithDetails;
      
      // Apply filters
      if (type && typeof type === 'string') {
        filteredMembers = filteredMembers.filter(member => member.memberType === type);
      }
      
      if (department && typeof department === 'string') {
        const deptId = parseInt(department);
        if (!isNaN(deptId)) {
          filteredMembers = filteredMembers.filter(member => member.divisionId === deptId);
        }
      }
      
      if (position && typeof position === 'string') {
        const posId = parseInt(position);
        if (!isNaN(posId)) {
          filteredMembers = filteredMembers.filter(member => member.positionId === posId);
        }
      }
      
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredMembers = filteredMembers.filter(member =>
          member.fullName.toLowerCase().includes(searchLower) ||
          (member.studentId && member.studentId.toLowerCase().includes(searchLower)) ||
          member.class.toLowerCase().includes(searchLower) ||
          (member.division?.name && member.division.name.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(filteredMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Create new member
  app.post("/api/members", authenticate, authorize(PERMISSIONS.MEMBER_CREATE), async (req: AuthenticatedRequest, res) => {
    try {
      const validationResult = createMemberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.issues 
        });
      }

      const memberData = validationResult.data;
      
      // Check if studentId already exists (only if studentId is provided)
      if (memberData.studentId) {
        const existingMembers = await dbStorage.getMembers();
        if (existingMembers.some(m => m.studentId === memberData.studentId)) {
          return res.status(400).json({ message: "Mã học sinh đã tồn tại" });
        }
      }
      
      // Validate division exists
      const [division] = await db.select().from(divisions).where(eq(divisions.id, memberData.divisionId));
      if (!division) {
        return res.status(400).json({ message: "Ban không tồn tại" });
      }

      const newMember = await dbStorage.createMember(memberData);
      const memberWithDivision = await dbStorage.getMemberWithDepartment(newMember.id);
      
      let userCredentials = null;
      
      // Create user account if requested
      if (memberData.createUserAccount) {
        try {
          // Generate username from full name
          const username = memberData.fullName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);
          
          // Generate random password
          const password = Math.random().toString(36).slice(-8);
          const hashedPassword = await hashPassword(password);
          
          // Get member role (default role for members)
          const roles = await dbStorage.getRoles();
          const memberRole = roles.find(r => r.name === 'member');
          if (!memberRole) {
            throw new Error("Member role not found");
          }
          
          // Create user account using storage method
          const newUser = await dbStorage.createUser({
            username,
            email: memberData.email || `${username}@example.com`,
            fullName: memberData.fullName,
            passwordHash: hashedPassword,
            roleId: memberRole.id,
            mustChangePassword: true,
            isActive: true,
          });
          
          userCredentials = {
            username,
            password, // Return plain password for display
          };
        } catch (error) {
          console.error("Error creating user account:", error);
          // Don't fail member creation if user account creation fails
        }
      }
      
      const result = {
        ...memberWithDivision,
        userCredentials,
      };
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(500).json({ message: "Failed to create member", error: (error as any).message });
    }
  });

  // Other existing routes...
  
  const httpServer = createServer(app);
  return httpServer;
}