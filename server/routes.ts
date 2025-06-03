import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { db } from "./db";
import { users, members, beePoints, pointTransactions, achievements, userAchievements, departments, positions, divisions, academicYears, statistics } from "@shared/schema";
import { createMemberSchema, insertMemberSchema, createUserSchema, createRoleSchema, updateUserProfileSchema, createAchievementSchema, awardAchievementSchema, PERMISSIONS } from "@shared/schema";
import { authenticate, authorize, hashPassword, verifyPassword, generateToken, AuthenticatedRequest } from "./auth";
import { z } from "zod";
import { eq, and, desc, ilike, or, isNotNull } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

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
    // Extended support for mobile image formats
    const allowedImageTypes = /jpeg|jpg|png|gif|webp|heic|heif|avif/;
    const allowedDocTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const allAllowedTypes = new RegExp(`${allowedImageTypes.source}|${allowedDocTypes.source}`);
    
    const extname = allAllowedTypes.test(path.extname(file.originalname).toLowerCase());
    
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
        .leftJoin(departments, eq(departments.id, members.departmentId))
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

  app.get("/api/auth/me", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userWithRole = await dbStorage.getUserWithRole(req.user!.id);
      if (!userWithRole) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
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
          avatarUrl: userWithRole.avatarUrl,
          bio: userWithRole.bio,
          facebookUrl: userWithRole.facebookUrl,
          instagramUrl: userWithRole.instagramUrl,
          tiktokUrl: userWithRole.tiktokUrl,
        },
      });
    } catch (error) {
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
      res.status(500).json({ message: "Lỗi tạo vai trò" });
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
      
      let members = await dbStorage.getMembersWithDepartments();
      
      // Apply filters
      if (type && typeof type === 'string') {
        members = members.filter(member => member.memberType === type);
      }
      
      if (department && typeof department === 'string') {
        const deptId = parseInt(department);
        if (!isNaN(deptId)) {
          members = members.filter(member => member.departmentId === deptId);
        }
      }
      
      if (position && typeof position === 'string') {
        members = members.filter(member => member.position === position);
      }
      
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        members = members.filter(member =>
          member.fullName.toLowerCase().includes(searchLower) ||
          (member.studentId && member.studentId.toLowerCase().includes(searchLower)) ||
          member.class.toLowerCase().includes(searchLower) ||
          member.department.name.toLowerCase().includes(searchLower)
        );
      }
      
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
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
      
      // Validate department exists
      const department = await dbStorage.getDepartment(memberData.departmentId);
      if (!department) {
        return res.status(400).json({ message: "Ban không tồn tại" });
      }

      const newMember = await dbStorage.createMember(memberData);
      const memberWithDepartment = await dbStorage.getMemberWithDepartment(newMember.id);
      
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
        ...memberWithDepartment,
        userCredentials,
      };
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to create member" });
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
      
      // If updating department, validate it exists
      if (updateData.departmentId) {
        const department = await dbStorage.getDepartment(updateData.departmentId);
        if (!department) {
          return res.status(400).json({ message: "Ban không tồn tại" });
        }
      }

      const updatedMember = await dbStorage.updateMember(id, updateData);
      if (!updatedMember) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const memberWithDepartment = await dbStorage.getMemberWithDepartment(updatedMember.id);
      res.json(memberWithDepartment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Delete member
  app.delete("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const deleted = await dbStorage.deleteMember(id);
      if (!deleted) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
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

  app.post("/api/academic-years", authenticate, authorize([PERMISSIONS.SYSTEM_ADMIN]), async (req, res) => {
    try {
      const { name, startDate, endDate, description } = req.body;
      
      // Deactivate current active year if setting new one as active
      if (req.body.isActive) {
        await db.update(academicYears).set({ isActive: false });
      }
      
      const [newYear] = await db
        .insert(academicYears)
        .values({ name, startDate, endDate, description, isActive: req.body.isActive || false })
        .returning();
      
      res.status(201).json(newYear);
    } catch (error) {
      console.error("Error creating academic year:", error);
      res.status(500).json({ message: "Lỗi tạo khóa học" });
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

  app.post("/api/divisions", authenticate, authorize([PERMISSIONS.SYSTEM_ADMIN]), async (req, res) => {
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

  app.post("/api/dynamic-stats", authenticate, authorize([PERMISSIONS.SYSTEM_ADMIN]), async (req, res) => {
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

  app.post("/api/bee-points/add", authenticate, authorize([PERMISSIONS.SYSTEM_ADMIN]), async (req: AuthenticatedRequest, res) => {
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
  app.post("/api/users/:id/reset-password", authenticate, authorize([PERMISSIONS.SYSTEM_ADMIN]), async (req: AuthenticatedRequest, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
