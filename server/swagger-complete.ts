import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CLB Sáng Tạo - API Documentation',
      version: '2.1.0',
      description: `
# Hệ thống quản lý câu lạc bộ sáng tạo

## Phân quyền rõ ràng:
- 🟢 **PUBLIC** - Không cần xác thực
- 🔵 **USER** - Cần đăng nhập
- 🟡 **ADMIN** - Cần quyền admin để tạo/sửa/xóa
- 🔴 **SUPER_ADMIN** - Cần quyền super admin để quản lý positions, divisions, academic years

## Các nhóm API:
1. Authentication - Xác thực
2. Users - Quản lý người dùng (🟡 ADMIN)
3. Members - Quản lý thành viên CLB
4. Departments - Quản lý ban
5. Positions - Quản lý chức vụ (🔴 SUPER_ADMIN)
6. Divisions - Quản lý ban phụ trách (🔴 SUPER_ADMIN)
7. Academic Years - Quản lý khóa học (🔴 SUPER_ADMIN)
8. Achievements - Hệ thống thành tích
9. BeePoints - Hệ thống điểm thưởng
10. Statistics - Thống kê
11. API Keys - Quản lý API keys (🟡 ADMIN)
12. External API - API cho ứng dụng thứ 3
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
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
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
            position: { type: 'string', nullable: true, example: 'Chủ nhiệm' },
            positionLevel: { type: 'integer', nullable: true, example: 100 },
            departmentName: { type: 'string', nullable: true, example: 'Ban Thiết kế' },
            divisionName: { type: 'string', nullable: true, example: 'Ban Truyền thông' },
            memberType: { type: 'string', nullable: true, example: 'active' },
            academicYear: { type: 'string', nullable: true, example: 'Khóa 2024-2025' },
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
              nullable: true,
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                icon: { type: 'string' },
                color: { type: 'string' }
              }
            },
            position: {
              type: 'object',
              nullable: true,
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
      },
    },
    tags: [
      { name: '🟢 Public', description: 'API công khai - không cần xác thực' },
      { name: '🔐 Authentication', description: 'Xác thực và đăng nhập' },
      { name: '👥 Users', description: 'Quản lý người dùng hệ thống (🟡 ADMIN required)' },
      { name: '🎓 Members', description: 'Quản lý thành viên CLB' },
      { name: '🏢 Departments', description: 'Quản lý ban trong CLB' },
      { name: '👑 Positions', description: 'Quản lý chức vụ chuẩn hóa (🔴 SUPER_ADMIN required)' },
      { name: '📋 Divisions', description: 'Quản lý ban phụ trách (🔴 SUPER_ADMIN required)' },
      { name: '📅 Academic Years', description: 'Quản lý khóa học (🔴 SUPER_ADMIN required)' },
      { name: '🏆 Achievements', description: 'Hệ thống thành tích' },
      { name: '🍯 BeePoints', description: 'Hệ thống điểm thưởng' },
      { name: '📊 Statistics', description: 'Thống kê tổng quan' },
      { name: '🔑 API Keys', description: 'Quản lý API keys (🟡 ADMIN required)' },
      { name: '🌐 External API', description: 'API cho ứng dụng thứ 3 (cần API key)' },
    ],
  },
  apis: ['./server/routes.ts', './server/swagger-complete.ts'],
};

// Define complete API paths with proper documentation
const apiPaths = {
  '/api/public/users': {
    get: {
      summary: 'Lấy danh sách người dùng với thông tin chức vụ và ban',
      tags: ['🟢 Public'],
      responses: {
        200: {
          description: 'Danh sách người dùng với đầy đủ thông tin',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        500: { $ref: '#/components/responses/BadRequest' }
      }
    }
  },
  '/api/auth/login': {
    post: {
      summary: 'Đăng nhập hệ thống',
      tags: ['🔐 Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['username', 'password'],
              properties: {
                username: { type: 'string', example: 'admin' },
                password: { type: 'string', example: 'password123' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Đăng nhập thành công',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  user: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/api/auth/me': {
    get: {
      summary: 'Lấy thông tin người dùng hiện tại',
      tags: ['🔐 Authentication'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Thông tin người dùng',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' }
      }
    }
  },
  '/api/positions': {
    get: {
      summary: 'Lấy danh sách chức vụ',
      tags: ['👑 Positions'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Danh sách chức vụ',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Position' }
              }
            }
          }
        }
      }
    },
    post: {
      summary: 'Tạo chức vụ mới (🔴 SUPER_ADMIN)',
      tags: ['👑 Positions'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'displayName', 'level'],
              properties: {
                name: { type: 'string', example: 'vice-president' },
                displayName: { type: 'string', example: 'Phó chủ nhiệm' },
                level: { type: 'integer', example: 90 },
                description: { type: 'string', example: 'Phụ trách hỗ trợ chủ nhiệm' },
                color: { type: 'string', example: '#10B981' }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Chức vụ được tạo thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Position' }
            }
          }
        },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/positions/{id}': {
    put: {
      summary: 'Cập nhật chức vụ (🔴 SUPER_ADMIN)',
      tags: ['👑 Positions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'ID chức vụ'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                displayName: { type: 'string' },
                level: { type: 'integer' },
                description: { type: 'string' },
                color: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Chức vụ được cập nhật',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Position' }
            }
          }
        },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      summary: 'Xóa chức vụ (🔴 SUPER_ADMIN)',
      tags: ['👑 Positions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'ID chức vụ'
        }
      ],
      responses: {
        200: {
          description: 'Chức vụ được xóa',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Đã xóa chức vụ' }
                }
              }
            }
          }
        },
        400: {
          description: 'Không thể xóa chức vụ có thành viên',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/academic-years': {
    get: {
      summary: 'Lấy danh sách khóa học',
      tags: ['📅 Academic Years'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Danh sách khóa học',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AcademicYear' }
              }
            }
          }
        }
      }
    },
    post: {
      summary: 'Tạo khóa học mới (🔴 SUPER_ADMIN)',
      tags: ['📅 Academic Years'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'startDate', 'endDate'],
              properties: {
                name: { type: 'string', example: 'Khóa 2025-2026' },
                startDate: { type: 'string', format: 'date', example: '2025-11-01' },
                endDate: { type: 'string', format: 'date', example: '2026-11-01' },
                description: { type: 'string', example: 'Khóa học năm 2025-2026' },
                isActive: { type: 'boolean', example: false }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Khóa học được tạo thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AcademicYear' }
            }
          }
        },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  },
  '/api/academic-years/{id}': {
    put: {
      summary: 'Cập nhật khóa học (🔴 SUPER_ADMIN)',
      tags: ['📅 Academic Years'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'ID khóa học'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Khóa học được cập nhật',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AcademicYear' }
            }
          }
        },
        404: { $ref: '#/components/responses/NotFound' }
      }
    },
    delete: {
      summary: 'Xóa khóa học (🔴 SUPER_ADMIN)',
      tags: ['📅 Academic Years'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'ID khóa học'
        }
      ],
      responses: {
        200: {
          description: 'Khóa học được xóa',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Đã xóa khóa học' }
                }
              }
            }
          }
        },
        400: {
          description: 'Không thể xóa khóa học có thành viên',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/members': {
    get: {
      summary: 'Lấy danh sách thành viên',
      tags: ['🎓 Members'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Tìm kiếm theo tên, mã học sinh, lớp'
        },
        {
          in: 'query',
          name: 'type',
          schema: { type: 'string', enum: ['active', 'alumni'] },
          description: 'Loại thành viên'
        },
        {
          in: 'query',
          name: 'department',
          schema: { type: 'integer' },
          description: 'ID phòng ban'
        },
        {
          in: 'query',
          name: 'position',
          schema: { type: 'integer' },
          description: 'ID chức vụ'
        }
      ],
      responses: {
        200: {
          description: 'Danh sách thành viên với thông tin đầy đủ',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Member' }
              }
            }
          }
        }
      }
    },
    post: {
      summary: 'Tạo thành viên mới (🟡 ADMIN)',
      tags: ['🎓 Members'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
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
                notes: { type: 'string', example: 'Ghi chú thêm' }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Thành viên được tạo thành công',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Member' }
            }
          }
        },
        403: { $ref: '#/components/responses/Forbidden' }
      }
    }
  }
};

// Merge paths into options
options.definition.paths = apiPaths;

const specs = swaggerJsdoc(options);

export function setupCompleteSwagger(app: Express) {
  // Serve swagger docs with enhanced UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'CLB Sáng Tạo - API Documentation (Complete)',
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
}