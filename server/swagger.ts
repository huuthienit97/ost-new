import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CLB Sáng Tạo - API Documentation',
      version: '2.0.0',
      description: `
# Hệ thống quản lý câu lạc bộ sáng tạo

API đầy đủ cho việc quản lý thành viên, vai trò, khóa học, ban và thống kê.

## Xác thực
- **Bearer Token**: Sử dụng JWT token cho xác thực người dùng
- **API Key**: Sử dụng x-api-key header cho ứng dụng bên thứ 3

## Quyền hạn
- **SYSTEM_ADMIN**: Toàn quyền quản lý hệ thống
- **MEMBER_VIEW/CREATE/EDIT/DELETE**: Quản lý thành viên
- **DEPARTMENT_VIEW/CREATE/EDIT/DELETE**: Quản lý ban
- **ROLE_VIEW/CREATE/EDIT/DELETE**: Quản lý vai trò

## Lưu ý
- Tất cả ngày tháng sử dụng định dạng ISO 8601
- Khóa học chạy từ tháng 11 năm này đến tháng 11 năm sau
      `,
      contact: {
        name: 'CLB Sáng Tạo',
        email: 'admin@clbsangtao.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
      {
        url: 'https://production-domain.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token từ /api/auth/login',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key cho ứng dụng thứ 3',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', example: 'admin@example.com' },
            fullName: { type: 'string', example: 'Nguyễn Văn A' },
            roleId: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            mustChangePassword: { type: 'boolean', example: false },
            avatarUrl: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            fullName: { type: 'string', example: 'Trần Thị B' },
            studentId: { type: 'string', example: 'HS001' },
            email: { type: 'string', example: 'student@example.com' },
            phone: { type: 'string', example: '0987654321' },
            class: { type: 'string', example: '12A1' },
            departmentId: { type: 'integer', example: 1 },
            positionId: { type: 'integer', example: 1 },
            divisionId: { type: 'integer', nullable: true },
            academicYearId: { type: 'integer', example: 1 },
            memberType: { type: 'string', enum: ['active', 'alumni'], example: 'active' },
            joinDate: { type: 'string', format: 'date', example: '2024-11-01' },
            notes: { type: 'string', nullable: true },
            userId: { type: 'integer', nullable: true },
            isActive: { type: 'boolean', example: true },
          },
        },
        Department: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Ban Thiết Kế' },
            icon: { type: 'string', example: 'palette' },
            color: { type: 'string', example: '#3B82F6' },
          },
        },
        Position: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'president' },
            displayName: { type: 'string', example: 'Chủ nhiệm' },
            level: { type: 'integer', example: 100 },
            description: { type: 'string', nullable: true },
            color: { type: 'string', example: '#EF4444' },
            isActive: { type: 'boolean', example: true },
          },
        },
        Division: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Ban Truyền thông' },
            description: { type: 'string', nullable: true },
            color: { type: 'string', example: '#10B981' },
            icon: { type: 'string', example: 'Users' },
            isActive: { type: 'boolean', example: true },
          },
        },
        AcademicYear: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Khóa 2024-2025' },
            startDate: { type: 'string', format: 'date-time', example: '2024-11-01T00:00:00.000Z' },
            endDate: { type: 'string', format: 'date-time', example: '2025-11-01T00:00:00.000Z' },
            isActive: { type: 'boolean', example: true },
            description: { type: 'string', nullable: true },
          },
        },
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Thành viên xuất sắc' },
            description: { type: 'string', example: 'Dành cho thành viên có đóng góp tích cực' },
            category: { type: 'string', enum: ['academic', 'creative', 'leadership', 'participation', 'special'] },
            level: { type: 'string', enum: ['bronze', 'silver', 'gold', 'special'] },
            badgeIcon: { type: 'string', example: 'Trophy' },
            badgeColor: { type: 'string', example: '#FFD700' },
            pointsReward: { type: 'integer', example: 50 },
          },
        },
        BeePoints: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            currentPoints: { type: 'integer', example: 150 },
            totalEarned: { type: 'integer', example: 200 },
            totalSpent: { type: 'integer', example: 50 },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Mobile App API' },
            permissions: { type: 'array', items: { type: 'string' }, example: ['members:view', 'stats:view'] },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            lastUsed: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'password123' },
          },
        },
        CreateMemberRequest: {
          type: 'object',
          required: ['fullName', 'class', 'departmentId', 'positionId', 'academicYearId', 'memberType', 'joinDate'],
          properties: {
            fullName: { type: 'string', example: 'Nguyễn Văn A' },
            studentId: { type: 'string', example: 'HS001' },
            email: { type: 'string', example: 'student@example.com' },
            phone: { type: 'string', example: '0987654321' },
            class: { type: 'string', example: '12A1' },
            departmentId: { type: 'integer', example: 1 },
            positionId: { type: 'integer', example: 1 },
            divisionId: { type: 'integer', example: 1 },
            academicYearId: { type: 'integer', example: 1 },
            memberType: { type: 'string', enum: ['active', 'alumni'], example: 'active' },
            joinDate: { type: 'string', format: 'date', example: '2024-11-01' },
            notes: { type: 'string', example: 'Ghi chú thêm' },
          },
        },
        CreatePositionRequest: {
          type: 'object',
          required: ['name', 'displayName', 'level'],
          properties: {
            name: { type: 'string', example: 'vice-president' },
            displayName: { type: 'string', example: 'Phó chủ nhiệm' },
            level: { type: 'integer', example: 90 },
            description: { type: 'string', example: 'Phụ trách hỗ trợ chủ nhiệm' },
            color: { type: 'string', example: '#10B981' },
          },
        },
        CreateDivisionRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Ban Sự kiện' },
            description: { type: 'string', example: 'Phụ trách tổ chức các sự kiện' },
            color: { type: 'string', example: '#8B5CF6' },
            icon: { type: 'string', example: 'Calendar' },
          },
        },
        CreateAcademicYearRequest: {
          type: 'object',
          required: ['name', 'startDate', 'endDate'],
          properties: {
            name: { type: 'string', example: 'Khóa 2025-2026' },
            startDate: { type: 'string', format: 'date', example: '2025-11-01' },
            endDate: { type: 'string', format: 'date', example: '2026-11-01' },
            description: { type: 'string', example: 'Khóa học năm 2025-2026' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Thông báo lỗi' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Xác thực và phân quyền' },
      { name: 'Users', description: 'Quản lý người dùng' },
      { name: 'Members', description: 'Quản lý thành viên' },
      { name: 'Departments', description: 'Quản lý ban' },
      { name: 'Positions', description: 'Quản lý chức vụ' },
      { name: 'Divisions', description: 'Quản lý ban (mở rộng)' },
      { name: 'Academic Years', description: 'Quản lý khóa học' },
      { name: 'Achievements', description: 'Quản lý thành tích' },
      { name: 'BeePoints', description: 'Hệ thống điểm thưởng' },
      { name: 'Statistics', description: 'Thống kê hệ thống' },
      { name: 'API Keys', description: 'Quản lý API keys' },
      { name: 'External API', description: 'API cho ứng dụng thứ 3' },
    ],
  },
  apis: ['./server/routes.ts'],
};

