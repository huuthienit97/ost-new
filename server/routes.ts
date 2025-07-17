import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { db } from "./db";
import { users, members, beePoints, pointTransactions, achievements, userAchievements, departments, positions, divisions, academicYears, statistics, missions, missionAssignments, missionSubmissions, uploads, shopProducts, shopOrders, shopCategories, roles, notifications, notificationStatus, userConnections, chatRooms, chatRoomMembers, chatMessages, notificationTemplates, userSettings } from "@shared/schema";
import { userPosts as posts, postLikes, postComments } from "@shared/posts-schema";
import { createMemberSchema, insertMemberSchema, createUserSchema, createRoleSchema, updateUserProfileSchema, createAchievementSchema, awardAchievementSchema, insertMissionSchema, insertMissionAssignmentSchema, insertMissionSubmissionSchema, insertNotificationSchema, insertShopCategorySchema, insertShopProductSchema, insertShopOrderSchema, insertBeePointTransactionSchema, PERMISSIONS, insertNotificationTemplateSchema } from "@shared/schema";
import { authenticate, authorize, hashPassword, verifyPassword, generateToken, AuthenticatedRequest } from "./auth";
import { z } from "zod";
import { eq, and, desc, ilike, or, isNotNull, isNull, sql, gte, lte, ne, not, inArray, asc, like, count } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { NotificationWebSocketServer } from "./websocket";
import { notificationService } from "./notificationService";
import { chatService } from "./chatService";
import { verifyToken } from "./auth";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Mobile-friendly image formats (Android/iOS support)
    const allowedImageTypes = /jpeg|jpg|png|gif|webp|heic|heif|avif/;
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Check MIME types with mobile format support
    const isImage = file.mimetype.startsWith('image/') || 
                   ['image/heic', 'image/heif', 'image/avif'].includes(file.mimetype);
    const isDoc = /application\/|text\//.test(file.mimetype);
    
    if ((isImage || isDoc) && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh (JPG, PNG, WebP, HEIC, HEIF) và tài liệu'));
    }
  }
});

/**
 * @swagger
 * /api/auth/check-init:
 *   get:
 *     tags: [Public]
 *     summary: Kiểm tra hệ thống có cần khởi tạo không
 *     description: API công khai để kiểm tra xem hệ thống đã được khởi tạo chưa
 *     responses:
 *       200:
 *         description: Trạng thái khởi tạo hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 needsInit:
 *                   type: boolean
 *                   description: true nếu hệ thống cần khởi tạo
 */

/**
 * @swagger
 * /api/auth/init:
 *   post:
 *     tags: [Public]
 *     summary: Khởi tạo tài khoản quản trị viên đầu tiên
 *     description: Tạo tài khoản quản trị viên mặc định nếu chưa có người dùng nào trong hệ thống
 *     responses:
 *       200:
 *         description: Tài khoản được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 username:
 *                   type: string
 *                 defaultPassword:
 *                   type: string
 *       400:
 *         description: Hệ thống đã được khởi tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập vào hệ thống
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Thông tin đăng nhập không chính xác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Lấy thông tin người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Admin Only]
 *     summary: Lấy danh sách vai trò
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách vai trò
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *   post:
 *     tags: [Super Admin]
 *     summary: Tạo vai trò mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       201:
 *         description: Vai trò được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Admin Only]
 *     summary: Lấy danh sách người dùng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *   post:
 *     tags: [Admin Only]
 *     summary: Tạo người dùng mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: Người dùng được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [User Access]
 *     summary: Lấy danh sách ban
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách ban
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Department'
 */

/**
 * @swagger
 * /api/members:
 *   get:
 *     tags: [User Access]
 *     summary: Lấy danh sách thành viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [active, alumni]
 *         description: Lọc theo loại thành viên
 *       - in: query
 *         name: department
 *         schema:
 *           type: integer
 *         description: Lọc theo ID ban
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Lọc theo chức vụ
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, mã học sinh, lớp
 *     responses:
 *       200:
 *         description: Danh sách thành viên
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Member'
 *   post:
 *     tags: [Admin Only]
 *     summary: Tạo thành viên mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMemberRequest'
 *     responses:
 *       201:
 *         description: Thành viên được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 */

/**
 * @swagger
 * /api/members/{id}:
 *   get:
 *     tags: [User Access]
 *     summary: Lấy thông tin thành viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thành viên
 *     responses:
 *       200:
 *         description: Thông tin thành viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 *       404:
 *         description: Không tìm thấy thành viên
 *   put:
 *     tags: [Admin Only]
 *     summary: Cập nhật thông tin thành viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thành viên
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMemberRequest'
 *     responses:
 *       200:
 *         description: Thành viên được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 *   delete:
 *     tags: [Admin Only]
 *     summary: Xóa thành viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thành viên
 *     responses:
 *       204:
 *         description: Thành viên được xóa thành công
 *       404:
 *         description: Không tìm thấy thành viên
 */

/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags: [Public]
 *     summary: Lấy thống kê hệ thống
 *     responses:
 *       200:
 *         description: Thống kê hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMembers:
 *                   type: integer
 *                 activeMembers:
 *                   type: integer
 *                 alumniMembers:
 *                   type: integer
 *                 totalDepartments:
 *                   type: integer
 */

