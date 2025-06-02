import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

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
    ],
  },
  apis: ['./server/routes.ts'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CLB Sáng Tạo API',
  }));
  
  // Serve the OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}