const specs = swaggerJsdoc(options);

const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 20px 0; }
  .swagger-ui .info .title { color: #1f2937; font-size: 28px; }
  .swagger-ui .info .description { font-size: 14px; }
  .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
  .swagger-ui .opblock.opblock-post { border-color: #059669; background: rgba(5, 150, 105, 0.1); }
  .swagger-ui .opblock.opblock-get { border-color: #0284c7; background: rgba(2, 132, 199, 0.1); }
  .swagger-ui .opblock.opblock-put { border-color: #dc2626; background: rgba(220, 38, 38, 0.1); }
  .swagger-ui .opblock.opblock-delete { border-color: #dc2626; background: rgba(220, 38, 38, 0.1); }
  .swagger-ui .parameters-col_description { width: 40%; }
  .swagger-ui .parameter__name { width: 20%; }
  .swagger-ui .parameter__type { width: 15%; }
  .swagger-ui .parameter__deprecated { width: 10%; }
  .swagger-ui .parameter__in { width: 15%; }
`;

export function setupSwagger(app: Express) {
  // Serve swagger docs with enhanced UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'CLB Sáng Tạo - API Documentation',
    customCss,
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
      filter: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      validatorUrl: null,
    },
  }));

  // Serve JSON spec for Postman import
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(specs);
  });

  // Postman collection export
  app.get('/postman-collection.json', (req, res) => {
    const postmanCollection = {
      info: {
        name: 'CLB Sáng Tạo API',
        description: 'API collection cho hệ thống quản lý câu lạc bộ sáng tạo',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{authToken}}',
            type: 'string',
          },
        ],
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:5000',
          type: 'string',
        },
        {
          key: 'authToken',
          value: '',
          type: 'string',
        },
        {
          key: 'apiKey',
          value: '',
          type: 'string',
        },
      ],
      item: [
        {
          name: 'Authentication',
          item: [
            {
              name: 'Login',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    username: 'admin',
                    password: 'password123',
                  }),
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/login',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'login'],
                },
              },
            },
            {
              name: 'Get User Info',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/auth/me',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'me'],
                },
              },
            },
          ],
        },
        {
          name: 'Members',
          item: [
            {
              name: 'Get All Members',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/members',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'members'],
                  query: [
                    {
                      key: 'search',
                      value: '',
                      disabled: true,
                    },
                    {
                      key: 'type',
                      value: '',
                      disabled: true,
                    },
                    {
                      key: 'department',
                      value: '',
                      disabled: true,
                    },
                  ],
                },
              },
            },
            {
              name: 'Create Member',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                  },
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    fullName: 'Nguyễn Văn A',
                    studentId: 'HS001',
                    email: 'student@example.com',
                    phone: '0987654321',
                    class: '12A1',
                    departmentId: 1,
                    positionId: 1,
                    academicYearId: 1,
                    memberType: 'active',
                    joinDate: '2024-11-01',
                  }),
                },
                url: {
                  raw: '{{baseUrl}}/api/members',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'members'],
                },
              },
            },
          ],
        },
        {
          name: 'External API (with API Key)',
          item: [
            {
              name: 'Get Stats',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'x-api-key',
                    value: '{{apiKey}}',
                  },
                ],
                url: {
                  raw: '{{baseUrl}}/api/external/stats',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'external', 'stats'],
                },
              },
            },
          ],
        },
      ],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="CLB-SangTao-API.postman_collection.json"');
    res.send(postmanCollection);
  });

  // Landing page redirect
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });
}