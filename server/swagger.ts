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

  // Simple HTML page for API documentation
  app.get('/api-docs', (req, res) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CLB Sáng Tạo - API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar { display: none }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
    res.send(html);
  });
}