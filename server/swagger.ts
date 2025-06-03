import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response, NextFunction } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CLB Sáng Tạo - API Documentation',
      version: '1.0.0',
      description: 'API documentation cho hệ thống quản lý thành viên câu lạc bộ sáng tạo',
      contact: {
        name: 'CLB Sáng Tạo',
        email: 'admin@club.edu.vn',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            isSystem: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            roleId: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Department: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            icon: { type: 'string' },
            color: { type: 'string' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullName: { type: 'string' },
            studentId: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            class: { type: 'string' },
            departmentId: { type: 'integer' },
            position: { type: 'string' },
            memberType: { type: 'string' },
            joinDate: { type: 'string' },
            notes: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                email: { type: 'string' },
                fullName: { type: 'string' },
                role: { $ref: '#/components/schemas/Role' },
              },
            },
          },
        },
        CreateRoleRequest: {
          type: 'object',
          required: ['name', 'displayName', 'permissions'],
          properties: {
            name: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            isSystem: { type: 'boolean', default: false },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['username', 'email', 'fullName', 'password', 'roleId'],
          properties: {
            username: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            password: { type: 'string' },
            roleId: { type: 'integer' },
            isActive: { type: 'boolean', default: true },
          },
        },
        CreateMemberRequest: {
          type: 'object',
          required: ['fullName', 'studentId', 'class', 'departmentId', 'position', 'memberType', 'joinDate'],
          properties: {
            fullName: { type: 'string' },
            studentId: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            class: { type: 'string' },
            departmentId: { type: 'integer' },
            position: { 
              type: 'string',
              enum: ['president', 'vice-president', 'secretary', 'head', 'vice-head', 'member']
            },
            memberType: { 
              type: 'string',
              enum: ['active', 'alumni']
            },
            joinDate: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { 
              type: 'string',
              enum: ['academic', 'creative', 'leadership', 'participation', 'special']
            },
            level: { 
              type: 'string',
              enum: ['bronze', 'silver', 'gold', 'special']
            },
            badgeIcon: { type: 'string' },
            badgeColor: { type: 'string' },
            pointsReward: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateAchievementRequest: {
          type: 'object',
          required: ['title', 'category', 'level', 'pointsReward'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { 
              type: 'string',
              enum: ['academic', 'creative', 'leadership', 'participation', 'special']
            },
            level: { 
              type: 'string',
              enum: ['bronze', 'silver', 'gold', 'special']
            },
            badgeIcon: { type: 'string' },
            badgeColor: { type: 'string', default: '#3B82F6' },
            pointsReward: { type: 'integer', minimum: 0 },
          },
        },
        AwardAchievementRequest: {
          type: 'object',
          required: ['userId', 'achievementId'],
          properties: {
            userId: { type: 'integer' },
            achievementId: { type: 'integer' },
            notes: { type: 'string' },
          },
        },
        UserAchievement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            awardedDate: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            achievement: { $ref: '#/components/schemas/Achievement' },
          },
        },
        BeePointsInfo: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            currentPoints: { type: 'integer' },
            totalEarned: { type: 'integer' },
            totalSpent: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PointTransaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            type: { 
              type: 'string',
              enum: ['earned', 'spent', 'admin_adjustment']
            },
            amount: { type: 'integer' },
            description: { type: 'string' },
            achievementId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    tags: [
      {
        name: 'Public',
        description: '🌐 API công khai - Không cần xác thực',
      },
      {
        name: 'Authentication',
        description: '🔑 Xác thực và phiên đăng nhập',
      },
      {
        name: 'User Access',
        description: '👤 API cho người dùng thông thường - Cần quyền cơ bản',
      },
      {
        name: 'Admin Only',
        description: '⚡ API chỉ dành cho quản trị viên - Cần quyền admin',
      },
      {
        name: 'Super Admin',
        description: '🛡️ API chỉ dành cho Super Admin - Quyền cao nhất',
      },
      {
        name: 'Achievements',
        description: '🏆 Quản lý thành tích và trao thưởng',
      },
      {
        name: 'BeePoints',
        description: '🍯 Hệ thống điểm thưởng BeePoints',
      },
    ],
  },
  apis: ['./server/routes.ts'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Serve the OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Simple API list page without external dependencies
  app.get('/api-docs', (req, res) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CLB Sáng Tạo - API Documentation</title>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 40px; 
      line-height: 1.6; 
      background: #f5f5f5;
    }
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white; 
      padding: 30px; 
      border-radius: 8px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    h2 { color: #0056b3; margin-top: 30px; }
    .endpoint { 
      background: #f8f9fa; 
      padding: 15px; 
      margin: 10px 0; 
      border-radius: 5px; 
      border-left: 4px solid #007bff;
    }
    .method { 
      display: inline-block; 
      padding: 4px 8px; 
      border-radius: 3px; 
      color: white; 
      font-weight: bold; 
      margin-right: 10px;
    }
    .get { background: #28a745; }
    .post { background: #007bff; }
    .put { background: #ffc107; color: #000; }
    .delete { background: #dc3545; }
    .path { font-family: monospace; font-size: 16px; }
    .desc { margin-top: 8px; color: #666; }
    .json-link { 
      display: inline-block; 
      margin-top: 20px; 
      padding: 10px 20px; 
      background: #007bff; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px;
    }
    .json-link:hover { background: #0056b3; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CLB Sáng Tạo - API Documentation</h1>
    
    <h2>🌐 Public APIs</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/public/users</span>
      <div class="desc">Lấy danh sách tất cả users đang hoạt động (không cần token)</div>
    </div>

    <h2>🔐 Authentication</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/auth/check-init</span>
      <div class="desc">Kiểm tra xem hệ thống đã được khởi tạo chưa</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/auth/login</span>
      <div class="desc">Đăng nhập với username và password</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/auth/logout</span>
      <div class="desc">Đăng xuất</div>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/auth/me</span>
      <div class="desc">Lấy thông tin user hiện tại</div>
    </div>

    <h2>👥 Users Management</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/users</span>
      <div class="desc">Lấy danh sách users (cần quyền USER_VIEW)</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/users</span>
      <div class="desc">Tạo user mới (cần quyền USER_CREATE)</div>
    </div>
    <div class="endpoint">
      <span class="method put">PUT</span>
      <span class="path">/api/users/:id</span>
      <div class="desc">Cập nhật thông tin user (cần quyền USER_UPDATE)</div>
    </div>

    <h2>🏆 BeePoints System</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/bee-points/me</span>
      <div class="desc">Lấy BeePoints của user hiện tại</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/bee-points/add</span>
      <div class="desc">Thêm BeePoints cho user (cần quyền BEEPOINTS_MANAGE)</div>
    </div>

    <h2>🎯 Achievements</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/achievements</span>
      <div class="desc">Lấy danh sách thành tích</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/achievements</span>
      <div class="desc">Tạo thành tích mới (cần quyền ACHIEVEMENT_CREATE)</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/achievements/award</span>
      <div class="desc">Trao thành tích cho user - tự động cộng BeePoints (cần quyền ACHIEVEMENT_AWARD)</div>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/achievements/me</span>
      <div class="desc">Lấy danh sách thành tích của user hiện tại</div>
    </div>

    <h2>🏢 Departments</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/departments</span>
      <div class="desc">Lấy danh sách phòng ban</div>
    </div>

    <h2>👥 Members Management</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/members</span>
      <div class="desc">Lấy danh sách thành viên</div>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/members/:id</span>
      <div class="desc">Lấy thông tin chi tiết thành viên</div>
    </div>

    <h2>🔑 API Keys</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/admin/api-keys</span>
      <div class="desc">Lấy danh sách API keys (cần quyền ADMIN)</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/admin/api-keys</span>
      <div class="desc">Tạo API key mới (cần quyền ADMIN)</div>
    </div>
    <div class="endpoint">
      <span class="method put">PUT</span>
      <span class="path">/api/admin/api-keys/:id</span>
      <div class="desc">Cập nhật quyền API key (cần quyền ADMIN)</div>
    </div>

    <h2>🌐 External APIs</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/external/members</span>
      <div class="desc">API cho ứng dụng bên ngoài - Lấy danh sách thành viên (cần API key)</div>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/external/achievements</span>
      <div class="desc">API cho ứng dụng bên ngoài - Lấy danh sách thành tích (cần API key)</div>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/external/stats</span>
      <div class="desc">API cho ứng dụng bên ngoài - Lấy thống kê (cần API key)</div>
    </div>

    <h2>📊 Statistics</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/stats</span>
      <div class="desc">Lấy thống kê tổng quan hệ thống</div>
    </div>

    <h2>👑 Roles</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/roles</span>
      <div class="desc">Lấy danh sách vai trò trong hệ thống</div>
    </div>

    <h2>📚 Academic Years (Khóa học)</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/academic-years</span>
      <div class="desc">Lấy danh sách khóa học (từ tháng 11 đến tháng 11 năm sau)</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/academic-years</span>
      <div class="desc">Tạo khóa học mới (cần quyền SYSTEM_ADMIN)</div>
    </div>

    <h2>🎖️ Positions (Chức vụ)</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/positions</span>
      <div class="desc">Lấy danh sách chức vụ được chuẩn hóa</div>
    </div>

    <h2>🏛️ Divisions (Ban)</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/divisions</span>
      <div class="desc">Lấy danh sách các ban hoạt động</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/divisions</span>
      <div class="desc">Tạo ban mới (cần quyền SYSTEM_ADMIN)</div>
    </div>

    <h2>📊 Dynamic Statistics</h2>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/dynamic-stats</span>
      <div class="desc">Lấy danh sách thống kê động</div>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/api/dynamic-stats</span>
      <div class="desc">Tạo thống kê động mới (cần quyền SYSTEM_ADMIN)</div>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/enhanced-stats</span>
      <div class="desc">Lấy thống kê nâng cao theo khóa học và chức vụ</div>
    </div>

    <a href="/api-docs.json" class="json-link">📄 View OpenAPI JSON Spec</a>
  </div>
</body>
</html>`;
    res.send(html);
  });
}