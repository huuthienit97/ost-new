import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createMemberSchema, insertMemberSchema, createUserSchema, createRoleSchema, PERMISSIONS } from "@shared/schema";
import { authenticate, authorize, hashPassword, verifyPassword, generateToken, AuthenticatedRequest } from "./auth";
import { z } from "zod";

/**
 * @swagger
 * /api/auth/init:
 *   post:
 *     tags: [Authentication]
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
 *     tags: [Roles]
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
 *     tags: [Roles]
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
 *     tags: [Users]
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
 *     tags: [Users]
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
 *     tags: [Departments]
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
 *     tags: [Members]
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
 *     tags: [Members]
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
 *     tags: [Members]
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
 *     tags: [Members]
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
 *     tags: [Members]
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
 *     tags: [Statistics]
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
  // Check if system needs initialization
  app.get("/api/auth/check-init", async (req, res) => {
    try {
      const users = await storage.getUsers();
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
      const users = await storage.getUsers();
      if (users.length > 0) {
        return res.status(400).json({ message: "Hệ thống đã được khởi tạo" });
      }

      // Create default admin user
      const passwordHash = await hashPassword("admin123");
      const adminUser = await storage.createUser({
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

      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      const userWithRole = await storage.getUserWithRole(user.id);
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
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi đăng nhập" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const userWithRole = await storage.getUserWithRole(req.user!.id);
      if (!userWithRole) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      res.json({
        user: {
          id: userWithRole.id,
          username: userWithRole.username,
          email: userWithRole.email,
          fullName: userWithRole.fullName,
          role: userWithRole.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi lấy thông tin người dùng" });
    }
  });

  // Role management routes
  app.get("/api/roles", authenticate, authorize(PERMISSIONS.ROLE_VIEW), async (req, res) => {
    try {
      const roles = await storage.getRoles();
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

      const role = await storage.createRole(validationResult.data);
      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ message: "Lỗi tạo vai trò" });
    }
  });

  // User management routes
  app.get("/api/users", authenticate, authorize(PERMISSIONS.USER_VIEW), async (req, res) => {
    try {
      const users = await storage.getUsersWithRoles();
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
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      // Remove password hash from response
      res.status(201).json({
        ...user,
        passwordHash: undefined,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi tạo người dùng" });
    }
  });

  // Get all departments
  app.get("/api/departments", authenticate, authorize(PERMISSIONS.DEPARTMENT_VIEW), async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Get all members with department info
  app.get("/api/members", authenticate, authorize(PERMISSIONS.MEMBER_VIEW), async (req: AuthenticatedRequest, res) => {
    try {
      const { type, department, position, search } = req.query;
      
      let members = await storage.getMembersWithDepartments();
      
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
          member.studentId.toLowerCase().includes(searchLower) ||
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
      
      const member = await storage.getMemberWithDepartment(id);
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
      
      // Check if studentId already exists
      const existingMembers = await storage.getMembers();
      if (existingMembers.some(m => m.studentId === memberData.studentId)) {
        return res.status(400).json({ message: "Mã học sinh đã tồn tại" });
      }
      
      // Validate department exists
      const department = await storage.getDepartment(memberData.departmentId);
      if (!department) {
        return res.status(400).json({ message: "Ban không tồn tại" });
      }

      const newMember = await storage.createMember(memberData);
      const memberWithDepartment = await storage.getMemberWithDepartment(newMember.id);
      
      res.status(201).json(memberWithDepartment);
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
        const existingMembers = await storage.getMembers();
        if (existingMembers.some(m => m.studentId === updateData.studentId && m.id !== id)) {
          return res.status(400).json({ message: "Mã học sinh đã tồn tại" });
        }
      }
      
      // If updating department, validate it exists
      if (updateData.departmentId) {
        const department = await storage.getDepartment(updateData.departmentId);
        if (!department) {
          return res.status(400).json({ message: "Ban không tồn tại" });
        }
      }

      const updatedMember = await storage.updateMember(id, updateData);
      if (!updatedMember) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const memberWithDepartment = await storage.getMemberWithDepartment(updatedMember.id);
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

      const deleted = await storage.deleteMember(id);
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
      const allMembers = await storage.getMembers();
      const departments = await storage.getDepartments();
      
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

  const httpServer = createServer(app);
  return httpServer;
}