export async function registerRoutes(app: Express): Promise<Server> {
  // Public API - Must be before other routes
  /**
   * @swagger
   * /api/public/users:
   *   get:
   *     summary: Lấy danh sách tất cả users (Public API)
   *     description: Endpoint công khai để lấy danh sách users đang hoạt động, không cần token xác thực
   *     tags: [Public]
   *     responses:
   *       200:
   *         description: Danh sách users đang hoạt động
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                     description: ID của user
   *                   username:
   *                     type: string
   *                     description: Tên đăng nhập
   *                   fullName:
   *                     type: string
   *                     description: Họ và tên đầy đủ
   *                   email:
   *                     type: string
   *                     description: Email của user
   *                   avatarUrl:
   *                     type: string
   *                     nullable: true
   *                     description: URL ảnh đại diện
   *                   isActive:
   *                     type: boolean
   *                     description: Trạng thái hoạt động
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                     description: Thời gian tạo tài khoản
   *       500:
   *         description: Lỗi server
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/public/users", async (req, res) => {
    try {
      const usersWithPositions = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          avatarUrl: users.avatarUrl,
          isActive: users.isActive,
          createdAt: users.createdAt,
          position: positions.displayName,
          positionLevel: positions.level,
          departmentName: departments.name,
          divisionName: divisions.name,
          memberType: members.memberType,
          academicYear: academicYears.name,
        })
        .from(users)
        .leftJoin(members, eq(members.userId, users.id))

        .leftJoin(positions, eq(positions.id, members.positionId))
        .leftJoin(divisions, eq(divisions.id, members.divisionId))
        .leftJoin(academicYears, eq(academicYears.id, members.academicYearId))
        .where(eq(users.isActive, true));
      
      res.json(usersWithPositions);
    } catch (error) {
      console.error("Error fetching public users:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách users" });
    }
  });

  // Check if system needs initialization
  app.get("/api/auth/check-init", async (req, res) => {
    try {
      const users = await dbStorage.getUsers();
      res.json({ needsInit: users.length === 0 });
    } catch (error) {
      console.error("Error checking system initialization:", error);
      res.status(500).json({ message: "Lỗi kiểm tra khởi tạo hệ thống" });
    }
  });

  // Initialize default admin user
  app.post("/api/auth/init", async (req, res) => {
    try {
      // Check if any users exist
      const users = await dbStorage.getUsers();
      if (users.length > 0) {
        return res.status(400).json({ message: "Hệ thống đã được khởi tạo" });
      }

      // Create default admin user
      const passwordHash = await hashPassword("admin123");
      const adminUser = await dbStorage.createUser({
        username: "admin",
        email: "admin@club.edu.vn",
        passwordHash,
        fullName: "Quản trị viên",
        roleId: 1, // super_admin role
        isActive: true,
      });

      res.json({ 
        message: "Tài khoản quản trị viên đã được tạo",
        username: "admin",
        defaultPassword: "admin123"
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khởi tạo hệ thống" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Tên đăng nhập và mật khẩu là bắt buộc" });
      }

      const user = await dbStorage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      const userWithRole = await dbStorage.getUserWithRole(user.id);
      if (!userWithRole) {
        return res.status(500).json({ message: "Lỗi hệ thống" });
      }

      const token = generateToken(user, userWithRole.role.permissions);
      
      // Update last login would require updating the schema to include lastLogin in update type

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: userWithRole.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi đăng nhập" });
    }
  });

  // ===== PERMISSION MANAGEMENT API =====
  // Get all available permissions in the system
  app.get("/api/permissions", authenticate, authorize(PERMISSIONS.ROLE_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const allPermissions = Object.values(PERMISSIONS);
      const permissionGroups: Record<string, string[]> = {};
      
      // Group permissions by category
      allPermissions.forEach(permission => {
        const [category] = permission.split(':');
        if (!permissionGroups[category]) {
          permissionGroups[category] = [];
        }
        permissionGroups[category].push(permission);
      });

      res.json({
        total: allPermissions.length,
        permissions: allPermissions,
        groupedPermissions: permissionGroups
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách permissions" });
    }
  });

  // Get permissions for a specific role
  app.get("/api/roles/:id/permissions", authenticate, authorize(PERMISSIONS.ROLE_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const role = await dbStorage.getRole(roleId);
      
      if (!role) {
        return res.status(404).json({ message: "Role không tồn tại" });
      }

      const allPermissions = Object.values(PERMISSIONS);
      
      res.json({
        role: {
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          permissions: role.permissions
        },
        availablePermissions: allPermissions,
        permissionsCount: role.permissions.length
      });
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Lỗi lấy permissions của role" });
    }
  });

  // Update permissions for a specific role
  app.put("/api/roles/:id/permissions", authenticate, authorize(PERMISSIONS.ROLE_EDIT), async (req: AuthenticatedRequest, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "Permissions phải là array" });
      }

      // Validate all permissions exist
      const validPermissions = Object.values(PERMISSIONS);
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          message: "Permissions không hợp lệ", 
          invalidPermissions 
        });
      }

      // Check if role exists and is not system protected
      const existingRole = await dbStorage.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({ message: "Role không tồn tại" });
      }

      if (existingRole.isSystem && !req.user!.permissions.includes(PERMISSIONS.SYSTEM_ADMIN)) {
        return res.status(403).json({ message: "Không thể sửa đổi system role" });
      }

      const updatedRole = await dbStorage.updateRole(roleId, { permissions });
      
      if (!updatedRole) {
        return res.status(404).json({ message: "Cập nhật thất bại" });
      }

      res.json({
        message: "Cập nhật permissions thành công",
        role: updatedRole,
        changedPermissions: {
          added: permissions.filter(p => !existingRole.permissions.includes(p)),
          removed: existingRole.permissions.filter(p => !permissions.includes(p))
        }
      });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({ message: "Lỗi cập nhật permissions" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userWithRole = await dbStorage.getUserWithRole(req.user!.id);
      if (!userWithRole) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      // Get member information if user is linked to a member
      let memberInfo = null;
      try {
        const members = await dbStorage.getMembers();
        const member = members.find(m => m.userId === req.user!.id);
        if (member) {
          memberInfo = {
            id: member.id,
            studentId: member.studentId,
            class: member.class,
            divisionId: member.divisionId,
            positionId: member.positionId,
            academicYearId: member.academicYearId,
            memberType: member.memberType,
            joinDate: member.joinDate,
            notes: member.notes
          };
        }
      } catch (error) {
        // Member info is optional, continue without it
        console.log("No member info found for user:", req.user!.id);
      }

      // Get BeePoint information
      let beePointInfo = null;
      try {
        const beePoints = await dbStorage.getUserBeePoints(req.user!.id);
        if (beePoints) {
          beePointInfo = {
            currentPoints: beePoints.currentPoints,
            totalEarned: beePoints.totalEarned,
            totalSpent: beePoints.totalSpent
          };
        }
      } catch (error) {
        // BeePoint info is optional, continue without it
        console.log("No BeePoint info found for user:", req.user!.id);
      }

      // Add no-cache headers to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json({
        user: {
          id: userWithRole.id,
          username: userWithRole.username,
          email: userWithRole.email,
          fullName: userWithRole.fullName,
          role: userWithRole.role,
          mustChangePassword: userWithRole.mustChangePassword,
          avatarUrl: userWithRole.avatarUrl && !userWithRole.avatarUrl.startsWith('/uploads/') 
            ? `/uploads/${userWithRole.avatarUrl}` 
            : userWithRole.avatarUrl,
          bio: userWithRole.bio,
          phone: userWithRole.phone,
          facebookUrl: userWithRole.facebookUrl,
          instagramUrl: userWithRole.instagramUrl,
          tiktokUrl: userWithRole.tiktokUrl,
          youtubeUrl: userWithRole.youtubeUrl,
          linkedinUrl: userWithRole.linkedinUrl,
          githubUrl: userWithRole.githubUrl,
          lastLogin: userWithRole.lastLogin,
          createdAt: userWithRole.createdAt,
          member: memberInfo,
          beePoints: beePointInfo
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin người dùng" });
    }
  });

  // Role management routes
  app.get("/api/roles", authenticate, authorize(PERMISSIONS.ROLE_VIEW), async (req, res) => {
    try {
      const roles = await dbStorage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Lỗi lấy danh sách vai trò" });
    }
  });

  app.post("/api/roles", authenticate, authorize(PERMISSIONS.ROLE_CREATE), async (req, res) => {
    try {
      const validationResult = createRoleSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: validationResult.error.issues 
        });
      }

      const role = await dbStorage.createRole(validationResult.data);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Lỗi tạo vai trò" });
    }
  });

  app.put("/api/roles/:id", authenticate, authorize(PERMISSIONS.ROLE_EDIT), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const validationResult = createRoleSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: validationResult.error.issues 
        });
      }

      const updatedRole = await dbStorage.updateRole(roleId, validationResult.data);
      
      if (!updatedRole) {
        return res.status(404).json({ message: "Không tìm thấy vai trò" });
      }
      
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Lỗi cập nhật vai trò" });
    }
  });

  app.delete("/api/roles/:id", authenticate, authorize(PERMISSIONS.ROLE_DELETE), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      
      // Check if role exists and is not system protected
      const existingRole = await dbStorage.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({ message: "Không tìm thấy vai trò" });
      }

      if (existingRole.isSystem) {
        return res.status(403).json({ message: "Không thể xóa vai trò hệ thống" });
      }

      // Check if any users are assigned to this role
      const users = await dbStorage.getUsersWithRoles();
      const usersWithRole = users.filter(user => user.roleId === roleId);
      
      if (usersWithRole.length > 0) {
        return res.status(400).json({ 
          message: `Không thể xóa vai trò vì còn ${usersWithRole.length} người dùng đang sử dụng` 
        });
      }

      const deleted = await dbStorage.deleteRole(roleId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy vai trò" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Lỗi xóa vai trò" });
    }
  });

  // User management routes
  app.get("/api/users", authenticate, authorize(PERMISSIONS.USER_VIEW), async (req, res) => {
    try {
      const users = await dbStorage.getUsersWithRoles();
      // Remove password hashes from response
      const safeUsers = users.map(user => ({
        ...user,
        passwordHash: undefined,
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Lỗi lấy danh sách người dùng" });
    }
  });

  app.post("/api/users", authenticate, authorize(PERMISSIONS.USER_CREATE), async (req, res) => {
    try {
      const validationResult = createUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: validationResult.error.issues 
        });
      }

      const { password, ...userData } = validationResult.data;
      
      // Check if username or email already exists
      const existingUser = await dbStorage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
      }

      const existingEmail = await dbStorage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }

      const passwordHash = await hashPassword(password);
      const user = await dbStorage.createUser({
        ...userData,
        passwordHash,
      });

      // Create BeePoints for new user with welcome bonus
      await dbStorage.createUserBeePoints(user.id);

      // Remove password hash from response
      res.status(201).json({
        ...user,
        passwordHash: undefined,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi tạo người dùng" });
    }
  });

  app.put("/api/users/:id", authenticate, authorize(PERMISSIONS.USER_EDIT), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { roleId, isActive } = req.body;

      if (!roleId || typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
      }

      const updatedUser = await dbStorage.updateUser(userId, { roleId, isActive });
      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      const userWithRole = await dbStorage.getUserWithRole(userId);
      const safeUser = {
        ...userWithRole,
        passwordHash: undefined,
      };
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật người dùng" });
    }
  });

  // Get all departments
  app.get("/api/departments", authenticate, authorize(PERMISSIONS.DEPARTMENT_VIEW), async (req, res) => {
    try {
      const departments = await dbStorage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Get all members with department info
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
        .leftJoin(users, eq(users.id, members.userId));
      
      let filteredMembers = membersWithDetails;
      
      // Apply filters
      if (type && typeof type === 'string') {
        if (type === 'active') {
          filteredMembers = filteredMembers.filter(member => member.isActive === true);
        } else if (type === 'alumni') {
          filteredMembers = filteredMembers.filter(member => member.memberType === 'alumni' || member.isActive === false);
        } else {
          filteredMembers = filteredMembers.filter(member => member.memberType === type);
        }
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

  // Get user login information by userId
  app.get("/api/users/:userId/login-info", authenticate, authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      // Get user basic information
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        isActive: users.isActive,
        mustChangePassword: users.mustChangePassword,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        role: {
          id: roles.id,
          name: roles.name,
          displayName: roles.displayName,
        }
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Get associated member information if exists
      const [memberInfo] = await db.select({
        id: members.id,
        studentId: members.studentId,
        fullName: members.fullName,
        email: members.email,
        phone: members.phone,
        isActive: members.isActive,
        division: {
          id: divisions.id,
          name: divisions.name,
        },
        position: {
          id: positions.id,
          name: positions.name,
          displayName: positions.displayName,
        },
        academicYear: {
          id: academicYears.id,
          name: academicYears.name,
        }
      })
      .from(members)
      .leftJoin(divisions, eq(members.divisionId, divisions.id))
      .leftJoin(positions, eq(members.positionId, positions.id))
      .leftJoin(academicYears, eq(members.academicYearId, academicYears.id))
      .where(eq(members.userId, userId));

      const result = {
        ...user,
        member: memberInfo || null,
      };

      res.json(result);
    } catch (error) {
      console.error("Error fetching user login info:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin đăng nhập người dùng" });
    }
  });

  // Reset user password by userId
  app.post("/api/users/:userId/reset-password", authenticate, authorize(PERMISSIONS.MEMBER_EDIT), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Generate new random password
      const newPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(newPassword);

      // Update user password and force password change
      await db
        .update(users)
        .set({ 
          passwordHash: hashedPassword,
          mustChangePassword: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({
        message: "Đặt lại mật khẩu thành công",
        newPassword, // Return plain password for display
        username: user.username
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Lỗi đặt lại mật khẩu" });
    }
  });

  // Toggle user account status
  app.post("/api/users/:userId/toggle-status", authenticate, authorize(PERMISSIONS.MEMBER_EDIT), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Toggle active status
      const newStatus = !user.isActive;
      await db
        .update(users)
        .set({ 
          isActive: newStatus,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({
        message: newStatus ? "Kích hoạt tài khoản thành công" : "Vô hiệu hóa tài khoản thành công",
        isActive: newStatus
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Lỗi thay đổi trạng thái tài khoản" });
    }
  });

  // Get all users with login information for admin management
  app.get("/api/admin/users", authenticate, authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const usersWithDetails = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        isActive: users.isActive,
        mustChangePassword: users.mustChangePassword,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        role: {
          id: roles.id,
          name: roles.name,
          displayName: roles.displayName,
        },
        member: {
          id: members.id,
          studentId: members.studentId,
          fullName: members.fullName,
          email: members.email,
          phone: members.phone,
          isActive: members.isActive,
          division: {
            id: divisions.id,
            name: divisions.name,
          },
          position: {
            id: positions.id,
            name: positions.name,
            displayName: positions.displayName,
          }
        }
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(members, eq(users.id, members.userId))
      .leftJoin(divisions, eq(members.divisionId, divisions.id))
      .leftJoin(positions, eq(members.positionId, positions.id))
      .orderBy(users.createdAt);

      res.json(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách người dùng" });
    }
  });

  // Create user account for existing member
  app.post("/api/admin/members/:memberId/create-user", authenticate, authorize(PERMISSIONS.MEMBER_EDIT), async (req: AuthenticatedRequest, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "ID thành viên không hợp lệ" });
      }

      // Get member information
      const [member] = await db.select().from(members).where(eq(members.id, memberId));
      if (!member) {
        return res.status(404).json({ message: "Không tìm thấy thành viên" });
      }

      if (member.userId) {
        return res.status(400).json({ message: "Thành viên đã có tài khoản đăng nhập" });
      }

      // Generate unique username from full name
      let baseUsername = member.fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 12);
      
      let username = baseUsername;
      let counter = 1;
      let isUsernameTaken = true;
      
      while (isUsernameTaken) {
        const existingUser = await db.select().from(users).where(eq(users.username, username));
        if (existingUser.length === 0) {
          isUsernameTaken = false;
        } else {
          username = `${baseUsername}${counter}`;
          counter++;
          if (counter > 999) {
            return res.status(400).json({ message: "Không thể tạo username duy nhất" });
          }
        }
      }
      
      // Generate random password
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(password);
      
      // Get member role (default role for members)
      const allRoles = await dbStorage.getRoles();
      const memberRole = allRoles.find(r => r.name === 'member');
      if (!memberRole) {
        return res.status(500).json({ message: "Không tìm thấy role member" });
      }
      
      // Create user account
      const newUser = await dbStorage.createUser({
        username,
        email: member.email || `${username}@example.com`,
        fullName: member.fullName,
        passwordHash: hashedPassword,
        roleId: memberRole.id,
        mustChangePassword: true,
        isActive: true,
      });

      // Update member with userId link
      await db
        .update(members)
        .set({ userId: newUser.id })
        .where(eq(members.id, memberId));

      res.json({
        message: "Tạo tài khoản đăng nhập thành công",
        user: {
          id: newUser.id,
          username,
          password, // Return plain password for display
          email: newUser.email,
          mustChangePassword: true
        }
      });
    } catch (error) {
      console.error("Error creating user account:", error);
      res.status(500).json({ message: "Lỗi tạo tài khoản đăng nhập" });
    }
  });

  // Delete user account
  app.delete("/api/admin/users/:userId", authenticate, authorize(PERMISSIONS.MEMBER_DELETE), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Prevent deleting admin users
      if (user.roleId === 1) { // Assuming roleId 1 is admin
        return res.status(400).json({ message: "Không thể xóa tài khoản quản trị viên" });
      }

      // Remove userId link from member if exists
      await db
        .update(members)
        .set({ userId: null })
        .where(eq(members.userId, userId));

      // Delete user account
      await db.delete(users).where(eq(users.id, userId));

      res.json({ message: "Xóa tài khoản đăng nhập thành công" });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: "Lỗi xóa tài khoản đăng nhập" });
    }
  });

  // Get member by ID
  app.get("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }
      
      const member = await dbStorage.getMemberWithDepartment(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
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
      
      // Validate division exists if divisionId is provided
      if (memberData.divisionId) {
        const [division] = await db.select().from(divisions).where(eq(divisions.id, memberData.divisionId));
        if (!division) {
          return res.status(400).json({ message: "Ban không tồn tại" });
        }
      }

      const newMember = await dbStorage.createMember(memberData);
      
      // Get the full member details with relationships
      const [memberWithDetails] = await db
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
          updatedAt: members.updatedAt,
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
        .leftJoin(divisions, eq(members.divisionId, divisions.id))
        .leftJoin(positions, eq(members.positionId, positions.id))
        .leftJoin(academicYears, eq(members.academicYearId, academicYears.id))
        .leftJoin(users, eq(members.userId, users.id))
        .where(eq(members.id, newMember.id));
      
      let userCredentials = null;
      
      // Create user account if requested
      if (memberData.createUserAccount) {
        try {
          // Validate required data for account creation
          if (!memberData.fullName || memberData.fullName.trim() === '') {
            throw new Error("Full name is required for account creation");
          }

          // Generate unique username from full name
          let baseUsername = memberData.fullName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 12);
          
          // Check for existing usernames and add suffix if needed
          let username = baseUsername;
          let counter = 1;
          let isUsernameTaken = true;
          
          while (isUsernameTaken) {
            const existingUser = await db.select().from(users).where(eq(users.username, username));
            if (existingUser.length === 0) {
              isUsernameTaken = false;
            } else {
              username = `${baseUsername}${counter}`;
              counter++;
              if (counter > 999) {
                throw new Error("Cannot generate unique username");
              }
            }
          }
          
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

          // Update member with userId link
          await db
            .update(members)
            .set({ userId: newUser.id })
            .where(eq(members.id, newMember.id));
          
          userCredentials = {
            username,
            password, // Return plain password for display
          };
        } catch (error) {
          console.error("Error creating user account:", error);
          // Don't fail member creation if user account creation fails
          return res.status(500).json({ 
            message: "Failed to create member", 
            error: `Account creation failed: ${(error as any).message}`
          });
        }
      }
      
      const result = {
        ...memberWithDetails,
        userCredentials,
      };
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(500).json({ message: "Failed to create member", error: (error as any).message });
    }
  });

  // Update member
  app.put("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const validationResult = insertMemberSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.issues 
        });
      }

      const updateData = validationResult.data;
      
      // If updating studentId, check for conflicts
      if (updateData.studentId) {
        const existingMembers = await dbStorage.getMembers();
        if (existingMembers.some(m => m.studentId === updateData.studentId && m.id !== id)) {
          return res.status(400).json({ message: "Mã học sinh đã tồn tại" });
        }
      }
      
      // If updating division, validate it exists
      if (updateData.divisionId) {
        const [division] = await db.select().from(divisions).where(eq(divisions.id, updateData.divisionId));
        if (!division) {
          return res.status(400).json({ message: "Ban không tồn tại" });
        }
      }

      const updatedMember = await dbStorage.updateMember(id, updateData);
      if (!updatedMember) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Get updated member with details
      const [updatedMemberWithDetails] = await db
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
          updatedAt: members.updatedAt,
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
        .leftJoin(divisions, eq(members.divisionId, divisions.id))
        .leftJoin(positions, eq(members.positionId, positions.id))
        .leftJoin(academicYears, eq(members.academicYearId, academicYears.id))
        .leftJoin(users, eq(members.userId, users.id))
        .where(eq(members.id, updatedMember.id));
      
      res.json(updatedMemberWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Delete member
  app.delete("/api/members/:id", authenticate, authorize(PERMISSIONS.MEMBER_DELETE), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      // Get member to check if it has associated user account
      const [member] = await db.select({
        id: members.id,
        userId: members.userId,
        fullName: members.fullName
      }).from(members).where(eq(members.id, id));

      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // If member has associated user account, deactivate it first
      if (member.userId) {
        await db
          .update(users)
          .set({ 
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(users.id, member.userId));
      }

      const deleted = await dbStorage.deleteMember(id);
      if (!deleted) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.json({ 
        message: "Xóa thành viên thành công",
        userAccountDeactivated: !!member.userId
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Get member statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const allMembers = await dbStorage.getMembers();
      const departments = await dbStorage.getDepartments();
      
      const activeMembers = allMembers.filter(m => m.memberType === 'active').length;
      const alumniMembers = allMembers.filter(m => m.memberType === 'alumni').length;
      
      const stats = {
        totalMembers: allMembers.length,
        activeMembers,
        alumniMembers,
        totalDepartments: departments.length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });



  /**
   * @swagger
   * /api/academic-years:
   *   get:
   *     summary: Lấy danh sách khóa học
   *     description: Lấy danh sách khóa học (từ tháng 11 đến tháng 11 năm sau)
   *     tags: [Academic Years]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách khóa học
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   startDate:
   *                     type: string
   *                     format: date-time
   *                   endDate:
   *                     type: string
   *                     format: date-time
   *                   isActive:
   *                     type: boolean
   *                   description:
   *                     type: string
   */
  app.get("/api/academic-years", authenticate, async (req, res) => {
    try {
      const years = await db.select().from(academicYears).orderBy(desc(academicYears.startDate));
      res.json(years);
    } catch (error) {
      console.error("Error fetching academic years:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách khóa học" });
    }
  });

  /**
   * @swagger
   * /api/academic-years:
   *   post:
   *     summary: Tạo khóa học mới
   *     tags: [📅 Academic Years]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, startDate, endDate]
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Khóa 2025-2026"
   *               startDate:
   *                 type: string
   *                 format: date
   *                 example: "2025-11-01"
   *               endDate:
   *                 type: string
   *                 format: date
   *                 example: "2026-11-01"
   *               description:
   *                 type: string
   *                 example: "Khóa học năm 2025-2026"
   *               isActive:
   *                 type: boolean
   *                 example: false
   *     responses:
   *       201:
   *         description: Khóa học được tạo thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AcademicYear'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   */
  app.post("/api/academic-years", authenticate, authorize([PERMISSIONS.ACADEMIC_YEAR_CREATE]), async (req, res) => {
    try {
      const { name, startDate, endDate, description } = req.body;
      
      // Deactivate current active year if setting new one as active
      if (req.body.isActive) {
        await db.update(academicYears).set({ isActive: false });
      }
      
      const [newYear] = await db
        .insert(academicYears)
        .values({ 
          name, 
          startDate: new Date(startDate), 
          endDate: new Date(endDate), 
          description, 
          isActive: req.body.isActive || false 
        })
        .returning();
      
      res.status(201).json(newYear);
    } catch (error) {
      console.error("Error creating academic year:", error);
      res.status(500).json({ message: "Lỗi tạo khóa học" });
    }
  });

  app.delete("/api/academic-years/:id", authenticate, authorize([PERMISSIONS.ACADEMIC_YEAR_DELETE]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if academic year has members
      const membersCount = await db.select({ count: sql`count(*)` }).from(members).where(eq(members.academicYearId, id));
      if (parseInt(membersCount[0].count as string) > 0) {
        return res.status(400).json({ message: "Không thể xóa khóa học có thành viên" });
      }
      
      await db.delete(academicYears).where(eq(academicYears.id, id));
      res.json({ message: "Đã xóa khóa học" });
    } catch (error) {
      console.error("Error deleting academic year:", error);
      res.status(500).json({ message: "Lỗi xóa khóa học" });
    }
  });

  /**
   * @swagger
   * /api/positions:
   *   get:
   *     summary: Lấy danh sách chức vụ
   *     description: Lấy danh sách chức vụ được chuẩn hóa
   *     tags: [Positions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách chức vụ
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   displayName:
   *                     type: string
   *                   level:
   *                     type: integer
   *                   isLeadership:
   *                     type: boolean
   *                   isDepartmentLevel:
   *                     type: boolean
   */
  app.get("/api/positions", authenticate, async (req, res) => {
    try {
      const positionsList = await db.select().from(positions).orderBy(desc(positions.level));
      res.json(positionsList);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách chức vụ" });
    }
  });

  app.post("/api/positions", authenticate, authorize([PERMISSIONS.POSITION_CREATE]), async (req, res) => {
    try {
      const { name, displayName, level, isLeadership, isDepartmentLevel, description } = req.body;
      const [newPosition] = await db
        .insert(positions)
        .values({ 
          name, 
          displayName, 
          level, 
          isLeadership: isLeadership || false, 
          isDepartmentLevel: isDepartmentLevel || false,
          description 
        })
        .returning();
      
      res.status(201).json(newPosition);
    } catch (error) {
      console.error("Error creating position:", error);
      res.status(500).json({ message: "Lỗi tạo chức vụ mới" });
    }
  });

  app.put("/api/positions/:id", authenticate, authorize([PERMISSIONS.POSITION_EDIT]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, displayName, level, isLeadership, isDepartmentLevel, description } = req.body;
      
      const [updatedPosition] = await db
        .update(positions)
        .set({ name, displayName, level, isLeadership, isDepartmentLevel, description })
        .where(eq(positions.id, id))
        .returning();
      
      if (!updatedPosition) {
        return res.status(404).json({ message: "Không tìm thấy chức vụ" });
      }
      
      res.json(updatedPosition);
    } catch (error) {
      console.error("Error updating position:", error);
      res.status(500).json({ message: "Lỗi cập nhật chức vụ" });
    }
  });

  app.delete("/api/positions/:id", authenticate, authorize([PERMISSIONS.POSITION_DELETE]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if position has members
      const membersCount = await db.select({ count: sql`count(*)` }).from(members).where(eq(members.positionId, id));
      if (parseInt(membersCount[0].count as string) > 0) {
        return res.status(400).json({ message: "Không thể xóa chức vụ có thành viên" });
      }
      
      await db.delete(positions).where(eq(positions.id, id));
      res.json({ message: "Đã xóa chức vụ" });
    } catch (error) {
      console.error("Error deleting position:", error);
      res.status(500).json({ message: "Lỗi xóa chức vụ" });
    }
  });

  /**
   * @swagger
   * /api/divisions:
   *   get:
   *     summary: Lấy danh sách ban
   *     description: Lấy danh sách các ban hoạt động
   *     tags: [Divisions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách ban
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *                   color:
   *                     type: string
   *                   icon:
   *                     type: string
   *                   isActive:
   *                     type: boolean
   */
  app.get("/api/divisions", authenticate, async (req, res) => {
    try {
      const divisionsList = await db.select().from(divisions).where(eq(divisions.isActive, true));
      res.json(divisionsList);
    } catch (error) {
      console.error("Error fetching divisions:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách ban" });
    }
  });

  app.post("/api/divisions", authenticate, authorize([PERMISSIONS.DIVISION_CREATE]), async (req, res) => {
    try {
      const { name, description, color, icon } = req.body;
      const [newDivision] = await db
        .insert(divisions)
        .values({ name, description, color: color || '#3B82F6', icon: icon || 'Users' })
        .returning();
      
      res.status(201).json(newDivision);
    } catch (error) {
      console.error("Error creating division:", error);
      res.status(500).json({ message: "Lỗi tạo ban mới" });
    }
  });

  app.put("/api/divisions/:id", authenticate, authorize([PERMISSIONS.DIVISION_EDIT]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, color, icon } = req.body;
      
      const [updatedDivision] = await db
        .update(divisions)
        .set({ name, description, color, icon, updatedAt: new Date() })
        .where(eq(divisions.id, id))
        .returning();
      
      res.json(updatedDivision);
    } catch (error) {
      console.error("Error updating division:", error);
      res.status(500).json({ message: "Lỗi cập nhật ban" });
    }
  });

  app.delete("/api/divisions/:id", authenticate, authorize([PERMISSIONS.DIVISION_DELETE]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if division has members
      const membersCount = await db.select({ count: sql`count(*)` }).from(members).where(eq(members.divisionId, id));
      if (parseInt(membersCount[0].count as string) > 0) {
        return res.status(400).json({ message: "Không thể xóa ban có thành viên" });
      }
      
      await db.delete(divisions).where(eq(divisions.id, id));
      res.json({ message: "Đã xóa ban" });
    } catch (error) {
      console.error("Error deleting division:", error);
      res.status(500).json({ message: "Lỗi xóa ban" });
    }
  });

  // Dynamic Statistics API
  app.get("/api/dynamic-stats", authenticate, async (req, res) => {
    try {
      const stats = await db.select().from(statistics).where(eq(statistics.isActive, true));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dynamic statistics:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê động" });
    }
  });

  app.post("/api/dynamic-stats", authenticate, authorize([PERMISSIONS.STATS_VIEW]), async (req, res) => {
    try {
      const { category, type, name, description, value, metadata, isPublic } = req.body;
      const [newStat] = await db
        .insert(statistics)
        .values({ 
          category, 
          type, 
          name, 
          description, 
          value: String(value), 
          metadata: metadata || {}, 
          isPublic: isPublic || false 
        })
        .returning();
      
      res.status(201).json(newStat);
    } catch (error) {
      console.error("Error creating statistic:", error);
      res.status(500).json({ message: "Lỗi tạo thống kê" });
    }
  });

  /**
   * @swagger
   * /api/enhanced-stats:
   *   get:
   *     summary: Lấy thống kê nâng cao
   *     description: Lấy thống kê nâng cao theo khóa học và chức vụ
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê nâng cao
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalUsers:
   *                   type: integer
   *                 totalMembers:
   *                   type: integer
   *                 totalAchievements:
   *                   type: integer
   *                 totalDepartments:
   *                   type: integer
   *                 totalDivisions:
   *                   type: integer
   *                 membersByYear:
   *                   type: object
   *                 membersByPosition:
   *                   type: object
   *                 lastUpdated:
   *                   type: string
   *                   format: date-time
   */
  app.get("/api/enhanced-stats", authenticate, async (req, res) => {
    try {
      // Calculate real-time statistics
      const totalUsers = await db.select().from(users).where(eq(users.isActive, true));
      const totalMembers = await db.select().from(members).where(eq(members.isActive, true));
      const totalAchievements = await db.select().from(achievements).where(eq(achievements.isActive, true));
      const totalDepartments = await db.select().from(departments);
      const totalDivisions = await db.select().from(divisions).where(eq(divisions.isActive, true));
      
      // Get members by academic year
      const membersByYear = await db
        .select({
          academicYear: academicYears.name,
          count: members.id
        })
        .from(members)
        .leftJoin(academicYears, eq(academicYears.id, members.academicYearId))
        .where(eq(members.isActive, true));

      // Get members by position
      const membersByPosition = await db
        .select({
          position: positions.displayName,
          level: positions.level,
          count: members.id
        })
        .from(members)
        .leftJoin(positions, eq(positions.id, members.positionId))
        .where(eq(members.isActive, true));

      const enhancedStats = {
        totalUsers: totalUsers.length,
        totalMembers: totalMembers.length,
        totalAchievements: totalAchievements.length,
        totalDepartments: totalDepartments.length,
        totalDivisions: totalDivisions.length,
        membersByYear: membersByYear.reduce((acc, curr) => {
          const year = curr.academicYear || 'Chưa phân khóa';
          acc[year] = (acc[year] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        membersByPosition: membersByPosition.reduce((acc, curr) => {
          const pos = curr.position || 'Chưa có chức vụ';
          acc[pos] = (acc[pos] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        lastUpdated: new Date().toISOString()
      };

      res.json(enhancedStats);
    } catch (error) {
      console.error("Error fetching enhanced statistics:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê nâng cao" });
    }
  });

  // Settings API
  app.get("/api/settings", authenticate, authorize([PERMISSIONS.SETTINGS_VIEW]), async (req, res) => {
    try {
      const settings = await dbStorage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Lỗi khi tải cài đặt" });
    }
  });

  app.post("/api/settings", authenticate, authorize([PERMISSIONS.SETTINGS_EDIT]), async (req, res) => {
    try {
      const { key, value, description } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ message: "Key và value là bắt buộc" });
      }
      
      const setting = await dbStorage.setSetting(key, value, description);
      res.json(setting);
    } catch (error) {
      console.error("Error saving setting:", error);
      res.status(500).json({ message: "Lỗi khi lưu cài đặt" });
    }
  });

  app.delete("/api/settings/:key", authenticate, authorize([PERMISSIONS.SETTINGS_EDIT]), async (req, res) => {
    try {
      const { key } = req.params;
      const deleted = await dbStorage.deleteSetting(key);
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy cài đặt" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Lỗi khi xóa cài đặt" });
    }
  });

  // BeePoint statistics API
  app.get("/api/beepoint/stats", authenticate, authorize([PERMISSIONS.BEEPOINT_VIEW]), async (req: AuthenticatedRequest, res) => {
    try {
      // Get total points issued (sum of all positive transactions)
      const totalIssuedResult = await db
        .select({ total: sql<number>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)` })
        .from(pointTransactions);
      
      // Get total points spent (sum of all negative transactions)
      const totalSpentResult = await db
        .select({ total: sql<number>`COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)` })
        .from(pointTransactions);
      
      // Get active users (users with BeePoint accounts)
      const activeUsersResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(beePoints);
      
      // Get this month's transactions
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyTransactionsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pointTransactions)
        .where(gte(pointTransactions.createdAt, thisMonth));
      
      // Get recent transactions (last 10)
      const recentTransactions = await db
        .select({
          id: pointTransactions.id,
          amount: pointTransactions.amount,
          description: pointTransactions.description,
          type: pointTransactions.type,
          createdAt: pointTransactions.createdAt,
          user: {
            id: users.id,
            fullName: users.fullName,
            username: users.username
          }
        })
        .from(pointTransactions)
        .leftJoin(users, eq(pointTransactions.userId, users.id))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(10);

      res.json({
        totalIssued: totalIssuedResult[0]?.total || 0,
        totalSpent: totalSpentResult[0]?.total || 0,
        activeUsers: activeUsersResult[0]?.count || 0,
        monthlyTransactions: monthlyTransactionsResult[0]?.count || 0,
        recentTransactions
      });
    } catch (error) {
      console.error("Error fetching BeePoint stats:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê BeePoint" });
    }
  });

  // Create BeePoint transaction (Admin)
  app.post("/api/beepoint/transaction", authenticate, authorize([PERMISSIONS.BEEPOINT_MANAGE]), async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, amount, description, type } = req.body;
      
      if (!userId || !amount || !description || !type) {
        return res.status(400).json({ message: "Thiếu thông tin giao dịch" });
      }

      // Get user's BeePoint account
      const [account] = await db
        .select()
        .from(beePoints)
        .where(eq(beePoints.userId, userId));

      if (!account) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản BeePoint" });
      }

      // Check if user has enough points for negative transactions
      if (amount < 0 && account.currentPoints < Math.abs(amount)) {
        return res.status(400).json({ message: "Không đủ BeePoint" });
      }

      // Create transaction
      const [transaction] = await db
        .insert(pointTransactions)
        .values({
          userId,
          amount,
          description,
          type,
          createdBy: req.user!.id
        })
        .returning();

      // Update account balance
      await db
        .update(beePoints)
        .set({ 
          currentPoints: account.currentPoints + amount,
          updatedAt: new Date()
        })
        .where(eq(beePoints.id, account.id));

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating BeePoint transaction:", error);
      res.status(500).json({ message: "Lỗi tạo giao dịch BeePoint" });
    }
  });

  // ===== ADMIN ROLES API =====
  
  // Get all roles (Admin only)
  app.get("/api/admin/roles", authenticate, authorize([PERMISSIONS.ROLE_VIEW]), async (req: AuthenticatedRequest, res) => {
    try {
      const rolesList = await dbStorage.getRoles();
      res.json(rolesList);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách vai trò" });
    }
  });

  // Create new role (Super Admin only)
  app.post("/api/admin/roles", authenticate, authorize([PERMISSIONS.ROLE_CREATE]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = createRoleSchema.parse(req.body);
      const newRole = await dbStorage.createRole(validatedData);
      res.status(201).json(newRole);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Lỗi tạo vai trò mới" });
    }
  });

  // Update role (Super Admin only)
  app.put("/api/admin/roles/:id", authenticate, authorize([PERMISSIONS.ROLE_EDIT]), async (req: AuthenticatedRequest, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const validatedData = createRoleSchema.parse(req.body);
      const updatedRole = await dbStorage.updateRole(roleId, validatedData);
      
      if (!updatedRole) {
        return res.status(404).json({ message: "Không tìm thấy vai trò" });
      }
      
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Lỗi cập nhật vai trò" });
    }
  });

  // Delete role (Super Admin only)
  app.delete("/api/admin/roles/:id", authenticate, authorize([PERMISSIONS.ROLE_DELETE]), async (req: AuthenticatedRequest, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const deleted = await dbStorage.deleteRole(roleId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy vai trò" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Lỗi xóa vai trò" });
    }
  });

  // ===== PUBLIC API ROUTES =====
  
  // Public users API
  app.get("/api/public/users", async (req, res) => {
    try {
      const publicUsers = await db.select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        roleName: roles.displayName
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.isActive, true))
      .limit(50);

      res.json(publicUsers);
    } catch (error) {
      console.error("Error fetching public users:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách người dùng" });
    }
  });

  // Public departments API
  app.get("/api/public/departments", async (req, res) => {
    try {
      const publicDepartments = await db.select({
        id: departments.id,
        name: departments.name,
        icon: departments.icon,
        color: departments.color
      })
      .from(departments);

      res.json(publicDepartments);
    } catch (error) {
      console.error("Error fetching public departments:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách ban/phòng" });
    }
  });

  // Public statistics API
  app.get("/api/public/statistics", async (req, res) => {
    try {
      const [
        totalMembersResult,
        totalDepartmentsResult,
        totalBeePointsResult,
        totalAchievementsResult
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(members).where(eq(members.isActive, true)),
        db.select({ count: sql<number>`count(*)` }).from(departments),
        db.select({ sum: sql<number>`sum(${pointTransactions.amount})` }).from(pointTransactions).where(eq(pointTransactions.type, 'earned')),
        db.select({ count: sql<number>`count(*)` }).from(achievements).where(eq(achievements.isActive, true))
      ]);

      const publicStats = {
        totalMembers: totalMembersResult[0]?.count || 0,
        totalDepartments: totalDepartmentsResult[0]?.count || 0,
        totalBeePointsDistributed: totalBeePointsResult[0]?.sum || 0,
        totalAchievements: totalAchievementsResult[0]?.count || 0
      };

      res.json(publicStats);
    } catch (error) {
      console.error("Error fetching public statistics:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê" });
    }
  });

  // Upload API
  app.get("/api/uploads", authenticate, authorize([PERMISSIONS.UPLOAD_VIEW]), async (req, res) => {
    try {
      const uploads = await dbStorage.getUploads();
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ message: "Lỗi khi tải danh sách file" });
    }
  });

  app.post("/api/uploads", authenticate, authorize([PERMISSIONS.UPLOAD_CREATE]), upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Vui lòng chọn file để upload" });
      }

      const uploadData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        uploadedBy: req.user!.id
      };

      const upload = await dbStorage.createUpload(uploadData);
      res.status(201).json(upload);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Lỗi khi upload file" });
    }
  });

  app.delete("/api/uploads/:id", authenticate, authorize([PERMISSIONS.UPLOAD_DELETE]), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await dbStorage.getUpload(id);
      
      if (!upload) {
        return res.status(404).json({ message: "Không tìm thấy file" });
      }

      // Delete file from filesystem
      const filePath = path.join(uploadsDir, upload.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      const deleted = await dbStorage.deleteUpload(id);
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy file" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ message: "Lỗi khi xóa file" });
    }
  });

  // BeePoint API endpoints
  /**
   * @swagger
   * /api/bee-points/me:
   *   get:
   *     tags: [BeePoints]
   *     summary: Lấy thông tin BeePoints của người dùng hiện tại
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thông tin BeePoints
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BeePointsInfo'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/bee-points/me", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const beePoints = await dbStorage.getUserBeePoints(userId);
      
      if (!beePoints) {
        // Create BeePoints for user if not exists (without automatic welcome bonus)
        const newBeePoints = await dbStorage.createUserBeePoints(userId);
        return res.json(newBeePoints);
      }

      res.json(beePoints);
    } catch (error) {
      console.error("Error fetching bee points:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin BeePoint" });
    }
  });

  app.get("/api/bee-points/transactions", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const transactions = await dbStorage.getUserPointTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching point transactions:", error);
      res.status(500).json({ message: "Lỗi lấy lịch sử giao dịch" });
    }
  });

  app.post("/api/bee-points/add", authenticate, authorize([PERMISSIONS.BEEPOINT_AWARD]), async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, amount, type, description } = req.body;
      
      if (!userId || !amount || !type || !description) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      const transaction = await dbStorage.addPointTransaction({
        userId: parseInt(userId),
        amount: parseInt(amount),
        type,
        description,
        createdBy: req.user!.id,
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error adding points:", error);
      res.status(500).json({ message: "Lỗi thêm điểm" });
    }
  });

  // User Settings API endpoints - accessible by all authenticated users
  app.get("/api/user-settings", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user settings from database or create default if not exists
      let [userSettingsData] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));
      
      // If no settings exist, create default settings
      if (!userSettingsData) {
        [userSettingsData] = await db
          .insert(userSettings)
          .values({ userId })
          .returning();
      }
      
      // Format response to match frontend interface
      const settings = {
        id: userSettingsData.id,
        notifications: {
          email: userSettingsData.emailNotifications,
          push: userSettingsData.pushNotifications,
          missions: userSettingsData.missionNotifications,
          achievements: userSettingsData.achievementNotifications,
          social: userSettingsData.socialNotifications,
        },
        privacy: {
          profileVisibility: userSettingsData.profileVisibility,
          showEmail: userSettingsData.showEmail,
          showPhone: userSettingsData.showPhone,
        },
        preferences: {
          theme: userSettingsData.theme,
          language: userSettingsData.language,
        },
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Lỗi lấy cài đặt cá nhân" });
    }
  });

  app.put("/api/user-settings", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { notifications, privacy, preferences } = req.body;
      
      // Update user settings in database
      const [updatedUserSettings] = await db
        .update(userSettings)
        .set({
          emailNotifications: notifications?.email,
          pushNotifications: notifications?.push,
          missionNotifications: notifications?.missions,
          achievementNotifications: notifications?.achievements,
          socialNotifications: notifications?.social,
          profileVisibility: privacy?.profileVisibility,
          showEmail: privacy?.showEmail,
          showPhone: privacy?.showPhone,
          theme: preferences?.theme,
          language: preferences?.language,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();
      
      // If no settings existed, create them
      if (!updatedUserSettings) {
        await db.insert(userSettings).values({
          userId,
          emailNotifications: notifications?.email ?? true,
          pushNotifications: notifications?.push ?? true,
          missionNotifications: notifications?.missions ?? true,
          achievementNotifications: notifications?.achievements ?? true,
          socialNotifications: notifications?.social ?? true,
          profileVisibility: privacy?.profileVisibility ?? 'public',
          showEmail: privacy?.showEmail ?? false,
          showPhone: privacy?.showPhone ?? false,
          theme: preferences?.theme ?? 'light',
          language: preferences?.language ?? 'vi',
        });
      }
      
      res.json({ 
        message: "Cài đặt đã được lưu thành công",
        success: true 
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Lỗi lưu cài đặt" });
    }
  });

  // Change password endpoint
  app.post("/api/auth/change-password", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Thiếu mật khẩu hiện tại hoặc mật khẩu mới" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      }

      // Get current user
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password and clear mustChangePassword flag
      await dbStorage.updateUser(userId, {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      });

      res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Lỗi đổi mật khẩu" });
    }
  });

  // Reset password endpoint for admin
  app.post("/api/users/:id/reset-password", authenticate, authorize([PERMISSIONS.USER_EDIT]), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await dbStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      
      // Generate new temporary password
      const newPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user password
      await dbStorage.updateUser(userId, {
        passwordHash: hashedPassword,
        mustChangePassword: true
      });
      
      res.json({ 
        message: "Reset mật khẩu thành công",
        username: user.username,
        newPassword
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  });

  // Get user account info for member
  app.get("/api/members/:id/account", authenticate, authorize([PERMISSIONS.MEMBER_VIEW]), async (req: AuthenticatedRequest, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const member = await dbStorage.getMember(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Không tìm thấy thành viên" });
      }
      
      // Find user by email or name
      let user = null;
      if (member.email) {
        user = await dbStorage.getUserByEmail(member.email);
      }
      
      if (!user) {
        return res.json({ hasAccount: false });
      }
      
      res.json({
        hasAccount: true,
        userId: user.id,
        username: user.username,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive
      });
    } catch (error) {
      console.error("Error getting member account:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  });

  // Update user profile
  app.put("/api/auth/profile", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const validationResult = updateUserProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: validationResult.error.issues 
        });
      }

      const updateData = validationResult.data;
      const userId = req.user!.id;

      const updatedUser = await dbStorage.updateUser(userId, {
        fullName: updateData.fullName,
        email: updateData.email,
        bio: updateData.bio || null,
        phone: updateData.phone || null,
        facebookUrl: updateData.facebookUrl || null,
        instagramUrl: updateData.instagramUrl || null,
        tiktokUrl: updateData.tiktokUrl || null,
        youtubeUrl: updateData.youtubeUrl || null,
        linkedinUrl: updateData.linkedinUrl || null,
        githubUrl: updateData.githubUrl || null,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      res.json({ 
        message: "Cập nhật thông tin thành công",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Lỗi cập nhật thông tin" });
    }
  });

  // Settings management routes
  app.get("/api/settings", authenticate, authorize([PERMISSIONS.SETTINGS_VIEW]), async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await dbStorage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Lỗi lấy cấu hình" });
    }
  });

  app.get("/api/settings/:key", authenticate, authorize([PERMISSIONS.SETTINGS_VIEW]), async (req: AuthenticatedRequest, res) => {
    try {
      const setting = await dbStorage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Không tìm thấy cấu hình" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Lỗi lấy cấu hình" });
    }
  });

  app.put("/api/settings/:key", authenticate, authorize([PERMISSIONS.SETTINGS_EDIT]), async (req: AuthenticatedRequest, res) => {
    try {
      const { value, description } = req.body;
      const setting = await dbStorage.updateSetting(req.params.key, value, description);
      res.json({ 
        message: "Cập nhật cấu hình thành công",
        setting 
      });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Lỗi cập nhật cấu hình" });
    }
  });

  app.post("/api/settings", authenticate, authorize([PERMISSIONS.SETTINGS_EDIT]), async (req: AuthenticatedRequest, res) => {
    try {
      const { key, value, description } = req.body;
      if (!key) {
        return res.status(400).json({ message: "Thiếu key cấu hình" });
      }
      const setting = await dbStorage.createSetting(key, value, description);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating setting:", error);
      res.status(500).json({ message: "Lỗi tạo cấu hình" });
    }
  });

  app.delete("/api/settings/:key", authenticate, authorize([PERMISSIONS.SETTINGS_EDIT]), async (req: AuthenticatedRequest, res) => {
    try {
      await dbStorage.deleteSetting(req.params.key);
      res.json({ message: "Xóa cấu hình thành công" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Lỗi xóa cấu hình" });
    }
  });

  // BeePoint configuration endpoints
  app.get("/api/beepoint/config", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const totalSupply = await dbStorage.getSetting("beepoint_total_supply");
      const exchangeRate = await dbStorage.getSetting("beepoint_exchange_rate");
      const welcomeBonus = await dbStorage.getSetting("beepoint_welcome_bonus");
      const activityMultiplier = await dbStorage.getSetting("beepoint_activity_multiplier");

      res.json({
        totalSupply: totalSupply?.value ? parseInt(totalSupply.value) : 1000000,
        exchangeRate: exchangeRate?.value ? parseFloat(exchangeRate.value) : 1.0,
        welcomeBonus: welcomeBonus?.value ? parseInt(welcomeBonus.value) : 100,
        activityMultiplier: activityMultiplier?.value ? parseFloat(activityMultiplier.value) : 1.0
      });
    } catch (error) {
      console.error("Error fetching BeePoint config:", error);
      res.status(500).json({ message: "Lỗi lấy cấu hình BeePoint" });
    }
  });

  app.put("/api/beepoint/config", authenticate, authorize([PERMISSIONS.BEEPOINT_CONFIG]), async (req: AuthenticatedRequest, res) => {
    try {
      const { totalSupply, exchangeRate, welcomeBonus, activityMultiplier } = req.body;

      console.log("Updating BeePoint config:", { totalSupply, exchangeRate, welcomeBonus, activityMultiplier });

      if (totalSupply !== undefined) {
        await dbStorage.setSetting("beepoint_total_supply", totalSupply.toString(), "Tổng cung BeePoint trong hệ thống");
        console.log("Updated totalSupply:", totalSupply);
      }
      if (exchangeRate !== undefined) {
        await dbStorage.setSetting("beepoint_exchange_rate", exchangeRate.toString(), "Tỷ lệ đổi BeePoint sang phần thưởng");
        console.log("Updated exchangeRate:", exchangeRate);
      }
      if (welcomeBonus !== undefined) {
        await dbStorage.setSetting("beepoint_welcome_bonus", welcomeBonus.toString(), "BeePoint thưởng cho thành viên mới");
        console.log("Updated welcomeBonus:", welcomeBonus);
      }
      if (activityMultiplier !== undefined) {
        await dbStorage.setSetting("beepoint_activity_multiplier", activityMultiplier.toString(), "Hệ số nhân điểm hoạt động");
        console.log("Updated activityMultiplier:", activityMultiplier);
      }

      res.json({ message: "Cập nhật cấu hình BeePoint thành công" });
    } catch (error) {
      console.error("Error updating BeePoint config:", error);
      res.status(500).json({ message: "Lỗi cập nhật cấu hình BeePoint" });
    }
  });

  // Initialize default BeePoint settings if not exists
  app.post("/api/beepoint/init", authenticate, authorize([PERMISSIONS.BEEPOINT_CONFIG]), async (req: AuthenticatedRequest, res) => {
    try {
      const defaultSettings = [
        { key: "beepoint_total_supply", value: "1000000", description: "Tổng cung BeePoint trong hệ thống" },
        { key: "beepoint_exchange_rate", value: "1.0", description: "Tỷ lệ đổi BeePoint sang phần thưởng (1 BeePoint = X VND)" },
        { key: "beepoint_welcome_bonus", value: "100", description: "BeePoint thưởng cho thành viên mới" },
        { key: "beepoint_activity_multiplier", value: "1.0", description: "Hệ số nhân điểm hoạt động" }
      ];

      for (const setting of defaultSettings) {
        const existing = await dbStorage.getSetting(setting.key);
        if (!existing) {
          await dbStorage.setSetting(setting.key, setting.value, setting.description);
        }
      }

      res.json({ message: "Khởi tạo cấu hình BeePoint thành công" });
    } catch (error) {
      console.error("Error initializing BeePoint settings:", error);
      res.status(500).json({ message: "Lỗi khởi tạo cấu hình BeePoint" });
    }
  });

  // Upload avatar
  app.post("/api/auth/avatar", authenticate, upload.single('avatar'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được tải lên" });
      }

      const userId = req.user!.id;
      const avatarUrl = `/uploads/${req.file.filename}`;

      const updatedUser = await dbStorage.updateUser(userId, {
        avatarUrl: avatarUrl
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      res.json({ 
        message: "Cập nhật avatar thành công",
        avatarUrl: avatarUrl
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Lỗi tải lên avatar" });
    }
  });

  // Achievement management routes
  /**
   * @swagger
   * /api/achievements:
   *   get:
   *     tags: [Achievements]
   *     summary: Lấy danh sách tất cả thành tích
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách thành tích
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Achievement'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/achievements", authenticate, authorize(PERMISSIONS.ACHIEVEMENT_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const achievementsList = await db.select().from(achievements).where(eq(achievements.isActive, true));
      res.json(achievementsList);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách thành tích" });
    }
  });

  /**
   * @swagger
   * /api/achievements:
   *   post:
   *     tags: [Achievements]
   *     summary: Tạo thành tích mới
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateAchievementRequest'
   *     responses:
   *       201:
   *         description: Thành tích được tạo thành công
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Achievement'
   *       400:
   *         description: Dữ liệu không hợp lệ
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/achievements", authenticate, authorize(PERMISSIONS.ACHIEVEMENT_CREATE), async (req: AuthenticatedRequest, res) => {
    try {
      const validationResult = createAchievementSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: validationResult.error.issues 
        });
      }

      const [newAchievement] = await db
        .insert(achievements)
        .values(validationResult.data)
        .returning();

      res.status(201).json(newAchievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      res.status(500).json({ message: "Lỗi tạo thành tích" });
    }
  });

  /**
   * @swagger
   * /api/achievements/award:
   *   post:
   *     tags: [Achievements]
   *     summary: Trao thành tích cho người dùng
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AwardAchievementRequest'
   *     responses:
   *       201:
   *         description: Trao thành tích thành công
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 pointsAwarded:
   *                   type: integer
   *       400:
   *         description: Dữ liệu không hợp lệ hoặc đã có thành tích
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Award achievement to user
  app.post("/api/achievements/award", authenticate, authorize(PERMISSIONS.ACHIEVEMENT_AWARD), async (req: AuthenticatedRequest, res) => {
    try {
      const validationResult = awardAchievementSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: validationResult.error.issues 
        });
      }

      const { userId, achievementId, notes } = validationResult.data;

      // Check if user already has this achievement
      const existingAward = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        ));

      if (existingAward.length > 0) {
        return res.status(400).json({ message: "Người dùng đã có thành tích này" });
      }

      // Get achievement details for points reward
      const achievement = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, achievementId));

      if (achievement.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy thành tích" });
      }

      // Award the achievement
      const [userAchievement] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          notes,
          awardedBy: req.user!.id,
        })
        .returning();

      // Award BeePoints if applicable
      if (achievement[0].pointsReward && achievement[0].pointsReward > 0) {
        await dbStorage.addPointTransaction({
          userId,
          amount: achievement[0].pointsReward,
          type: 'achievement',
          description: `Thành tích: ${achievement[0].title}`,
          createdBy: req.user!.id,
        });
      }

      res.status(201).json({
        message: "Trao thành tích thành công",
        userAchievement,
        pointsAwarded: achievement[0].pointsReward || 0,
      });
    } catch (error) {
      console.error("Error awarding achievement:", error);
      res.status(500).json({ message: "Lỗi trao thành tích" });
    }
  });

  // Get user achievements
  app.get("/api/users/:userId/achievements", authenticate, authorize(PERMISSIONS.ACHIEVEMENT_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const userAchievementsList = await db
        .select({
          id: userAchievements.id,
          awardedDate: userAchievements.awardedDate,
          notes: userAchievements.notes,
          achievement: achievements,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.awardedDate));

      res.json(userAchievementsList);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Lỗi lấy thành tích người dùng" });
    }
  });

  // Get users for awarding achievements
  app.get("/api/members-with-accounts", authenticate, authorize([PERMISSIONS.ACHIEVEMENT_AWARD]), async (req: AuthenticatedRequest, res) => {
    try {
      const usersForAwards = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
        })
        .from(users);

      res.json(usersForAwards);
    } catch (error) {
      console.error("Error fetching users for awards:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách người dùng" });
    }
  });

  /**
   * @swagger
   * /api/achievements/me:
   *   get:
   *     tags: [Achievements]
   *     summary: Lấy thành tích cá nhân của người dùng hiện tại
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách thành tích cá nhân
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/UserAchievement'
   *       401:
   *         description: Chưa đăng nhập
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Get my achievements
  app.get("/api/achievements/me", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const myAchievements = await db
        .select({
          id: userAchievements.id,
          awardedDate: userAchievements.awardedDate,
          notes: userAchievements.notes,
          achievement: achievements,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.awardedDate));

      res.json(myAchievements);
    } catch (error) {
      console.error("Error fetching my achievements:", error);
      res.status(500).json({ message: "Lỗi lấy thành tích của tôi" });
    }
  });

  // API endpoints with flexible authentication (JWT or API Key)
  // Import API key authentication middleware
  const { flexibleAuth, requireApiPermission } = await import("./apiKeyAuth");
  
  /**
   * @swagger
   * /api/external/stats:
   *   get:
   *     summary: Lấy thống kê hệ thống (cho ứng dụng thứ 3)
   *     tags: [External API]
   *     security:
   *       - ApiKeyAuth: []
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         schema:
   *           type: string
   *         description: API key cho ứng dụng thứ 3
   *     responses:
   *       200:
   *         description: Thống kê hệ thống
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalMembers:
   *                   type: number
   *                   description: Tổng số thành viên
   *                 activeMembers:
   *                   type: number
   *                   description: Số thành viên đang hoạt động
   *                 totalDepartments:
   *                   type: number
   *                   description: Tổng số ban
   *                 totalAchievements:
   *                   type: number
   *                   description: Tổng số thành tích
   *       401:
   *         description: API key không hợp lệ
   *       403:
   *         description: Không đủ quyền truy cập
   */
  app.get("/api/external/stats", flexibleAuth, requireApiPermission("stats:view"), async (req, res) => {
    try {
      const members = await dbStorage.getMembers();
      const departments = await dbStorage.getDepartments();
      const achievements = await dbStorage.getAchievements();
      
      const stats = {
        totalMembers: members.length,
        activeMembers: members.filter((m: any) => m.isActive).length,
        totalDepartments: departments.length,
        totalAchievements: achievements.length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching external stats:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê" });
    }
  });

  /**
   * @swagger
   * /api/external/members:
   *   get:
   *     summary: Lấy danh sách thành viên (cho ứng dụng thứ 3)
   *     tags: [External API]
   *     security:
   *       - ApiKeyAuth: []
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         schema:
   *           type: string
   *         description: API key cho ứng dụng thứ 3
   *       - in: query
   *         name: departmentId
   *         schema:
   *           type: number
   *         description: Lọc theo ID ban
   *       - in: query
   *         name: active
   *         schema:
   *           type: boolean
   *         description: Lọc theo trạng thái hoạt động
   *     responses:
   *       200:
   *         description: Danh sách thành viên
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/MemberWithDepartment'
   */
  app.get("/api/external/members", flexibleAuth, requireApiPermission("member:view"), async (req, res) => {
    try {
      const { departmentId, active } = req.query;
      let members = await dbStorage.getMembersWithDepartments();
      
      // Apply filters
      if (departmentId && typeof departmentId === 'string') {
        const deptId = parseInt(departmentId);
        if (!isNaN(deptId)) {
          members = members.filter((m: any) => m.departmentId === deptId);
        }
      }
      
      if (active && typeof active === 'string') {
        const isActive = active.toLowerCase() === 'true';
        members = members.filter((m: any) => m.isActive === isActive);
      }
      
      res.json(members);
    } catch (error) {
      console.error("Error fetching external members:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách thành viên" });
    }
  });

  /**
   * @swagger
   * /api/external/achievements:
   *   get:
   *     summary: Lấy danh sách thành tích (cho ứng dụng thứ 3)
   *     tags: [External API]
   *     security:
   *       - ApiKeyAuth: []
   *       - BearerAuth: []
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         schema:
   *           type: string
   *         description: API key cho ứng dụng thứ 3
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [academic, creative, leadership, participation, special]
   *         description: Lọc theo danh mục thành tích
   *       - in: query
   *         name: level
   *         schema:
   *           type: string
   *           enum: [bronze, silver, gold, special]
   *         description: Lọc theo cấp độ thành tích
   *     responses:
   *       200:
   *         description: Danh sách thành tích
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Achievement'
   */
  app.get("/api/external/achievements", flexibleAuth, requireApiPermission("achievement:view"), async (req, res) => {
    try {
      const { category, level } = req.query;
      let achievements = await dbStorage.getAchievements();
      
      // Apply filters
      if (category && typeof category === 'string') {
        achievements = achievements.filter((a: any) => a.category === category);
      }
      
      if (level && typeof level === 'string') {
        achievements = achievements.filter((a: any) => a.level === level);
      }
      
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching external achievements:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách thành tích" });
    }
  });

  // API Key management endpoints
  
  /**
   * @swagger
   * /api/admin/api-keys:
   *   get:
   *     summary: Lấy danh sách API keys (Admin only)
   *     tags: [Admin API Keys]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách API keys
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ApiKey'
   */
  app.get("/api/admin/api-keys", authenticate, authorize("system:admin"), async (req, res) => {
    try {
      const apiKeys = await dbStorage.getApiKeys();
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách API keys" });
    }
  });

  /**
   * @swagger
   * /api/admin/api-keys:
   *   post:
   *     summary: Tạo API key mới (Admin only)
   *     tags: [Admin API Keys]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Tên mô tả của API key
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Danh sách quyền hạn
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *                 description: Ngày hết hạn (tùy chọn)
   *     responses:
   *       201:
   *         description: API key đã được tạo
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: number
   *                 apiKey:
   *                   type: string
   *                   description: API key được tạo (chỉ hiển thị 1 lần)
   */
  app.post("/api/admin/api-keys", authenticate, authorize("system:admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, permissions, expiresAt } = req.body;
      
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ message: "Tên và quyền hạn là bắt buộc" });
      }

      // Generate random API key
      const crypto = await import("crypto");
      const bcrypt = await import("bcrypt");
      const apiKey = crypto.randomBytes(32).toString("hex");
      const keyHash = await bcrypt.hash(apiKey, 10);

      const newApiKey = await dbStorage.createApiKey({
        name,
        keyHash,
        permissions,
        isActive: true,
        createdBy: req.user!.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      res.status(201).json({
        id: newApiKey.id,
        apiKey, // Only return this once
        message: "API key đã được tạo thành công"
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Lỗi tạo API key" });
    }
  });

  /**
   * @swagger
   * /api/admin/api-keys/{id}:
   *   delete:
   *     summary: Xóa API key (Admin only)
   *     tags: [Admin API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: API key đã được xóa
   */
  /**
   * @swagger
   * /api/admin/api-keys/{id}:
   *   put:
   *     summary: Cập nhật quyền hạn cho API key (Admin only)
   *     tags: [Admin API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID của API key
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Danh sách quyền hạn mới
   *     responses:
   *       200:
   *         description: Quyền hạn đã được cập nhật
   */
  app.put("/api/admin/api-keys/:id", authenticate, authorize("system:admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const { permissions } = req.body;
      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ message: "Quyền hạn là bắt buộc và phải là mảng" });
      }

      const updatedApiKey = await dbStorage.updateApiKey(id, { permissions });
      if (!updatedApiKey) {
        return res.status(404).json({ message: "API key không tồn tại" });
      }

      res.json({ 
        message: "Quyền hạn API key đã được cập nhật",
        apiKey: updatedApiKey
      });
    } catch (error) {
      console.error("Error updating API key permissions:", error);
      res.status(500).json({ message: "Lỗi cập nhật quyền hạn API key" });
    }
  });

  app.delete("/api/admin/api-keys/:id", authenticate, authorize("system:admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const success = await dbStorage.deleteApiKey(id);
      if (!success) {
        return res.status(404).json({ message: "API key không tồn tại" });
      }

      res.json({ message: "API key đã được xóa" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Lỗi xóa API key" });
    }
  });

  // ===== MISSION MODULE =====
  
  // Get all missions
  app.get("/api/missions", authenticate, authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const { status, category, type } = req.query;
      
      let whereConditions = [eq(missions.isActive, true)];

      if (status) {
        whereConditions.push(eq(missions.status, status as string));
      }
      if (category) {
        whereConditions.push(eq(missions.category, category as string));
      }
      if (type) {
        whereConditions.push(eq(missions.type, type as string));
      }

      const query = db.select({
        id: missions.id,
        title: missions.title,
        description: missions.description,
        category: missions.category,
        type: missions.type,
        maxParticipants: missions.maxParticipants,
        currentParticipants: missions.currentParticipants,
        beePointsReward: missions.beePointsReward,
        requiresPhoto: missions.requiresPhoto,
        startDate: missions.startDate,
        endDate: missions.endDate,
        deadline: missions.deadline,
        priority: missions.priority,
        status: missions.status,
        tags: missions.tags,
        createdAt: missions.createdAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName,
          username: users.username
        }
      }).from(missions)
        .leftJoin(users, eq(missions.createdBy, users.id))
        .where(and(...whereConditions));

      const missionsList = await query.orderBy(desc(missions.createdAt));
      res.json(missionsList);
    } catch (error) {
      console.error("Error fetching missions:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách nhiệm vụ" });
    }
  });

  // Create mission
  app.post("/api/missions", authenticate, authorize(PERMISSIONS.MISSION_CREATE), async (req: AuthenticatedRequest, res) => {
    try {
      const validationResult = insertMissionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Dữ liệu không hợp lệ",
          errors: validationResult.error.issues
        });
      }

      const missionData = validationResult.data;
      const [mission] = await db.insert(missions).values({
        ...missionData,
        createdBy: req.user!.id,
        startDate: missionData.startDate ? new Date(missionData.startDate) : null,
        endDate: missionData.endDate ? new Date(missionData.endDate) : null,
      }).returning();

      res.status(201).json(mission);
    } catch (error) {
      console.error("Error creating mission:", error);
      res.status(500).json({ message: "Lỗi tạo nhiệm vụ" });
    }
  });

  // Get user's missions
  app.get("/api/missions/my", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      let whereConditions = [eq(missionAssignments.userId, userId)];

      if (status) {
        whereConditions.push(eq(missionAssignments.status, status as string));
      }

      const query = db.select({
        assignment: {
          id: missionAssignments.id,
          status: missionAssignments.status,
          assignedDate: missionAssignments.assignedDate,
          startedDate: missionAssignments.startedDate,
          completedDate: missionAssignments.completedDate,
          submissionNote: missionAssignments.submissionNote,
          reviewNote: missionAssignments.reviewNote,
          pointsAwarded: missionAssignments.pointsAwarded
        },
        mission: {
          id: missions.id,
          title: missions.title,
          description: missions.description,
          category: missions.category,
          type: missions.type,
          beePointsReward: missions.beePointsReward,
          requiresPhoto: missions.requiresPhoto,
          startDate: missions.startDate,
          endDate: missions.endDate,
          deadline: missions.deadline,
          priority: missions.priority,
          tags: missions.tags
        }
      }).from(missionAssignments)
        .innerJoin(missions, eq(missionAssignments.missionId, missions.id))
        .where(and(...whereConditions));

      const userMissions = await query.orderBy(desc(missionAssignments.assignedDate));
      res.json(userMissions);
    } catch (error) {
      console.error("Error fetching user missions:", error);
      res.status(500).json({ message: "Lỗi lấy nhiệm vụ của người dùng" });
    }
  });

  // Get all mission assignments for admin review
  app.get("/api/missions/assignments", authenticate, authorize(PERMISSIONS.MISSION_REVIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.query;
      
      let whereConditions = [];
      if (status) {
        whereConditions.push(eq(missionAssignments.status, status as string));
      }

      const query = db.select({
        id: missionAssignments.id,
        status: missionAssignments.status,
        assignedDate: missionAssignments.assignedDate,
        startedDate: missionAssignments.startedDate,
        completedDate: missionAssignments.completedDate,
        submissionNote: missionAssignments.submissionNote,
        reviewNote: missionAssignments.reviewNote,
        pointsAwarded: missionAssignments.pointsAwarded,
        user: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email
        },
        mission: {
          id: missions.id,
          title: missions.title,
          description: missions.description,
          beePointsReward: missions.beePointsReward,
          deadline: missions.deadline
        }
      }).from(missionAssignments)
        .innerJoin(users, eq(missionAssignments.userId, users.id))
        .innerJoin(missions, eq(missionAssignments.missionId, missions.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      const assignments = await query.orderBy(desc(missionAssignments.assignedDate));
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching mission assignments:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách phân công nhiệm vụ" });
    }
  });

  // Get mission details
  app.get("/api/missions/:id", authenticate, authorize(PERMISSIONS.MISSION_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      
      if (isNaN(missionId)) {
        return res.status(400).json({ message: "ID nhiệm vụ không hợp lệ" });
      }
      
      const [mission] = await db.select({
        id: missions.id,
        title: missions.title,
        description: missions.description,
        category: missions.category,
        type: missions.type,
        maxParticipants: missions.maxParticipants,
        currentParticipants: missions.currentParticipants,
        beePointsReward: missions.beePointsReward,
        requiresPhoto: missions.requiresPhoto,
        startDate: missions.startDate,
        endDate: missions.endDate,
        priority: missions.priority,
        status: missions.status,
        tags: missions.tags,
        createdAt: missions.createdAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName,
          username: users.username
        }
      }).from(missions)
        .leftJoin(users, eq(missions.createdBy, users.id))
        .where(eq(missions.id, missionId));

      if (!mission) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
      }

      // Get assignments for this mission
      const assignments = await db.select({
        id: missionAssignments.id,
        status: missionAssignments.status,
        assignedDate: missionAssignments.assignedDate,
        completedDate: missionAssignments.completedDate,
        pointsAwarded: missionAssignments.pointsAwarded,
        user: {
          id: users.id,
          fullName: users.fullName,
          username: users.username
        }
      }).from(missionAssignments)
        .leftJoin(users, eq(missionAssignments.userId, users.id))
        .where(eq(missionAssignments.missionId, missionId));

      res.json({ ...mission, assignments });
    } catch (error) {
      console.error("Error fetching mission details:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin nhiệm vụ" });
    }
  });

  // Update mission
  app.put("/api/missions/:id", authenticate, authorize(PERMISSIONS.BEEPOINT_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const validationResult = insertMissionSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Dữ liệu không hợp lệ",
          errors: validationResult.error.issues
        });
      }

      const updateData = validationResult.data;
      const [updatedMission] = await db.update(missions)
        .set({
          ...updateData,
          updatedBy: req.user!.id,
          updatedAt: new Date(),
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        })
        .where(eq(missions.id, missionId))
        .returning();

      if (!updatedMission) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
      }

      res.json(updatedMission);
    } catch (error) {
      console.error("Error updating mission:", error);
      res.status(500).json({ message: "Lỗi cập nhật nhiệm vụ" });
    }
  });

  // Delete mission
  app.delete("/api/missions/:id", authenticate, authorize(PERMISSIONS.BEEPOINT_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      
      await db.update(missions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(missions.id, missionId));

      res.json({ message: "Xóa nhiệm vụ thành công" });
    } catch (error) {
      console.error("Error deleting mission:", error);
      res.status(500).json({ message: "Lỗi xóa nhiệm vụ" });
    }
  });

  // Assign mission to user
  app.post("/api/missions/:id/assign", authenticate, authorize(PERMISSIONS.BEEPOINT_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "Thiếu ID người dùng" });
      }

      // Check if mission exists and has available slots
      const [mission] = await db.select().from(missions).where(eq(missions.id, missionId));
      if (!mission) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
      }

      if (mission.maxParticipants && mission.currentParticipants >= mission.maxParticipants) {
        return res.status(400).json({ message: "Nhiệm vụ đã đầy" });
      }

      // Check if user already assigned
      const [existingAssignment] = await db.select()
        .from(missionAssignments)
        .where(and(
          eq(missionAssignments.missionId, missionId),
          eq(missionAssignments.userId, userId)
        ));

      if (existingAssignment) {
        return res.status(400).json({ message: "Người dùng đã được giao nhiệm vụ này" });
      }

      // Create assignment
      const [assignment] = await db.insert(missionAssignments).values({
        missionId,
        userId,
        status: 'assigned'
      }).returning();

      // Get user and mission info for notification
      const [missionInfo] = await db.select()
        .from(missions)
        .where(eq(missions.id, missionId));
      
      const [userInfo] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      // Send notification to assigned user
      if (missionInfo && userInfo) {
        await notificationService.notifyMissionAssigned(
          [userId], 
          missionInfo.title, 
          req.user!.fullName
        );
      }

      // Update participant count
      await db.update(missions)
        .set({ 
          currentParticipants: sql`${missions.currentParticipants} + 1`,
          updatedAt: new Date()
        })
        .where(eq(missions.id, missionId));

      res.status(201).json(assignment);

      // Send notification for self-assignment
      await notificationService.notifyMissionAssigned(
        [userId], 
        mission.title, 
        "Tự đăng ký"
      );
    } catch (error) {
      console.error("Error assigning mission:", error);
      res.status(500).json({ message: "Lỗi giao nhiệm vụ" });
    }
  });

  // Submit mission (with photo upload)
  app.post("/api/missions/:id/submit", authenticate, upload.single('photo'), async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const { submissionNote } = req.body;
      const userId = req.user!.id;

      // Get assignment
      const [assignment] = await db.select()
        .from(missionAssignments)
        .where(and(
          eq(missionAssignments.missionId, missionId),
          eq(missionAssignments.userId, userId)
        ));

      if (!assignment) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ được giao" });
      }

      if (assignment.status === 'completed' || assignment.status === 'submitted') {
        return res.status(400).json({ message: "Nhiệm vụ đã được nộp hoặc hoàn thành" });
      }

      // Get mission details
      const [mission] = await db.select().from(missions).where(eq(missions.id, missionId));
      if (!mission) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
      }

      let uploadId = null;
      if (req.file) {
        // Save upload record
        const [upload] = await db.insert(uploads).values({
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: `/uploads/${req.file.filename}`,
          uploadedBy: userId
        }).returning();
        uploadId = upload.id;
      } else if (mission.requiresPhoto) {
        return res.status(400).json({ message: "Nhiệm vụ này yêu cầu tải lên hình ảnh" });
      }

      // Update assignment
      const [updatedAssignment] = await db.update(missionAssignments)
        .set({
          status: 'submitted',
          submissionNote: submissionNote || null,
          updatedAt: new Date()
        })
        .where(eq(missionAssignments.id, assignment.id))
        .returning();

      // Create submission record
      if (uploadId || submissionNote) {
        await db.insert(missionSubmissions).values({
          assignmentId: assignment.id,
          uploadId,
          submissionText: submissionNote || null
        });
      }

      res.json({ 
        message: "Nộp nhiệm vụ thành công",
        assignment: updatedAssignment
      });
    } catch (error) {
      console.error("Error submitting mission:", error);
      res.status(500).json({ message: "Lỗi nộp nhiệm vụ" });
    }
  });

  // Review mission submission
  app.post("/api/missions/assignments/:id/review", authenticate, authorize(PERMISSIONS.BEEPOINT_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const { status, reviewNote, pointsAwarded } = req.body;

      if (!['completed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const [assignment] = await db.select()
        .from(missionAssignments)
        .innerJoin(missions, eq(missionAssignments.missionId, missions.id))
        .where(eq(missionAssignments.id, assignmentId));

      if (!assignment) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
      }

      const pointsToAward = status === 'completed' ? 
        (pointsAwarded || assignment.missions.beePointsReward) : 0;

      // Update assignment
      const [updatedAssignment] = await db.update(missionAssignments)
        .set({
          status,
          reviewNote: reviewNote || null,
          pointsAwarded: pointsToAward,
          reviewedBy: req.user!.id,
          reviewedAt: new Date(),
          completedDate: status === 'completed' ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(missionAssignments.id, assignmentId))
        .returning();

      // Award BeePoints if completed
      if (status === 'completed' && pointsToAward > 0) {
        // Update user's BeePoints
        await db.update(beePoints)
          .set({
            currentPoints: sql`${beePoints.currentPoints} + ${pointsToAward}`,
            totalEarned: sql`${beePoints.totalEarned} + ${pointsToAward}`,
            updatedAt: new Date()
          })
          .where(eq(beePoints.userId, assignment.mission_assignments.userId));

        // Create transaction record
        await db.insert(pointTransactions).values({
          userId: assignment.mission_assignments.userId,
          amount: pointsToAward,
          type: 'mission_completion',
          description: `Hoàn thành nhiệm vụ: ${assignment.missions.title}`,
          createdBy: req.user!.id
        });
      }

      res.json({
        message: status === 'completed' ? "Duyệt nhiệm vụ thành công" : "Từ chối nhiệm vụ",
        assignment: updatedAssignment
      });

      // Send notification to user about review result
      await notificationService.notifyMissionReviewed(
        [assignment.mission_assignments.userId],
        assignment.missions.title,
        status,
        pointsToAward
      );
    } catch (error) {
      console.error("Error reviewing mission:", error);
      res.status(500).json({ message: "Lỗi duyệt nhiệm vụ" });
    }
  });

  // Self-assign mission (for members to take on available missions)
  app.post("/api/missions/:id/self-assign", authenticate, authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if mission exists and is available
      const [mission] = await db.select().from(missions).where(eq(missions.id, missionId));
      if (!mission) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
      }

      if (mission.status !== 'active') {
        return res.status(400).json({ message: "Nhiệm vụ không còn hoạt động" });
      }

      if (mission.maxParticipants && mission.currentParticipants >= mission.maxParticipants) {
        return res.status(400).json({ message: "Nhiệm vụ đã đầy" });
      }

      // Check if user already assigned
      const [existingAssignment] = await db.select()
        .from(missionAssignments)
        .where(and(
          eq(missionAssignments.missionId, missionId),
          eq(missionAssignments.userId, userId)
        ));

      if (existingAssignment) {
        return res.status(400).json({ message: "Bạn đã được giao nhiệm vụ này" });
      }

      // Create self-assignment  
      const [assignment] = await db.insert(missionAssignments).values({
        missionId,
        userId,
        status: 'assigned'
      }).returning();

      // Update participant count
      await db.update(missions)
        .set({ 
          currentParticipants: sql`${missions.currentParticipants} + 1`,
          updatedAt: new Date()
        })
        .where(eq(missions.id, missionId));

      res.status(201).json({ 
        message: "Tự nhận nhiệm vụ thành công",
        assignment
      });
    } catch (error) {
      console.error("Error self-assigning mission:", error);
      res.status(500).json({ message: "Lỗi tự nhận nhiệm vụ" });
    }
  });

  // Bulk assign mission to multiple users (admin only)
  app.post("/api/missions/:id/assign-bulk", authenticate, authorize(PERMISSIONS.BEEPOINT_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Danh sách người dùng không hợp lệ" });
      }

      // Check if mission exists
      const [mission] = await db.select().from(missions).where(eq(missions.id, missionId));
      if (!mission) {
        return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
      }

      // Check if there are enough slots
      if (mission.maxParticipants && (mission.currentParticipants + userIds.length) > mission.maxParticipants) {
        return res.status(400).json({ message: "Không đủ chỗ cho tất cả người dùng được chọn" });
      }

      const assignments = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          // Check if user already assigned
          const [existing] = await db.select()
            .from(missionAssignments)
            .where(and(
              eq(missionAssignments.missionId, missionId),
              eq(missionAssignments.userId, userId)
            ));

          if (existing) {
            errors.push(`Người dùng ${userId} đã được giao nhiệm vụ này`);
            continue;
          }

          // Create assignment
          const [assignment] = await db.insert(missionAssignments).values({
            missionId,
            userId,
            status: 'assigned'
          }).returning();

          assignments.push(assignment);
        } catch (error) {
          errors.push(`Lỗi giao nhiệm vụ cho người dùng ${userId}`);
        }
      }

      // Update participant count
      if (assignments.length > 0) {
        await db.update(missions)
          .set({ 
            currentParticipants: sql`${missions.currentParticipants} + ${assignments.length}`,
            updatedAt: new Date()
          })
          .where(eq(missions.id, missionId));

        // TODO: Send assignment notifications
      }

      res.status(201).json({
        message: `Giao nhiệm vụ thành công cho ${assignments.length} người dùng`,
        assignments,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error bulk assigning mission:", error);
      res.status(500).json({ message: "Lỗi giao nhiệm vụ hàng loạt" });
    }
  });

  // Get all mission assignments for admin review
  app.get("/api/missions/assignments", authenticate, authorize(PERMISSIONS.MISSION_REVIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.query;
      
      let whereConditions = [];
      if (status) {
        whereConditions.push(eq(missionAssignments.status, status as string));
      }

      const query = db.select({
        id: missionAssignments.id,
        status: missionAssignments.status,
        assignedDate: missionAssignments.assignedDate,
        startedDate: missionAssignments.startedDate,
        completedDate: missionAssignments.completedDate,
        submissionNote: missionAssignments.submissionNote,
        reviewNote: missionAssignments.reviewNote,
        pointsAwarded: missionAssignments.pointsAwarded,
        user: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email
        },
        mission: {
          id: missions.id,
          title: missions.title,
          description: missions.description,
          beePointsReward: missions.beePointsReward,
          deadline: missions.deadline
        }
      }).from(missionAssignments)
        .innerJoin(users, eq(missionAssignments.userId, users.id))
        .innerJoin(missions, eq(missionAssignments.missionId, missions.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      const assignments = await query.orderBy(desc(missionAssignments.assignedDate));
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching mission assignments:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách phân công nhiệm vụ" });
    }
  });

  // Update mission assignment status (for users to mark as in progress)
  app.patch("/api/missions/assignments/:id/status", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.user!.id;

      if (!["in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      // Check if user owns this assignment
      const [assignment] = await db.select()
        .from(missionAssignments)
        .where(and(
          eq(missionAssignments.id, assignmentId),
          eq(missionAssignments.userId, userId)
        ));

      if (!assignment) {
        return res.status(404).json({ message: "Không tìm thấy phân công nhiệm vụ" });
      }

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === "in_progress" && !assignment.startedDate) {
        updateData.startedDate = new Date();
      }

      const [updatedAssignment] = await db.update(missionAssignments)
        .set(updateData)
        .where(eq(missionAssignments.id, assignmentId))
        .returning();

      res.json({
        message: `Cập nhật trạng thái thành ${status === 'in_progress' ? 'đang thực hiện' : 'hoàn thành'}`,
        assignment: updatedAssignment
      });

      // Send notification for mission start
      if (status === 'in_progress') {
        const [mission] = await db.select()
          .from(missions)
          .where(eq(missions.id, assignment.missionId));
        
        if (mission) {
          await notificationService.notifyMissionCompleted(
            [userId], 
            mission.title, 
            req.user!.fullName
          );
        }
      }
    } catch (error) {
      console.error("Error updating assignment status:", error);
      res.status(500).json({ message: "Lỗi cập nhật trạng thái nhiệm vụ" });
    }
  });

  // Get user's mission assignments
  app.get("/api/missions/my-assignments", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const assignments = await db.select({
        id: missionAssignments.id,
        missionId: missionAssignments.missionId,
        userId: missionAssignments.userId,
        status: missionAssignments.status,
        assignedDate: missionAssignments.assignedDate,
        startedDate: missionAssignments.startedDate,
        completedDate: missionAssignments.completedDate,
      })
      .from(missionAssignments)
      .where(eq(missionAssignments.userId, userId));

      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user assignments:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách nhiệm vụ được giao" });
    }
  });

  // TODO: Implement notification system later

  // ===== SHOP SYSTEM API ENDPOINTS =====
  
  // ===== SHOP CATEGORY API ENDPOINTS =====
  
  // Get all shop categories
  app.get("/api/shop/categories", authenticate, authorize(PERMISSIONS.SHOP_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await dbStorage.getShopCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching shop categories:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách danh mục" });
    }
  });

  // Get single shop category
  app.get("/api/shop/categories/:id", authenticate, authorize(PERMISSIONS.SHOP_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await dbStorage.getShopCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching shop category:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin danh mục" });
    }
  });

  // Create new shop category (Admin only)
  app.post("/api/shop/categories", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const categoryData = insertShopCategorySchema.parse(req.body);
      const category = await dbStorage.createShopCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating shop category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Lỗi tạo danh mục" });
    }
  });

  // Update shop category (Admin only)
  app.put("/api/shop/categories/:id", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData = insertShopCategorySchema.partial().parse(req.body);
      const category = await dbStorage.updateShopCategory(categoryId, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating shop category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Lỗi cập nhật danh mục" });
    }
  });

  // Delete shop category (Admin only)
  app.delete("/api/shop/categories/:id", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      await dbStorage.deleteShopCategory(categoryId);
      res.json({ message: "Đã xóa danh mục thành công" });
    } catch (error) {
      console.error("Error deleting shop category:", error);
      res.status(500).json({ message: "Lỗi xóa danh mục" });
    }
  });

  // Get all shop products (active only for regular users)
  app.get("/api/shop/products", authenticate, authorize(PERMISSIONS.SHOP_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const products = await dbStorage.getShopProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching shop products:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm" });
    }
  });

  // Get all shop products for admin (including inactive)
  app.get("/api/shop/products-admin", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const products = await db.select().from(shopProducts).orderBy(desc(shopProducts.createdAt));
      res.json(products);
    } catch (error) {
      console.error("Error fetching shop products for admin:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm" });
    }
  });

  // Get single shop product
  app.get("/api/shop/products/:id", authenticate, authorize(PERMISSIONS.SHOP_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await dbStorage.getShopProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching shop product:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin sản phẩm" });
    }
  });

  // Create shop product (Admin only)
  app.post("/api/shop/products", authenticate, authorize(PERMISSIONS.SHOP_PRODUCT_CREATE), async (req: AuthenticatedRequest, res) => {
    try {
      const productData = {
        ...req.body,
        createdBy: req.user!.id,
      };

      const product = await dbStorage.createShopProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating shop product:", error);
      res.status(500).json({ message: "Lỗi tạo sản phẩm" });
    }
  });

  // Update shop product (Admin only)
  app.put("/api/shop/products/:id", authenticate, authorize(PERMISSIONS.SHOP_PRODUCT_EDIT), async (req: AuthenticatedRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await dbStorage.updateShopProduct(productId, req.body);
      
      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating shop product:", error);
      res.status(500).json({ message: "Lỗi cập nhật sản phẩm" });
    }
  });

  // Delete shop product (Admin only)
  app.delete("/api/shop/products/:id", authenticate, authorize(PERMISSIONS.SHOP_PRODUCT_DELETE), async (req: AuthenticatedRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      const deleted = await dbStorage.deleteShopProduct(productId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shop product:", error);
      res.status(500).json({ message: "Lỗi xóa sản phẩm" });
    }
  });

  // Purchase product with BeePoints
  app.post("/api/shop/purchase", authenticate, authorize(PERMISSIONS.SHOP_PURCHASE), async (req: AuthenticatedRequest, res) => {
    try {
      const { productId, quantity = 1, deliveryInfo } = req.body;
      
      console.log("Shop purchase request:", { userId: req.user!.id, productId, quantity, deliveryInfo });
      
      // Get product details
      const product = await dbStorage.getShopProduct(productId);
      console.log("Product found:", product);
      
      if (!product || !product.isActive) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại hoặc đã ngừng bán" });
      }

      // Check stock
      if (product.stockQuantity !== null && product.stockQuantity < quantity) {
        return res.status(400).json({ message: "Không đủ hàng trong kho" });
      }

      const totalCost = product.beePointsCost * quantity;
      console.log("Total cost:", totalCost);

      // Check user's BeePoints
      const userBeePoints = await dbStorage.getUserBeePoints(req.user!.id);
      console.log("User BeePoints:", userBeePoints);
      
      if (!userBeePoints || userBeePoints.currentPoints < totalCost) {
        return res.status(400).json({ message: "Không đủ BeePoints để đổi thưởng" });
      }

      // Create order
      const orderData = {
        userId: req.user!.id,
        productId,
        quantity,
        totalBeePointsCost: totalCost,
        deliveryInfo,
        status: "pending",
      };

      console.log("Creating order with data:", orderData);
      const order = await dbStorage.createShopOrder(orderData);
      console.log("Order created:", order);

      // Redeem BeePoints
      console.log("Redeeming BeePoints:", { userId: req.user!.id, orderId: order.id, totalCost });
      const redemptionSuccess = await dbStorage.redeemBeePoints(req.user!.id, order.id, totalCost);
      console.log("Redemption success:", redemptionSuccess);
      
      if (!redemptionSuccess) {
        return res.status(500).json({ message: "Lỗi xử lý giao dịch BeePoints" });
      }

      // Update product stock
      if (product.stockQuantity !== null) {
        await dbStorage.updateShopProduct(productId, {
          stockQuantity: product.stockQuantity - quantity,
        });
        console.log("Stock updated for product:", productId);
      }

      res.status(201).json({
        message: "Đổi thưởng thành công",
        order,
        remainingBeePoints: userBeePoints.currentPoints - totalCost,
      });
    } catch (error) {
      console.error("Error processing purchase:", error);
      res.status(500).json({ message: "Lỗi xử lý đơn đổi thưởng" });
    }
  });

  // Shop product image upload with mobile support
  app.post("/api/shop/products/:id/upload-image", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được tải lên" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update product with new image URL
      await db.update(shopProducts)
        .set({ 
          imageUrl: imageUrl,
          updatedAt: new Date()
        })
        .where(eq(shopProducts.id, productId));

      res.json({ 
        message: "Tải ảnh thành công",
        imageUrl: imageUrl,
        fileInfo: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error("Upload image error:", error);
      res.status(500).json({ message: "Lỗi khi tải ảnh lên" });
    }
  });

  // Create new shop product with image upload
  app.post("/api/shop/products-with-image", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, beePointsCost, category, stockQuantity } = req.body;
      
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const [newProduct] = await db.insert(shopProducts).values({
        name,
        description,
        beePointsCost: parseInt(beePointsCost),
        imageUrl,
        categoryId: parseInt(category),
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        createdBy: req.user!.id
      }).returning();

      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Create product with image error:", error);
      res.status(500).json({ message: "Lỗi khi tạo sản phẩm" });
    }
  });

  // ===== SHOP CATEGORY MANAGEMENT =====
  
  // Get all shop categories
  app.get("/api/shop/categories", authenticate, authorize(PERMISSIONS.SHOP_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await db.select().from(shopCategories)
        .where(eq(shopCategories.isActive, true))
        .orderBy(shopCategories.sortOrder, shopCategories.name);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching shop categories:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách danh mục" });
    }
  });

  // Get all shop categories for admin
  app.get("/api/shop/categories-admin", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await db.select().from(shopCategories)
        .orderBy(shopCategories.sortOrder, shopCategories.name);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching shop categories for admin:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách danh mục" });
    }
  });

  // Create shop category
  app.post("/api/shop/categories", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, icon, sortOrder } = req.body;
      
      const [newCategory] = await db.insert(shopCategories).values({
        name,
        description,
        icon,
        sortOrder: sortOrder || 0,
        createdBy: req.user!.id
      }).returning();

      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating shop category:", error);
      res.status(500).json({ message: "Lỗi tạo danh mục" });
    }
  });

  // Update shop category
  app.put("/api/shop/categories/:id", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { name, description, icon, sortOrder, isActive } = req.body;
      
      await db.update(shopCategories)
        .set({
          name,
          description,
          icon,
          sortOrder,
          isActive,
          updatedAt: new Date()
        })
        .where(eq(shopCategories.id, categoryId));

      res.json({ message: "Cập nhật danh mục thành công" });
    } catch (error) {
      console.error("Error updating shop category:", error);
      res.status(500).json({ message: "Lỗi cập nhật danh mục" });
    }
  });

  // Delete shop category
  app.delete("/api/shop/categories/:id", authenticate, authorize(PERMISSIONS.SHOP_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // Check if category has products
      const productsInCategory = await db.select().from(shopProducts)
        .where(eq(shopProducts.categoryId, categoryId))
        .limit(1);
      
      if (productsInCategory.length > 0) {
        return res.status(400).json({ message: "Không thể xóa danh mục có sản phẩm" });
      }

      await db.delete(shopCategories)
        .where(eq(shopCategories.id, categoryId));

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shop category:", error);
      res.status(500).json({ message: "Lỗi xóa danh mục" });
    }
  });

  // Get user's orders
  app.get("/api/shop/my-orders", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await dbStorage.getUserShopOrders(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Lỗi lấy lịch sử đổi thưởng" });
    }
  });

  // Get all orders (Admin only)
  app.get("/api/shop/orders", authenticate, authorize(PERMISSIONS.SHOP_ORDER_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await dbStorage.getShopOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching shop orders:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng" });
    }
  });

  // Update order status (Admin only)
  app.put("/api/shop/orders/:id", authenticate, authorize(PERMISSIONS.SHOP_ORDER_MANAGE), async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status, notes } = req.body;

      const updates: any = { status };
      if (notes) updates.notes = notes;
      if (status === "confirmed" || status === "delivered") {
        updates.processedBy = req.user!.id;
        updates.processedAt = new Date();
      }

      const order = await dbStorage.updateShopOrder(orderId, updates);
      
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating shop order:", error);
      res.status(500).json({ message: "Lỗi cập nhật đơn hàng" });
    }
  });

  // Get BeePoint circulation info (Admin only)
  app.get("/api/beepoints/circulation", authenticate, authorize(PERMISSIONS.BEEPOINT_CONFIG), async (req: AuthenticatedRequest, res) => {
    try {
      const circulation = await dbStorage.getBeePointCirculation();
      
      if (!circulation) {
        // Initialize circulation tracking
        const newCirculation = await dbStorage.updateBeePointCirculation({
          totalSupply: 1000000, // Default total supply
          totalDistributed: 0,
          totalRedeemed: 0,
          circulatingSupply: 0,
        });
        return res.json(newCirculation);
      }

      res.json(circulation);
    } catch (error) {
      console.error("Error fetching BeePoint circulation:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin lưu hành BeePoints" });
    }
  });

  // Update BeePoint circulation (Admin only)
  app.put("/api/beepoints/circulation", authenticate, authorize(PERMISSIONS.BEEPOINT_CONFIG), async (req: AuthenticatedRequest, res) => {
    try {
      const circulation = await dbStorage.updateBeePointCirculation(req.body);
      res.json(circulation);
    } catch (error) {
      console.error("Error updating BeePoint circulation:", error);
      res.status(500).json({ message: "Lỗi cập nhật thông tin lưu hành BeePoints" });
    }
  });

  // Push Notification Management APIs

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: Lấy danh sách thông báo
   *     description: Lấy danh sách các thông báo với thống kê trạng thái
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, sent, scheduled]
   *     responses:
   *       200:
   *         description: Danh sách thông báo
   */
  app.get("/api/notifications", authenticate, authorize([PERMISSIONS.NOTIFICATION_VIEW]), async (req: AuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status as string;

      let whereCondition = eq(notifications.isActive, true);
      if (status === 'pending') {
        whereCondition = and(whereCondition, isNull(notifications.sentAt));
      } else if (status === 'sent') {
        whereCondition = and(whereCondition, isNotNull(notifications.sentAt));
      } else if (status === 'scheduled') {
        whereCondition = and(whereCondition, isNotNull(notifications.scheduledAt), isNull(notifications.sentAt));
      }

      const notificationsList = await db
        .select({
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          priority: notifications.priority,
          targetType: notifications.targetType,
          targetIds: notifications.targetIds,
          scheduledAt: notifications.scheduledAt,
          sentAt: notifications.sentAt,
          createdAt: notifications.createdAt,
          sender: {
            id: users.id,
            fullName: users.fullName,
            email: users.email,
          },
          totalRecipients: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${notificationStatus} 
            WHERE ${notificationStatus.notificationId} = ${notifications.id}
          )`,
          deliveredCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${notificationStatus} 
            WHERE ${notificationStatus.notificationId} = ${notifications.id} 
            AND ${notificationStatus.status} IN ('delivered', 'read')
          )`,
          readCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${notificationStatus} 
            WHERE ${notificationStatus.notificationId} = ${notifications.id} 
            AND ${notificationStatus.status} = 'read'
          )`,
        })
        .from(notifications)
        .leftJoin(users, eq(users.id, notifications.senderId))
        .where(whereCondition)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(whereCondition);

      res.json({
        notifications: notificationsList,
        pagination: {
          page,
          limit,
          total: total[0].count,
          totalPages: Math.ceil(total[0].count / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     summary: Tạo thông báo mới
   *     description: Tạo và gửi thông báo đẩy cho các thành viên
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - message
   *               - targetType
   *             properties:
   *               title:
   *                 type: string
   *               message:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [info, success, warning, error, announcement]
   *               priority:
   *                 type: string
   *                 enum: [low, normal, high, urgent]
   *               targetType:
   *                 type: string
   *                 enum: [all, role, division, user, custom]
   *               targetIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               scheduledAt:
   *                 type: string
   *                 format: date-time
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: Thông báo đã được tạo
   */
  app.post("/api/notifications", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        title,
        message,
        type = "info",
        priority = "normal",
        targetType,
        targetIds = [],
        scheduledAt,
        metadata = {},
      } = req.body;

      const senderId = req.user!.id;

      // Use notification service to create and send notification
      const result = await notificationService.createNotification(senderId, {
        title,
        message,
        type,
        priority,
        targetType,
        targetIds,
        metadata
      });

      res.status(201).json({
        message: "Thông báo đã được tạo và gửi thành công",
        notification: result.notification,
        recipientCount: result.recipientCount
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Lỗi tạo thông báo" });
    }
  });

  // Debug token endpoint  
  app.get("/api/auth/debug-token", authenticate, async (req: AuthenticatedRequest, res) => {
    res.json({
      user: req.user,
      token_valid: true,
      timestamp: new Date().toISOString()
    });
  });

  // Test notification endpoint
  app.post("/api/notifications/test", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await notificationService.createNotification(req.user!.id, {
        title: "🔔 Test Notification",
        message: "Đây là thông báo test để kiểm tra hệ thống realtime. Thời gian: " + new Date().toLocaleString('vi-VN'),
        type: "info",
        priority: "normal",
        targetType: "user",
        targetIds: [req.user!.id.toString()],
        metadata: { test: true, timestamp: Date.now() }
      });

      res.json({
        message: "Test notification đã được gửi",
        notification: result.notification,
        recipientCount: result.recipientCount
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Lỗi gửi test notification" });
    }
  });

  // Legacy notification creation (keeping for compatibility)
  app.post("/api/notifications/legacy", authenticate, authorize([PERMISSIONS.NOTIFICATION_CREATE]), async (req: AuthenticatedRequest, res) => {
    try {
      const {
        title,
        message,
        type = "info",
        priority = "normal",
        targetType,
        targetIds = [],
        scheduledAt,
        metadata = {},
      } = req.body;

      const senderId = req.user!.id;

      // Create notification
      const [notification] = await db
        .insert(notifications)
        .values({
          title,
          message,
          type,
          priority,
          targetType,
          targetIds,
          senderId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          metadata,
        })
        .returning();

      // Determine recipients based on target type
      let recipients: number[] = [];

      switch (targetType) {
        case 'all':
          const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true));
          recipients = allUsers.map(u => u.id);
          break;

        case 'role':
          if (targetIds.length > 0) {
            const roleUsers = await db
              .select({ id: users.id })
              .from(users)
              .where(and(eq(users.isActive, true), inArray(users.roleId, targetIds.map(id => parseInt(id)))));
            recipients = roleUsers.map(u => u.id);
          }
          break;

        case 'division':
          if (targetIds.length > 0) {
            const divisionMembers = await db
              .select({ userId: members.userId })
              .from(members)
              .where(and(
                eq(members.isActive, true),
                inArray(members.divisionId, targetIds.map(id => parseInt(id))),
                isNotNull(members.userId)
              ));
            recipients = divisionMembers.map(m => m.userId!);
          }
          break;

        case 'user':
          recipients = targetIds.map(id => parseInt(id));
          break;

        case 'custom':
          recipients = targetIds.map(id => parseInt(id));
          break;
      }

      // Create notification status records for all recipients
      if (recipients.length > 0) {
        const statusRecords = recipients.map(userId => ({
          notificationId: notification.id,
          userId,
          status: scheduledAt ? 'pending' : 'sent',
          deliveredAt: scheduledAt ? null : new Date(),
        }));

        await db.insert(notificationStatus).values(statusRecords);

        // Mark notification as sent if not scheduled
        if (!scheduledAt) {
          await db
            .update(notifications)
            .set({ sentAt: new Date() })
            .where(eq(notifications.id, notification.id));
        }
      }

      res.status(201).json({
        ...notification,
        recipientCount: recipients.length,
        message: scheduledAt ? "Thông báo đã được lên lịch" : "Thông báo đã được gửi thành công",
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Lỗi tạo thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}/send:
   *   post:
   *     summary: Gửi thông báo đã lên lịch
   *     description: Gửi ngay lập tức một thông báo đã được lên lịch
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Thông báo đã được gửi
   */
  app.post("/api/notifications/:id/send", authenticate, authorize([PERMISSIONS.NOTIFICATION_SEND]), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);

      const [notification] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.isActive, true)));

      if (!notification) {
        return res.status(404).json({ message: "Không tìm thấy thông báo" });
      }

      if (notification.sentAt) {
        return res.status(400).json({ message: "Thông báo đã được gửi" });
      }

      // Update notification status records to sent
      await db
        .update(notificationStatus)
        .set({
          status: 'sent',
          deliveredAt: new Date(),
        })
        .where(eq(notificationStatus.notificationId, id));

      // Mark notification as sent
      await db
        .update(notifications)
        .set({ sentAt: new Date() })
        .where(eq(notifications.id, id));

      res.json({ message: "Thông báo đã được gửi thành công" });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Lỗi gửi thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     summary: Xóa thông báo
   *     description: Xóa mềm một thông báo (đánh dấu là không hoạt động)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Thông báo đã được xóa
   */
  app.delete("/api/notifications/:id", authenticate, authorize([PERMISSIONS.NOTIFICATION_DELETE]), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);

      await db
        .update(notifications)
        .set({ isActive: false })
        .where(eq(notifications.id, id));

      res.json({ message: "Đã xóa thông báo" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Lỗi xóa thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notifications/my:
   *   get:
   *     summary: Lấy thông báo của người dùng
   *     description: Lấy danh sách thông báo dành cho người dùng hiện tại
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: unread
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Danh sách thông báo của người dùng
   */
  app.get("/api/notifications/my", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unread === 'true';

      let whereCondition = and(
        eq(notificationStatus.userId, userId),
        eq(notifications.isActive, true)
      );

      if (unreadOnly) {
        whereCondition = and(whereCondition, ne(notificationStatus.status, 'read'));
      }

      const userNotifications = await db
        .select({
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          priority: notifications.priority,
          metadata: notifications.metadata,
          createdAt: notifications.createdAt,
          status: notificationStatus.status,
          deliveredAt: notificationStatus.deliveredAt,
          readAt: notificationStatus.readAt,
        })
        .from(notificationStatus)
        .leftJoin(notifications, eq(notifications.id, notificationStatus.notificationId))
        .where(whereCondition)
        .orderBy(desc(notifications.createdAt));

      res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Lỗi lấy thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}/read:
   *   post:
   *     summary: Đánh dấu thông báo đã đọc
   *     description: Đánh dấu một thông báo cụ thể là đã đọc
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Thông báo đã được đánh dấu đã đọc
   */
  app.post("/api/notifications/:id/read", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user!.id;

      await db
        .update(notificationStatus)
        .set({
          status: 'read',
          readAt: new Date(),
        })
        .where(and(
          eq(notificationStatus.notificationId, notificationId),
          eq(notificationStatus.userId, userId)
        ));

      res.json({ message: "Đã đánh dấu thông báo đã đọc" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Lỗi đánh dấu thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notifications/stats:
   *   get:
   *     summary: Thống kê thông báo
   *     description: Lấy thống kê tổng quan về hệ thống thông báo
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Thống kê thông báo
   */
  app.get("/api/notifications/stats", authenticate, authorize([PERMISSIONS.NOTIFICATION_VIEW]), async (req: AuthenticatedRequest, res) => {
    try {
      const totalNotifications = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.isActive, true));

      const sentNotifications = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.isActive, true), isNotNull(notifications.sentAt)));

      const scheduledNotifications = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.isActive, true),
          isNotNull(notifications.scheduledAt),
          isNull(notifications.sentAt)
        ));

      const totalRecipients = await db
        .select({ count: sql<number>`count(*)` })
        .from(notificationStatus);

      const readNotifications = await db
        .select({ count: sql<number>`count(*)` })
        .from(notificationStatus)
        .where(eq(notificationStatus.status, 'read'));

      res.json({
        totalNotifications: totalNotifications[0].count,
        sentNotifications: sentNotifications[0].count,
        scheduledNotifications: scheduledNotifications[0].count,
        totalRecipients: totalRecipients[0].count,
        readNotifications: readNotifications[0].count,
        readRate: totalRecipients[0].count > 0 
          ? ((readNotifications[0].count / totalRecipients[0].count) * 100).toFixed(2)
          : "0.00",
      });
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê thông báo" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time notifications
  const wsServer = new NotificationWebSocketServer(httpServer);
  notificationService.setWebSocketServer(wsServer);
  
  // ===== NOTIFICATIONS MANAGEMENT API =====
  
  // Get notifications history for admin
  app.get("/api/notifications/admin", authenticate, authorize(['system:admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const notificationsResult = await db.select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        priority: notifications.priority,
        metadata: notifications.metadata,
        createdAt: notifications.createdAt,
        senderId: notifications.senderId,
        senderName: users.fullName
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.senderId, users.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

      res.json({
        data: notificationsResult,
        pagination: {
          page,
          limit,
          total: notificationsResult.length
        }
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Lỗi khi lấy danh sách thông báo" });
    }
  });

  // Chat Routes
  
  // Get user's chat rooms
  app.get("/api/chat/rooms", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const rooms = await chatService.getUserRooms(userId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      res.status(500).json({ message: "Lỗi khi lấy danh sách phòng chat" });
    }
  });

  // Create private chat with user
  app.post("/api/users/chat/:userId", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const targetUserId = parseInt(req.params.userId);
      const currentUserId = req.user!.id;

      if (isNaN(targetUserId) || targetUserId === currentUserId) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      // Check if target user exists
      const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));
      if (!targetUser) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      // Check if they are friends
      const [connection] = await db
        .select()
        .from(userConnections)
        .where(
          and(
            or(
              and(
                eq(userConnections.requesterId, currentUserId),
                eq(userConnections.addresseeId, targetUserId)
              ),
              and(
                eq(userConnections.requesterId, targetUserId),
                eq(userConnections.addresseeId, currentUserId)
              )
            ),
            eq(userConnections.status, "accepted")
          )
        );

      if (!connection) {
        return res.status(403).json({ message: "Bạn chỉ có thể nhắn tin với bạn bè" });
      }

      const room = await chatService.createPrivateRoom(currentUserId, targetUserId);
      res.json(room);
    } catch (error) {
      console.error("Error creating private chat:", error);
      res.status(500).json({ message: "Lỗi khi tạo cuộc trò chuyện" });
    }
  });

  // Get or create private chat room
  app.post("/api/chat/rooms/private", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { targetUserId } = req.body;
      const userId = req.user!.id;

      if (!targetUserId || targetUserId === userId) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      const room = await chatService.createPrivateRoom(userId, targetUserId);
      res.json(room);
    } catch (error) {
      console.error("Error creating private room:", error);
      res.status(500).json({ message: "Lỗi khi tạo phòng chat riêng tư" });
    }
  });

  // Get or create support room for guest
  app.post("/api/chat/rooms/support", async (req, res) => {
    try {
      const { guestId, guestName } = req.body;

      if (!guestId || !guestName) {
        return res.status(400).json({ message: "Thiếu thông tin khách" });
      }

      const room = await chatService.getOrCreateSupportRoom(guestId, guestName);
      res.json(room);
    } catch (error) {
      console.error("Error creating support room:", error);
      res.status(500).json({ message: "Lỗi khi tạo phòng hỗ trợ" });
    }
  });

  // Delete chat room
  app.delete("/api/chat/rooms/:roomId", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const userId = req.user!.id;

      if (isNaN(roomId)) {
        return res.status(400).json({ message: "ID phòng chat không hợp lệ" });
      }

      // Check if user has access to this room
      const hasAccess = await chatService.hasRoomAccess(roomId, userId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Không có quyền xóa phòng chat này" });
      }

      await chatService.deleteRoom(roomId, userId);
      res.json({ message: "Đã xóa cuộc trò chuyện thành công" });
    } catch (error) {
      console.error("Error deleting chat room:", error);
      res.status(500).json({ message: "Lỗi khi xóa cuộc trò chuyện" });
    }
  });

  // Search chat rooms
  app.get("/api/chat/rooms/search", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Từ khóa tìm kiếm không được để trống" });
      }

      const rooms = await chatService.searchUserRooms(userId, query.trim());
      res.json(rooms);
    } catch (error) {
      console.error("Error searching chat rooms:", error);
      res.status(500).json({ message: "Lỗi khi tìm kiếm cuộc trò chuyện" });
    }
  });

  // Delete old messages to clean database
  app.delete("/api/chat/messages/cleanup", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const daysOld = parseInt(req.query.days as string) || 30; // Default 30 days

      // Only allow admin users to cleanup messages
      if (req.user!.roleId !== 7) {
        return res.status(403).json({ message: "Chỉ admin mới có thể dọn dẹp tin nhắn cũ" });
      }

      const deletedCount = await chatService.deleteOldMessages(daysOld);
      res.json({ 
        message: `Đã xóa ${deletedCount} tin nhắn cũ hơn ${daysOld} ngày`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error cleaning up old messages:", error);
      res.status(500).json({ message: "Lỗi khi dọn dẹp tin nhắn cũ" });
    }
  });

  // Auto cleanup old messages (run daily) 
  const autoCleanupMessages = async () => {
    try {
      // Delete messages older than 30 days automatically
      const deletedCount = await chatService.deleteOldMessages(30);
      
      if (deletedCount > 0) {
        console.log(`Auto cleanup: Deleted ${deletedCount} messages older than 30 days`);
      }
    } catch (error) {
      console.error("Error in auto cleanup messages:", error);
    }
  };

  // Run cleanup every 24 hours
  setInterval(autoCleanupMessages, 24 * 60 * 60 * 1000); // 24 hours
  
  // Run initial cleanup after 5 minutes
  setTimeout(autoCleanupMessages, 5 * 60 * 1000); // 5 minutes

  // Get room messages
  app.get("/api/chat/rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Check access - either authenticated user or guest with guestId
      let hasAccess = false;
      let currentUserId: number | undefined;
      let currentGuestId: string | undefined;

      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = verifyToken(token);
          currentUserId = decoded.id;
          hasAccess = await chatService.hasRoomAccess(roomId, currentUserId);
        } catch (error) {
          // Invalid token, check for guest access
        }
      }

      if (!hasAccess && req.query.guestId) {
        currentGuestId = req.query.guestId as string;
        hasAccess = await chatService.hasRoomAccess(roomId, undefined, currentGuestId);
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Không có quyền truy cập phòng chat này" });
      }

      const messages = await chatService.getRoomMessages(roomId, limit, offset);
      
      // Mark messages as read from current user
      const messagesWithUserFlag = messages.map(msg => ({
        ...msg,
        isFromCurrentUser: currentUserId ? msg.senderId === currentUserId : msg.guestId === currentGuestId,
      }));

      res.json(messagesWithUserFlag);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Lỗi khi lấy tin nhắn" });
    }
  });

  // Send message
  app.post("/api/chat/rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { content, guestId, guestName } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" });
      }

      let senderId: number | undefined;
      let hasAccess = false;

      // Check authentication
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = verifyToken(token);
          senderId = decoded.id;
          hasAccess = await chatService.hasRoomAccess(roomId, senderId);
        } catch (error) {
          // Invalid token
        }
      }

      // Check guest access
      if (!hasAccess && guestId) {
        hasAccess = await chatService.hasRoomAccess(roomId, undefined, guestId);
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Không có quyền gửi tin nhắn vào phòng này" });
      }

      const message = await chatService.sendMessage(
        roomId,
        content.trim(),
        senderId,
        guestId,
        guestName
      );

      // Broadcast to WebSocket clients if server exists
      if (typeof wsServer !== 'undefined' && wsServer.broadcastToRoom) {
        wsServer.broadcastToRoom(roomId, "new_message", message);
      }

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Lỗi khi gửi tin nhắn" });
    }
  });

  // Get available users for new chat
  app.get("/api/chat/users", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const currentUserId = req.user!.id;
      const users = await chatService.getAvailableUsers(currentUserId);
      
      // Remove current user from the list
      const filteredUsers = users.filter(user => user.id !== currentUserId);
      
      res.json(filteredUsers.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl ? `/uploads/${user.avatarUrl}` : null,
      })));
    } catch (error) {
      console.error("Error fetching available users:", error);
      res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
    }
  });

  // User Discovery & Friend System APIs

  // Search users for discovery
  app.get("/api/users/search", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(400).json({ message: "Từ khóa tìm kiếm phải có ít nhất 2 ký tự" });
      }

      console.log("Search API called with query:", q, "by user:", req.user?.id);

      const searchTerm = q.trim();
      const searchLimit = Math.min(parseInt(limit as string) || 20, 50);

      // Get users from database with connection status
      const searchResults = await db.execute(sql`
        SELECT 
          u.id, u.username, u.full_name, u.email, u.avatar_url, u.bio, u.created_at,
          uc.status as connection_status,
          uc.requester_id,
          uc.addressee_id
        FROM users u
        LEFT JOIN user_connections uc ON (
          (uc.requester_id = ${req.user!.id} AND uc.addressee_id = u.id) OR
          (uc.addressee_id = ${req.user!.id} AND uc.requester_id = u.id)
        )
        WHERE u.id != ${req.user!.id} 
          AND u.is_active = true
          AND (u.is_private = false OR u.is_private IS NULL)
          AND (
            LOWER(u.full_name) ILIKE LOWER(${`%${searchTerm}%`}) OR
            LOWER(u.username) ILIKE LOWER(${`%${searchTerm}%`}) OR  
            LOWER(u.email) ILIKE LOWER(${`%${searchTerm}%`})
          )
        LIMIT ${searchLimit}
      `);

      // Process results to determine connection status
      const processedResults = searchResults.rows.map((user: any) => {
        let connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' = 'none';
        
        if (user.connection_status) {
          if (user.connection_status === 'accepted') {
            connectionStatus = 'connected';
          } else if (user.connection_status === 'pending') {
            connectionStatus = user.requester_id === req.user!.id 
              ? 'pending_sent' 
              : 'pending_received';
          }
        }

        return {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          createdAt: user.created_at,
          connectionStatus,
        };
      });

      res.json(processedResults);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Lỗi tìm kiếm người dùng" });
    }
  });

  // Cancel/Delete friend request
  app.delete("/api/users/connect/:userId", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;
      
      // Find and delete the connection request
      const [deletedConnection] = await db
        .delete(userConnections)
        .where(
          or(
            and(
              eq(userConnections.requesterId, currentUserId),
              eq(userConnections.addresseeId, parseInt(userId))
            ),
            and(
              eq(userConnections.requesterId, parseInt(userId)),
              eq(userConnections.addresseeId, currentUserId)
            )
          )
        )
        .returning();

      if (!deletedConnection) {
        return res.status(404).json({ message: "Không tìm thấy kết nối để hủy" });
      }

      // Send notification to the addressee if it was a pending request
      if (deletedConnection.status === 'pending' && deletedConnection.requesterId === currentUserId) {
        await notificationService.createNotification(currentUserId, {
          title: "Lời mời kết bạn đã bị hủy",
          message: `${req.user!.fullName || req.user!.username} đã hủy lời mời kết bạn`,
          type: 'info',
          priority: 'low',
          targetType: 'user',
          targetIds: [deletedConnection.addresseeId.toString()],
          metadata: {
            type: 'friend_request_cancelled',
            connectionId: deletedConnection.id,
            requesterId: currentUserId,
            requesterName: req.user!.fullName || req.user!.username,
            action: 'cancelled'
          }
        });
      }

      // Send cache refresh notification to requester
      await notificationService.createNotification(currentUserId, {
        title: "Cache Refresh",
        message: "Friend request status updated",
        type: 'info',
        priority: 'low',
        targetType: 'user',
        targetIds: [currentUserId.toString()],
        metadata: {
          type: 'cache_refresh',
          action: 'friend_request_cancelled',
          targetUserId: deletedConnection.addresseeId
        }
      });

      res.json({ 
        message: "Đã hủy lời mời kết bạn thành công"
      });
    } catch (error) {
      console.error("Error canceling friend request:", error);
      res.status(500).json({ message: "Lỗi khi hủy lời mời kết bạn" });
    }
  });

  // Send friend request
  app.post("/api/users/connect", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, message } = req.body;

      if (!userId || userId === req.user!.id) {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }

      // Check if target user exists
      const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!targetUser) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      // Check if connection already exists
      const existingConnections = await db
        .select()
        .from(userConnections)
        .where(
          and(
            eq(userConnections.requesterId, req.user!.id),
            eq(userConnections.addresseeId, userId)
          )
        );

      if (existingConnections.length > 0) {
        return res.status(400).json({ message: "Đã gửi lời mời kết bạn trước đó" });
      }

      // Create connection request
      const [connection] = await db
        .insert(userConnections)
        .values({
          requesterId: req.user!.id,
          addresseeId: userId,
          requestMessage: message || null,
          status: "pending"
        })
        .returning();

      // Send notification to the target user
      await notificationService.createNotification(req.user!.id, {
        title: "Lời mời kết bạn mới",
        message: `${req.user!.fullName || req.user!.username} đã gửi lời mời kết bạn cho bạn`,
        type: 'info',
        priority: 'normal',
        targetType: 'user',
        targetIds: [userId.toString()],
        metadata: {
          type: 'friend_request',
          connectionId: connection.id,
          requesterId: req.user!.id,
          requesterName: req.user!.fullName || req.user!.username,
          requesterAvatar: req.user!.avatarUrl,
          action: 'sent'
        }
      });

      // Also send cache refresh notification to requester
      await notificationService.createNotification(req.user!.id, {
        title: "Cache Refresh",
        message: "Friend request status updated",
        type: 'info',
        priority: 'low',
        targetType: 'user',
        targetIds: [req.user!.id.toString()],
        metadata: {
          type: 'cache_refresh',
          action: 'friend_request_sent',
          targetUserId: userId
        }
      });

      res.json({
        message: "Đã gửi lời mời kết bạn",
        connection: {
          id: connection.id,
          status: connection.status,
          requestedAt: connection.requestedAt
        }
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Lỗi gửi lời mời kết bạn" });
    }
  });

  // Respond to friend request
  app.post("/api/users/respond/:connectionId", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const connectionId = parseInt(req.params.connectionId);
      const { action } = req.body; // 'accept' or 'reject'

      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Hành động không hợp lệ" });
      }

      // Find connection
      const [connection] = await db
        .select()
        .from(userConnections)
        .where(
          and(
            eq(userConnections.id, connectionId),
            eq(userConnections.addresseeId, req.user!.id),
            eq(userConnections.status, "pending")
          )
        );

      if (!connection) {
        return res.status(404).json({ message: "Lời mời không tồn tại hoặc đã được xử lý" });
      }

      // Update connection status
      const [updatedConnection] = await db
        .update(userConnections)
        .set({
          status: action === 'accept' ? 'accepted' : 'rejected',
          respondedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userConnections.id, connectionId))
        .returning();

      // Send notification to the requester
      const notificationMessage = action === 'accept' 
        ? `${req.user!.fullName || req.user!.username} đã chấp nhận lời mời kết bạn của bạn`
        : `${req.user!.fullName || req.user!.username} đã từ chối lời mời kết bạn của bạn`;

      await notificationService.createNotification(req.user!.id, {
        title: action === 'accept' ? "Lời mời được chấp nhận" : "Lời mời bị từ chối",
        message: notificationMessage,
        type: action === 'accept' ? 'success' : 'info',
        priority: 'normal',
        targetType: 'user',
        targetIds: [connection.requesterId.toString()],
        metadata: {
          type: 'friend_request_response',
          connectionId: connection.id,
          responseAction: action,
          responderId: req.user!.id,
          responderName: req.user!.fullName || req.user!.username,
          responderAvatar: req.user!.avatarUrl,
          action: action
        }
      });

      // Send cache refresh notification to responder
      await notificationService.createNotification(req.user!.id, {
        title: "Cache Refresh",
        message: "Friend request status updated",
        type: 'info',
        priority: 'low',
        targetType: 'user',
        targetIds: [req.user!.id.toString()],
        metadata: {
          type: 'cache_refresh',
          action: `friend_request_${action}`,
          targetUserId: connection.requesterId
        }
      });

      res.json({
        message: action === 'accept' ? "Đã chấp nhận lời mời kết bạn" : "Đã từ chối lời mời kết bạn",
        connection: {
          id: updatedConnection.id,
          status: updatedConnection.status,
          respondedAt: updatedConnection.respondedAt
        }
      });
    } catch (error) {
      console.error("Error responding to friend request:", error);
      res.status(500).json({ message: "Lỗi xử lý lời mời kết bạn" });
    }
  });

  // Get friend requests (received)
  app.get("/api/users/requests", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const connections = await db
        .select({
          id: userConnections.id,
          requestMessage: userConnections.requestMessage,
          requestedAt: userConnections.requestedAt,
          requester: {
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl
          }
        })
        .from(userConnections)
        .innerJoin(users, eq(userConnections.requesterId, users.id))
        .where(
          and(
            eq(userConnections.addresseeId, req.user!.id),
            eq(userConnections.status, "pending")
          )
        )
        .orderBy(desc(userConnections.requestedAt));

      res.json(connections);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách lời mời kết bạn" });
    }
  });

  // Get user profile by username/slug
  app.get("/api/users/profile/:identifier", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { identifier } = req.params;
      const currentUserId = req.user!.id;
      
      // Check if identifier is numeric (ID) or string (username/slug)
      const isNumeric = /^\d+$/.test(identifier);
      const whereCondition = isNumeric 
        ? eq(users.id, parseInt(identifier))
        : eq(users.username, identifier);
      
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
          phone: users.phone,
          facebookUrl: users.facebookUrl,
          instagramUrl: users.instagramUrl,
          tiktokUrl: users.tiktokUrl,
          youtubeUrl: users.youtubeUrl,
          linkedinUrl: users.linkedinUrl,
          githubUrl: users.githubUrl,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereCondition);

      if (!user) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      console.log("Found user:", user);

      // Check if this is own profile
      const isOwnProfile = user.id === currentUserId;
      
      // Get posts count
      const [postsCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.authorId, user.id));
      const postsCount = postsCountResult?.count || 0;
      
      // Get friends count
      const [friendsCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userConnections)
        .where(
          and(
            or(
              eq(userConnections.requesterId, user.id),
              eq(userConnections.addresseeId, user.id)
            ),
            eq(userConnections.status, "accepted")
          )
        );
      const friendsCount = friendsCountResult?.count || 0;
      
      // Check connection status with current user
      let connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected' = 'none';
      let isFriend = false;
      
      if (!isOwnProfile) {
        const [connection] = await db
          .select()
          .from(userConnections)
          .where(
            or(
              and(
                eq(userConnections.requesterId, currentUserId),
                eq(userConnections.addresseeId, user.id)
              ),
              and(
                eq(userConnections.requesterId, user.id),
                eq(userConnections.addresseeId, currentUserId)
              )
            )
          )
          .limit(1);
        
        if (connection) {
          if (connection.status === 'accepted') {
            connectionStatus = 'connected';
            isFriend = true;
          } else if (connection.status === 'pending') {
            if (connection.requesterId === currentUserId) {
              connectionStatus = 'pending_sent';
            } else {
              connectionStatus = 'pending_received';
            }
          }
        }
      }

      res.json({
        ...user,
        avatarUrl: user.avatarUrl ? `/uploads/${user.avatarUrl}` : null,
        isOwnProfile,
        isFriend,
        connectionStatus,
        postsCount,
        friendsCount,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng" });
    }
  });

  // Get user posts
  app.get("/api/users/:identifier/posts", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { identifier } = req.params;
      
      // Check if identifier is numeric (ID) or string (username)
      const isNumeric = /^\d+$/.test(identifier);
      let targetUserId: number;
      
      if (isNumeric) {
        targetUserId = parseInt(identifier);
      } else {
        // Look up user by username
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, identifier));
        
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại" });
        }
        targetUserId = user.id;
      }

      // Get posts with author info
      const userPosts = await db
        .select({
          id: posts.id,
          content: posts.content,
          imageUrls: posts.imageUrls,
          createdAt: posts.createdAt,
          authorId: posts.userId,
          authorName: users.fullName,
          authorAvatar: users.avatarUrl,
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.userId, targetUserId))
        .orderBy(desc(posts.createdAt));

      // Get like and comment counts for each post, plus check if current user liked
      const postsWithStats = await Promise.all(userPosts.map(async (post) => {
        // Get likes count
        const [likesCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));
        
        // Get comments count
        const [commentsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(postComments)
          .where(eq(postComments.postId, post.id));
        
        // Check if current user liked this post
        const [userLike] = await db
          .select()
          .from(postLikes)
          .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, req.user!.id)))
          .limit(1);
        
        return {
          id: post.id,
          content: post.content,
          imageUrls: post.imageUrls || [],
          createdAt: post.createdAt,
          author: {
            id: post.authorId,
            fullName: post.authorName,
            avatarUrl: post.authorAvatar,
          },
          likes: likesCount.count || 0,
          comments: commentsCount.count || 0,
          isLiked: !!userLike,
        };
      }));

      res.json(postsWithStats);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Lỗi khi lấy bài viết" });
    }
  });

  // Create new post
  app.post("/api/posts", authenticate, upload.array('images', 5), async (req: AuthenticatedRequest, res) => {
    try {
      const { content } = req.body;
      const currentUserId = req.user!.id;
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "Nội dung bài viết không được để trống" });
      }

      // Handle uploaded images
      const imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) => {
          imageUrls.push(`/uploads/${file.filename}`);
        });
      }

      // Save to database
      const [newPost] = await db
        .insert(posts)
        .values({
          userId: currentUserId,
          content: content.trim(),
          imageUrls,
        })
        .returning();

      // Get author info
      const [author] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, currentUserId));

      res.json({
        message: "Tạo bài viết thành công",
        post: {
          ...newPost,
          author,
          likes: 0,
          comments: 0,
          isLiked: false,
        }
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Lỗi khi tạo bài viết" });
    }
  });

  // Like/unlike post
  app.post("/api/posts/:postId/like", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID bài viết không hợp lệ" });
      }
      
      // Check if post exists
      const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      if (!post) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }
      
      // Check if already liked
      const [existingLike] = await db
        .select()
        .from(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
        .limit(1);
      
      if (existingLike) {
        // Unlike - remove like
        await db
          .delete(postLikes)
          .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
        
        res.json({ message: "Đã bỏ thích bài viết", liked: false });
      } else {
        // Like - add like
        await db.insert(postLikes).values({
          postId,
          userId
        });
        
        res.json({ message: "Đã thích bài viết", liked: true });
      }
    } catch (error) {
      console.error("Error toggling post like:", error);
      res.status(500).json({ message: "Lỗi khi thích/bỏ thích bài viết" });
    }
  });

  // Add comment to post
  app.post("/api/posts/:postId/comments", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;
      const { content } = req.body;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID bài viết không hợp lệ" });
      }
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
      }
      
      // Check if post exists
      const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      if (!post) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }
      
      // Create comment
      const [newComment] = await db
        .insert(postComments)
        .values({
          postId,
          userId,
          content: content.trim()
        })
        .returning();
      
      // Get author info
      const [author] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, userId));
      
      res.status(201).json({
        message: "Đã thêm bình luận",
        comment: {
          ...newComment,
          author
        }
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Lỗi khi tạo bình luận" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID bài viết không hợp lệ" });
      }
      
      const comments = await db
        .select({
          id: postComments.id,
          content: postComments.content,
          createdAt: postComments.createdAt,
          author: {
            id: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          }
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.userId, users.id))
        .where(eq(postComments.postId, postId))
        .orderBy(desc(postComments.createdAt))
        .limit(limit)
        .offset(offset);
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Lỗi khi lấy bình luận" });
    }
  });

  // Get friends list
  app.get("/api/users/friends", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      // Get accepted connections where user is either requester or addressee
      const connections = await db
        .select({
          connectionId: userConnections.id,
          connectedAt: userConnections.respondedAt,
          friend: {
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
            bio: users.bio
          }
        })
        .from(userConnections)
        .innerJoin(users, 
          or(
            and(eq(userConnections.requesterId, req.user!.id), eq(users.id, userConnections.addresseeId)),
            and(eq(userConnections.addresseeId, req.user!.id), eq(users.id, userConnections.requesterId))
          )
        )
        .where(
          and(
            eq(userConnections.status, "accepted"),
            or(
              eq(userConnections.requesterId, req.user!.id),
              eq(userConnections.addresseeId, req.user!.id)
            )
          )
        )
        .orderBy(desc(userConnections.respondedAt));

      res.json(connections);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách bạn bè" });
    }
  });

  // Create private chat with friend
  app.post("/api/users/chat/:friendId", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const friendId = parseInt(req.params.friendId);

      // Check if they are friends
      const friendship = await db
        .select()
        .from(userConnections)
        .where(
          and(
            eq(userConnections.status, "accepted"),
            or(
              and(eq(userConnections.requesterId, req.user!.id), eq(userConnections.addresseeId, friendId)),
              and(eq(userConnections.addresseeId, req.user!.id), eq(userConnections.requesterId, friendId))
            )
          )
        );

      if (friendship.length === 0) {
        return res.status(403).json({ message: "Bạn chỉ có thể chat với bạn bè" });
      }

      // Create or get existing private room
      const room = await chatService.createPrivateRoom(req.user!.id, friendId);
      res.json(room);
    } catch (error) {
      console.error("Error creating chat with friend:", error);
      res.status(500).json({ message: "Lỗi tạo chat với bạn bè" });
    }
  });

  // Notification Templates
  /**
   * @swagger
   * /api/notification-templates:
   *   get:
   *     tags: [Notification Templates]
   *     summary: Lấy danh sách mẫu thông báo
   *     description: Lấy tất cả mẫu thông báo (admin only)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Danh sách mẫu thông báo
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   */
  app.get("/api/notification-templates", authenticate, authorize(PERMISSIONS.SYSTEM_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const templates = await db.select().from(notificationTemplates).orderBy(desc(notificationTemplates.createdAt));
      res.json(templates);
    } catch (error) {
      console.error("Error fetching notification templates:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách mẫu thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notification-templates:
   *   post:
   *     tags: [Notification Templates]
   *     summary: Tạo mẫu thông báo mới
   *     description: Tạo mẫu thông báo mới (admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   */
  app.post("/api/notification-templates", authenticate, authorize(PERMISSIONS.SYSTEM_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const validationResult = insertNotificationTemplateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Dữ liệu không hợp lệ",
          errors: validationResult.error.issues
        });
      }

      const [template] = await db.insert(notificationTemplates).values(validationResult.data).returning();
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating notification template:", error);
      res.status(500).json({ message: "Lỗi tạo mẫu thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notification-templates/{id}:
   *   put:
   *     tags: [Notification Templates]
   *     summary: Cập nhật mẫu thông báo
   *     description: Cập nhật mẫu thông báo (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   */
  app.put("/api/notification-templates/:id", authenticate, authorize(PERMISSIONS.SYSTEM_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const validationResult = insertNotificationTemplateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Dữ liệu không hợp lệ",
          errors: validationResult.error.issues
        });
      }

      const [updatedTemplate] = await db.update(notificationTemplates)
        .set({ ...validationResult.data, updatedAt: new Date() })
        .where(eq(notificationTemplates.id, templateId))
        .returning();

      if (!updatedTemplate) {
        return res.status(404).json({ message: "Không tìm thấy mẫu thông báo" });
      }

      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating notification template:", error);
      res.status(500).json({ message: "Lỗi cập nhật mẫu thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notification-templates/{id}:
   *   delete:
   *     tags: [Notification Templates]
   *     summary: Xóa mẫu thông báo
   *     description: Xóa mẫu thông báo (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   */
  app.delete("/api/notification-templates/:id", authenticate, authorize(PERMISSIONS.SYSTEM_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const templateId = parseInt(req.params.id);
      
      const [deletedTemplate] = await db.delete(notificationTemplates)
        .where(eq(notificationTemplates.id, templateId))
        .returning();

      if (!deletedTemplate) {
        return res.status(404).json({ message: "Không tìm thấy mẫu thông báo" });
      }

      res.json({ message: "Đã xóa mẫu thông báo thành công" });
    } catch (error) {
      console.error("Error deleting notification template:", error);
      res.status(500).json({ message: "Lỗi xóa mẫu thông báo" });
    }
  });

  /**
   * @swagger
   * /api/notifications/test-template:
   *   post:
   *     tags: [Notification Templates]
   *     summary: Test gửi thông báo từ mẫu
   *     description: Gửi thông báo test từ mẫu đến người dùng cụ thể (admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               templateId:
   *                 type: integer
   *               userId:
   *                 type: integer
   */
  app.post("/api/notifications/test-template", authenticate, authorize(PERMISSIONS.SYSTEM_ADMIN), async (req: AuthenticatedRequest, res) => {
    try {
      const { templateId, userId } = req.body;
      
      if (!templateId || !userId) {
        return res.status(400).json({ message: "templateId và userId là bắt buộc" });
      }

      // Get template
      const [template] = await db.select().from(notificationTemplates).where(eq(notificationTemplates.id, templateId));
      
      if (!template) {
        return res.status(404).json({ message: "Không tìm thấy mẫu thông báo" });
      }

      // Get user
      const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!targetUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Replace template variables with test data
      let title = template.title.replace(/{userName}/g, targetUser.fullName)
                             .replace(/{missionName}/g, "Test Mission")
                             .replace(/{points}/g, "10")
                             .replace(/{achievementName}/g, "Test Achievement");
                             
      let content = template.content.replace(/{userName}/g, targetUser.fullName)
                                  .replace(/{missionName}/g, "Test Mission")
                                  .replace(/{points}/g, "10")
                                  .replace(/{achievementName}/g, "Test Achievement");

      // Create notification
      const [notification] = await db.insert(notifications).values({
        userId: userId,
        title: `[TEST] ${title}`,
        content: content,
        type: template.type,
        priority: 'medium',
        isRead: false,
        metadata: { test: true, templateId: templateId }
      }).returning();

      // Update template usage count
      await db.update(notificationTemplates)
        .set({ usageCount: sql`${notificationTemplates.usageCount} + 1` })
        .where(eq(notificationTemplates.id, templateId));

      // Send via WebSocket if user is online
      notificationWebSocket.sendToUser(userId, {
        type: 'notification',
        data: notification
      });

      res.status(201).json({ message: "Đã gửi thông báo test thành công", notification });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Lỗi gửi thông báo test" });
    }
  });

  // ===== NEWSFEED API =====
  
  // Admin route to get all posts for management
  app.get("/api/admin/posts", authenticate, authorize([PERMISSIONS.SYSTEM_ADMIN]), async (req: AuthenticatedRequest, res) => {
    try {
      const allPosts = await db
        .select({
          id: posts.id,
          content: posts.content,
          images: posts.images,
          visibility: posts.visibility,
          isPinned: posts.isPinned,
          pinnedAt: posts.pinnedAt,
          createdAt: posts.createdAt,
          author: {
            id: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          },
          _count: {
            likes: sql<number>`(SELECT COUNT(*) FROM ${postLikes} WHERE ${postLikes.postId} = ${posts.id})`,
            comments: sql<number>`(SELECT COUNT(*) FROM ${postComments} WHERE ${postComments.postId} = ${posts.id})`,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .orderBy(desc(posts.isPinned), desc(posts.createdAt));

      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách bài viết" });
    }
  });

  // Get newsfeed posts (public posts ordered by creation, with pinned first)
  app.get("/api/posts/newsfeed", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postsData = await db
        .select({
          id: posts.id,
          content: posts.content,
          images: posts.images,
          visibility: posts.visibility,
          isPinned: posts.isPinned,
          createdAt: posts.createdAt,
          author: {
            id: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          },
          _count: {
            likes: sql<number>`(SELECT COUNT(*) FROM ${postLikes} WHERE ${postLikes.postId} = ${posts.id})`,
            comments: sql<number>`(SELECT COUNT(*) FROM ${postComments} WHERE ${postComments.postId} = ${posts.id})`,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(or(
          eq(posts.visibility, "public"),
          eq(posts.isPinned, true)
        ))
        .orderBy(desc(posts.isPinned), desc(posts.createdAt))
        .limit(50);

      // Check if current user liked each post
      const postIds = postsData.map(p => p.id);
      const likes = postIds.length > 0 ? await db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(
          and(
            inArray(postLikes.postId, postIds),
            eq(postLikes.userId, req.user!.id)
          )
        ) : [];

      const likedPostIds = new Set(likes.map(l => l.postId));

      // Get latest comments for each post (up to 3)
      const commentsData = postIds.length > 0 ? await db
        .select({
          id: postComments.id,
          content: postComments.content,
          postId: postComments.postId,
          createdAt: postComments.createdAt,
          author: {
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.userId, users.id))
        .where(inArray(postComments.postId, postIds))
        .orderBy(desc(postComments.createdAt))
        .limit(150) : [];

      // Group comments by post (max 3 per post)
      const commentsByPost = new Map<number, any[]>();
      commentsData.forEach(comment => {
        if (!commentsByPost.has(comment.postId)) {
          commentsByPost.set(comment.postId, []);
        }
        if (commentsByPost.get(comment.postId)!.length < 3) {
          commentsByPost.get(comment.postId)!.push(comment);
        }
      });

      const postsWithInteractions = postsData.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        comments: commentsByPost.get(post.id) || [],
      }));

      res.json(postsWithInteractions);
    } catch (error) {
      console.error("Error fetching newsfeed:", error);
      res.status(500).json({ message: "Lỗi lấy bảng tin" });
    }
  });

  // Create new post
  app.post("/api/posts", authenticate, upload.array('images', 5), async (req: AuthenticatedRequest, res) => {
    try {
      const { content, visibility = "public" } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!content?.trim()) {
        return res.status(400).json({ message: "Nội dung bài viết không được để trống" });
      }

      // Validate visibility
      if (!["public", "friends", "private"].includes(visibility)) {
        return res.status(400).json({ message: "Chế độ hiển thị không hợp lệ" });
      }

      // Handle image uploads
      let imageUrls: string[] = [];
      if (files && files.length > 0) {
        imageUrls = files.map(file => `/uploads/${file.filename}`);
      }

      const [newPost] = await db
        .insert(posts)
        .values({
          content: content.trim(),
          authorId: req.user!.id,
          images: imageUrls.length > 0 ? imageUrls : [],
          visibility: visibility,
          isPinned: false,
        })
        .returning();

      // Get post with author info
      const [postWithAuthor] = await db
        .select({
          id: posts.id,
          content: posts.content,
          images: posts.images,
          visibility: posts.visibility,
          isPinned: posts.isPinned,
          createdAt: posts.createdAt,
          author: {
            id: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          },
          _count: {
            likes: sql<number>`0`,
            comments: sql<number>`0`,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, newPost.id));

      res.status(201).json({
        ...postWithAuthor,
        isLiked: false,
        comments: []
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Lỗi tạo bài viết" });
    }
  });

  // Get user's own posts
  app.get("/api/posts/my-posts", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postsData = await db
        .select({
          id: posts.id,
          content: posts.content,
          images: posts.images,
          visibility: posts.visibility,
          isPinned: posts.isPinned,
          createdAt: posts.createdAt,
          author: {
            id: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          },
          _count: {
            likes: sql<number>`(SELECT COUNT(*) FROM ${postLikes} WHERE ${postLikes.postId} = ${posts.id})`,
            comments: sql<number>`(SELECT COUNT(*) FROM ${postComments} WHERE ${postComments.postId} = ${posts.id})`,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.authorId, req.user!.id))
        .orderBy(desc(posts.createdAt));

      res.json(postsData);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Lỗi lấy bài viết của bạn" });
    }
  });

  // Delete user's own post
  app.delete("/api/posts/:postId", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;

      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID bài viết không hợp lệ" });
      }

      // Check if post exists and belongs to user (or user is admin)
      const [post] = await db.select().from(posts).where(eq(posts.id, postId));
      
      if (!post) {
        return res.status(404).json({ message: "Bài viết không tồn tại" });
      }

      const isAdmin = req.user!.permissions.includes('system:admin');
      if (post.authorId !== userId && !isAdmin) {
        return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
      }

      // Delete related data first
      await db.delete(postLikes).where(eq(postLikes.postId, postId));
      await db.delete(postComments).where(eq(postComments.postId, postId));
      
      // Delete the post
      await db.delete(posts).where(eq(posts.id, postId));

      res.json({ message: "Đã xóa bài viết thành công" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Lỗi xóa bài viết" });
    }
  });

  // Like/unlike post
  app.post("/api/posts/:postId/like", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;

      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID bài viết không hợp lệ" });
      }

      // Check if post exists
      const [post] = await db.select().from(posts).where(eq(posts.id, postId));
      if (!post) {
        return res.status(404).json({ message: "Bài viết không tồn tại" });
      }

      // Check if user already liked the post
      const [existingLike] = await db
        .select()
        .from(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

      if (existingLike) {
        // Unlike the post
        await db
          .delete(postLikes)
          .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

        // Decrease likes count
        await db
          .update(posts)
          .set({ 
            likes: sql`${posts.likes} - 1`,
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));

        res.json({ message: "Đã bỏ thích bài viết", liked: false });
      } else {
        // Like the post
        await db.insert(postLikes).values({ postId, userId });

        // Increase likes count
        await db
          .update(posts)
          .set({ 
            likes: sql`${posts.likes} + 1`,
            updatedAt: new Date()
          })
          .where(eq(posts.id, postId));

        res.json({ message: "Đã thích bài viết", liked: true });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Lỗi thích bài viết" });
    }
  });

  // Add comment to post
  app.post("/api/posts/:postId/comments", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const { content } = req.body;
      const userId = req.user!.id;

      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID bài viết không hợp lệ" });
      }

      if (!content?.trim()) {
        return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
      }

      // Check if post exists
      const [post] = await db.select().from(posts).where(eq(posts.id, postId));
      if (!post) {
        return res.status(404).json({ message: "Bài viết không tồn tại" });
      }

      const [newComment] = await db
        .insert(postComments)
        .values({
          content: content.trim(),
          postId,
          userId,
        })
        .returning();

      // Increase comments count
      await db
        .update(posts)
        .set({ 
          comments: sql`${posts.comments} + 1`,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));

      // Get comment with author info
      const [commentWithAuthor] = await db
        .select({
          id: postComments.id,
          content: postComments.content,
          postId: postComments.postId,
          createdAt: postComments.createdAt,
          author: {
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.userId, users.id))
        .where(eq(postComments.id, newComment.id));

      res.status(201).json(commentWithAuthor);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Lỗi thêm bình luận" });
    }
  });

  // Pin/unpin post (admin only)
  app.put("/api/posts/:postId/pin", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const { isPinned } = req.body;
      const userRole = req.user!.role?.name;

      if (isNaN(postId)) {
        return res.status(400).json({ message: "ID bài viết không hợp lệ" });
      }

      // Check if user is admin
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
        return res.status(403).json({ message: "Chỉ admin mới có thể ghim bài viết" });
      }

      // Check if post exists
      const [post] = await db.select().from(posts).where(eq(posts.id, postId));
      if (!post) {
        return res.status(404).json({ message: "Bài viết không tồn tại" });
      }

      // If pinning, check if already have 3 pinned posts
      if (isPinned) {
        const pinnedPostsCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(eq(posts.isPinned, true));

        if (pinnedPostsCount[0]?.count >= 3) {
          return res.status(400).json({ message: "Chỉ được ghim tối đa 3 bài viết" });
        }
      }

      await db
        .update(posts)
        .set({ 
          isPinned: isPinned,
          updatedAt: new Date()
        })
        .where(eq(posts.id, postId));

      res.json({ message: isPinned ? "Đã ghim bài viết" : "Đã bỏ ghim bài viết" });
    } catch (error) {
      console.error("Error pinning post:", error);
      res.status(500).json({ message: "Lỗi ghim bài viết" });
    }
  });

  return httpServer;
}
