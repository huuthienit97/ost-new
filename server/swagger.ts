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

## Nhóm API theo chức năng:
1. **Authentication** - Xác thực người dùng
2. **Users** - Quản lý người dùng hệ thống  
3. **Members** - Quản lý thành viên CLB
4. **Departments** - Quản lý ban trong CLB
5. **Positions** - Quản lý chức vụ chuẩn hóa
6. **Divisions** - Quản lý ban phụ trách
7. **Academic Years** - Quản lý khóa học (11/năm này - 11/năm sau)
8. **Achievements** - Hệ thống thành tích
9. **BeePoints** - Hệ thống điểm thưởng
10. **Statistics** - Thống kê tổng quan
11. **API Keys** - Quản lý API keys cho ứng dụng thứ 3
12. **External API** - API dành cho ứng dụng bên ngoài

## Phân quyền:
- 🟢 **PUBLIC** - Không cần xác thực
- 🔵 **USER** - Cần đăng nhập
- 🟡 **ADMIN** - Cần quyền quản trị viên
- 🔴 **SUPER_ADMIN** - Cần quyền super admin

## Xác thực:
- **Bearer Token**: JWT từ /api/auth/login
- **API Key**: Header x-api-key cho external API
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
      responses: {
        Unauthorized: {
          description: 'Không có quyền truy cập',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Token không hợp lệ' }
                }
              }
            }
          }
        },
        Forbidden: {
          description: 'Không đủ quyền',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Không đủ quyền thực hiện' }
                }
              }
            }
          }
        },
        BadRequest: {
          description: 'Dữ liệu không hợp lệ',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Validation failed' },
                  errors: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        NotFound: {
          description: 'Không tìm thấy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Không tìm thấy' }
                }
              }
            }
          }
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
            department: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                icon: { type: 'string' },
                color: { type: 'string' }
              }
            },
            position: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                displayName: { type: 'string' },
                level: { type: 'integer' }
              }
            },
            user: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                fullName: { type: 'string' },
                email: { type: 'string' }
              }
            }
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
        Stats: {
          type: 'object',
          properties: {
            totalMembers: { type: 'integer', example: 25 },
            activeMembers: { type: 'integer', example: 20 },
            alumniMembers: { type: 'integer', example: 5 },
            totalDepartments: { type: 'integer', example: 4 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Thông báo lỗi' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    tags: [
      { name: '🔐 Authentication', description: 'Xác thực và đăng nhập' },
      { name: '👥 Users', description: 'Quản lý người dùng hệ thống (🟡 ADMIN)' },
      { name: '🎓 Members', description: 'Quản lý thành viên CLB' },
      { name: '🏢 Departments', description: 'Quản lý ban trong CLB' },
      { name: '👑 Positions', description: 'Quản lý chức vụ chuẩn hóa (🔴 SUPER_ADMIN)' },
      { name: '📋 Divisions', description: 'Quản lý ban phụ trách (🔴 SUPER_ADMIN)' },
      { name: '📅 Academic Years', description: 'Quản lý khóa học (🔴 SUPER_ADMIN)' },
      { name: '🏆 Achievements', description: 'Hệ thống thành tích (🟡 ADMIN trao thưởng)' },
      { name: '🍯 BeePoints', description: 'Hệ thống điểm thưởng' },
      { name: '📊 Statistics', description: 'Thống kê tổng quan' },
      { name: '🔑 API Keys', description: 'Quản lý API keys (🟡 ADMIN)' },
      { name: '🌐 External API', description: 'API cho ứng dụng thứ 3 (cần API key)' },
    ],
  },
  apis: ['./server/routes.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'CLB Sáng Tạo - API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #1f2937; font-size: 24px; }
      .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
      .swagger-ui .opblock.opblock-post { border-color: #059669; background: rgba(5, 150, 105, 0.1); }
      .swagger-ui .opblock.opblock-get { border-color: #0284c7; background: rgba(2, 132, 199, 0.1); }
      .swagger-ui .opblock.opblock-put { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
      .swagger-ui .opblock.opblock-delete { border-color: #dc2626; background: rgba(220, 38, 38, 0.1); }
      .swagger-ui .opblock-tag { font-size: 16px; font-weight: 600; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
      filter: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
    },
  }));

  // JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Postman collection
  app.get('/postman-collection.json', (req, res) => {
    const collection = {
      info: {
        name: 'CLB Sáng Tạo API',
        description: 'Complete API collection for club management system',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        { key: 'baseUrl', value: 'http://localhost:5000' },
        { key: 'authToken', value: '' },
        { key: 'apiKey', value: '' },
      ],
      auth: {
        type: 'bearer',
        bearer: [{ key: 'token', value: '{{authToken}}', type: 'string' }],
      },
      item: [
        {
          name: '🔐 Authentication',
          item: [
            {
              name: 'Login',
              request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({ username: 'admin', password: 'password123' }),
                },
                url: '{{baseUrl}}/api/auth/login',
              },
            },
            {
              name: 'Get Current User',
              request: {
                method: 'GET',
                url: '{{baseUrl}}/api/auth/me',
              },
            },
            {
              name: 'Logout',
              request: {
                method: 'POST',
                url: '{{baseUrl}}/api/auth/logout',
              },
            },
          ],
        },
        {
          name: '🎓 Members',
          item: [
            {
              name: 'Get All Members',
              request: {
                method: 'GET',
                url: {
                  raw: '{{baseUrl}}/api/members',
                  query: [
                    { key: 'search', value: '', disabled: true },
                    { key: 'type', value: '', disabled: true },
                    { key: 'department', value: '', disabled: true },
                  ],
                },
              },
            },
            {
              name: 'Create Member',
              request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
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
                url: '{{baseUrl}}/api/members',
              },
            },
            {
              name: 'Update Member',
              request: {
                method: 'PUT',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    fullName: 'Nguyễn Văn A Updated',
                    phone: '0987654322',
                  }),
                },
                url: '{{baseUrl}}/api/members/1',
              },
            },
            {
              name: 'Delete Member',
              request: {
                method: 'DELETE',
                url: '{{baseUrl}}/api/members/1',
              },
            },
          ],
        },
        {
          name: '🌐 External API (API Key Required)',
          item: [
            {
              name: 'External Stats',
              request: {
                method: 'GET',
                header: [{ key: 'x-api-key', value: '{{apiKey}}' }],
                url: '{{baseUrl}}/api/external/stats',
              },
            },
            {
              name: 'External Members',
              request: {
                method: 'GET',
                header: [{ key: 'x-api-key', value: '{{apiKey}}' }],
                url: '{{baseUrl}}/api/external/members',
              },
            },
          ],
        },
      ],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="CLB-SangTao-API.postman_collection.json"');
    res.send(collection);
  });

  // Redirect
  app.get('/docs', (req, res) => res.redirect('/api-docs'));
}