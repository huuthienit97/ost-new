import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

export function setupSwagger(app: Express) {
  // Dynamic Swagger configuration that detects production URL
  app.get('/api-docs', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const serverUrl = `${protocol}://${host}`;
    
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'CLB Sáng Tạo - API Documentation',
          version: '2.1.0',
          description: `
# Hệ thống quản lý câu lạc bộ sáng tạo

## Phân quyền:
- 🟢 **PUBLIC** - Không cần xác thực
- 🔵 **USER** - Cần đăng nhập
- 🟡 **ADMIN** - Cần quyền admin
- 🔴 **SUPER_ADMIN** - Cần quyền super admin

## Hướng dẫn sử dụng:
1. Đăng nhập tại /api/auth/login để lấy JWT token
2. Click "Authorize" và nhập: Bearer <your-token>
3. Test các API theo nhóm chức năng
          `,
          contact: {
            name: 'CLB Sáng Tạo',
            email: 'admin@clbsangtao.com'
          },
        },
        servers: [
          {
            url: serverUrl,
            description: 'Current Server'
          }
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
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            Forbidden: {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            BadRequest: {
              description: 'Bad Request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            NotFound: {
              description: 'Not Found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
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
            LoginRequest: {
              type: 'object',
              required: ['username', 'password'],
              properties: {
                username: { 
                  type: 'string', 
                  example: 'admin',
                  description: 'Tên đăng nhập'
                },
                password: { 
                  type: 'string', 
                  example: 'password123',
                  description: 'Mật khẩu'
                },
              },
            },
            LoginResponse: {
              type: 'object',
              properties: {
                token: { 
                  type: 'string', 
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  description: 'JWT token để xác thực'
                },
                user: { $ref: '#/components/schemas/User' }
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
                position: { type: 'string', nullable: true, example: 'Chủ nhiệm' },
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
                notes: { type: 'string', example: 'Ghi chú thêm' }
              }
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
            CreatePositionRequest: {
              type: 'object',
              required: ['name', 'displayName', 'level'],
              properties: {
                name: { type: 'string', example: 'vice-president' },
                displayName: { type: 'string', example: 'Phó chủ nhiệm' },
                level: { type: 'integer', example: 90 },
                description: { type: 'string', example: 'Phụ trách hỗ trợ chủ nhiệm' },
                color: { type: 'string', example: '#10B981' }
              }
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
            CreateDivisionRequest: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Ban Sự kiện' },
                description: { type: 'string', example: 'Phụ trách tổ chức các sự kiện' },
                color: { type: 'string', example: '#8B5CF6' },
                icon: { type: 'string', example: 'Calendar' }
              }
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
            CreateAcademicYearRequest: {
              type: 'object',
              required: ['name', 'startDate', 'endDate'],
              properties: {
                name: { type: 'string', example: 'Khóa 2025-2026' },
                startDate: { type: 'string', format: 'date', example: '2025-11-01' },
                endDate: { type: 'string', format: 'date', example: '2026-11-01' },
                description: { type: 'string', example: 'Khóa học năm 2025-2026' },
                isActive: { type: 'boolean', example: false }
              }
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
        paths: {
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
          '/api/auth/check-init': {
            get: {
              summary: 'Kiểm tra hệ thống có cần khởi tạo không',
              tags: ['🔐 Authentication'],
              responses: {
                200: {
                  description: 'Trạng thái khởi tạo hệ thống',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          needsInit: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
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
                    schema: { $ref: '#/components/schemas/LoginRequest' },
                    example: {
                      username: 'admin',
                      password: 'password123'
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'Đăng nhập thành công',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/LoginResponse' }
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
          '/api/auth/logout': {
            post: {
              summary: 'Đăng xuất',
              tags: ['🔐 Authentication'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Đăng xuất thành công',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Đăng xuất thành công' }
                        }
                      }
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
                    schema: { $ref: '#/components/schemas/CreateMemberRequest' }
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
          },
          '/api/members/{id}': {
            get: {
              summary: 'Lấy thông tin thành viên',
              tags: ['🎓 Members'],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  schema: { type: 'integer' },
                  description: 'ID thành viên'
                }
              ],
              responses: {
                200: {
                  description: 'Thông tin thành viên',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Member' }
                    }
                  }
                },
                404: { $ref: '#/components/responses/NotFound' }
              }
            },
            put: {
              summary: 'Cập nhật thông tin thành viên (🟡 ADMIN)',
              tags: ['🎓 Members'],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  schema: { type: 'integer' },
                  description: 'ID thành viên'
                }
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        fullName: { type: 'string' },
                        phone: { type: 'string' },
                        class: { type: 'string' },
                        departmentId: { type: 'integer' },
                        positionId: { type: 'integer' },
                        notes: { type: 'string' }
                      }
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'Thành viên được cập nhật',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Member' }
                    }
                  }
                },
                404: { $ref: '#/components/responses/NotFound' }
              }
            },
            delete: {
              summary: 'Xóa thành viên (🟡 ADMIN)',
              tags: ['🎓 Members'],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  schema: { type: 'integer' },
                  description: 'ID thành viên'
                }
              ],
              responses: {
                200: {
                  description: 'Thành viên được xóa',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Đã xóa thành viên' }
                        }
                      }
                    }
                  }
                },
                404: { $ref: '#/components/responses/NotFound' }
              }
            }
          },
          '/api/departments': {
            get: {
              summary: 'Lấy danh sách ban',
              tags: ['🏢 Departments'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Danh sách ban',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Department' }
                      }
                    }
                  }
                }
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
                    schema: { $ref: '#/components/schemas/CreatePositionRequest' }
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
          '/api/divisions': {
            get: {
              summary: 'Lấy danh sách ban phụ trách',
              tags: ['📋 Divisions'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Danh sách ban phụ trách',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Division' }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: 'Tạo ban phụ trách mới (🔴 SUPER_ADMIN)',
              tags: ['📋 Divisions'],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/CreateDivisionRequest' }
                  }
                }
              },
              responses: {
                201: {
                  description: 'Ban phụ trách được tạo thành công',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Division' }
                    }
                  }
                },
                403: { $ref: '#/components/responses/Forbidden' }
              }
            }
          },
          '/api/divisions/{id}': {
            put: {
              summary: 'Cập nhật ban phụ trách (🔴 SUPER_ADMIN)',
              tags: ['📋 Divisions'],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  schema: { type: 'integer' },
                  description: 'ID ban phụ trách'
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
                        color: { type: 'string' },
                        icon: { type: 'string' }
                      }
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'Ban phụ trách được cập nhật',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Division' }
                    }
                  }
                },
                404: { $ref: '#/components/responses/NotFound' }
              }
            },
            delete: {
              summary: 'Xóa ban phụ trách (🔴 SUPER_ADMIN)',
              tags: ['📋 Divisions'],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  schema: { type: 'integer' },
                  description: 'ID ban phụ trách'
                }
              ],
              responses: {
                200: {
                  description: 'Ban phụ trách được xóa',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Đã xóa ban' }
                        }
                      }
                    }
                  }
                },
                400: {
                  description: 'Không thể xóa ban có thành viên',
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
                  description: 'Danh sách khóa học (từ 11/năm này đến 11/năm sau)',
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
                    schema: { $ref: '#/components/schemas/CreateAcademicYearRequest' }
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
          '/api/achievements': {
            get: {
              summary: 'Lấy danh sách thành tích',
              tags: ['🏆 Achievements'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Danh sách thành tích',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Achievement' }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: 'Tạo thành tích mới (🟡 ADMIN)',
              tags: ['🏆 Achievements'],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['title', 'category', 'level', 'pointsReward'],
                      properties: {
                        title: { type: 'string', example: 'Thành viên xuất sắc' },
                        description: { type: 'string', example: 'Dành cho thành viên có đóng góp tích cực' },
                        category: { type: 'string', enum: ['academic', 'creative', 'leadership', 'participation', 'special'], example: 'participation' },
                        level: { type: 'string', enum: ['bronze', 'silver', 'gold', 'special'], example: 'gold' },
                        badgeIcon: { type: 'string', example: 'Trophy' },
                        badgeColor: { type: 'string', example: '#FFD700' },
                        pointsReward: { type: 'integer', example: 100 }
                      }
                    }
                  }
                }
              },
              responses: {
                201: {
                  description: 'Thành tích được tạo thành công',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Achievement' }
                    }
                  }
                },
                403: { $ref: '#/components/responses/Forbidden' }
              }
            }
          },
          '/api/achievements/award': {
            post: {
              summary: 'Trao thành tích cho người dùng (🟡 ADMIN)',
              tags: ['🏆 Achievements'],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['userId', 'achievementId'],
                      properties: {
                        userId: { type: 'integer', example: 2 },
                        achievementId: { type: 'integer', example: 1 },
                        notes: { type: 'string', example: 'Hoàn thành xuất sắc dự án tháng 11' }
                      }
                    }
                  }
                }
              },
              responses: {
                201: {
                  description: 'Thành tích được trao thành công (tự động cộng BeePoints)',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' },
                          pointsAwarded: { type: 'integer' }
                        }
                      }
                    }
                  }
                },
                403: { $ref: '#/components/responses/Forbidden' }
              }
            }
          },
          '/api/achievements/me': {
            get: {
              summary: 'Lấy danh sách thành tích của bản thân',
              tags: ['🏆 Achievements'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Danh sách thành tích của người dùng hiện tại',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            awardedDate: { type: 'string', format: 'date-time' },
                            notes: { type: 'string' },
                            achievement: { $ref: '#/components/schemas/Achievement' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/api/bee-points/me': {
            get: {
              summary: 'Lấy điểm BeePoints của bản thân',
              tags: ['🍯 BeePoints'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Thông tin điểm BeePoints',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/BeePoints' }
                    }
                  }
                }
              }
            }
          },
          '/api/bee-points/add': {
            post: {
              summary: 'Thêm điểm cho người dùng (🟡 ADMIN)',
              tags: ['🍯 BeePoints'],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['userId', 'amount', 'description'],
                      properties: {
                        userId: { type: 'integer', example: 2 },
                        amount: { type: 'integer', example: 50 },
                        description: { type: 'string', example: 'Thưởng hoàn thành nhiệm vụ' }
                      }
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'Điểm được thêm thành công',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' },
                          newBalance: { type: 'integer' }
                        }
                      }
                    }
                  }
                },
                403: { $ref: '#/components/responses/Forbidden' }
              }
            }
          },
          '/api/bee-points/transactions': {
            get: {
              summary: 'Lấy lịch sử giao dịch điểm',
              tags: ['🍯 BeePoints'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Lịch sử giao dịch điểm',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            userId: { type: 'integer' },
                            type: { type: 'string', enum: ['earned', 'spent', 'admin_adjustment'] },
                            amount: { type: 'integer' },
                            description: { type: 'string' },
                            achievementId: { type: 'integer', nullable: true },
                            createdAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/api/stats': {
            get: {
              summary: 'Lấy thống kê cơ bản',
              tags: ['📊 Statistics'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Thống kê tổng quan',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Stats' }
                    }
                  }
                }
              }
            }
          },
          '/api/dynamic-stats': {
            get: {
              summary: 'Lấy thống kê động',
              tags: ['📊 Statistics'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Thống kê động',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            title: { type: 'string' },
                            value: { type: 'string' },
                            icon: { type: 'string' },
                            color: { type: 'string' },
                            isActive: { type: 'boolean' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/api/admin/api-keys': {
            get: {
              summary: 'Lấy danh sách API keys (🟡 ADMIN)',
              tags: ['🔑 API Keys'],
              security: [{ bearerAuth: [] }],
              responses: {
                200: {
                  description: 'Danh sách API keys',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ApiKey' }
                      }
                    }
                  }
                },
                403: { $ref: '#/components/responses/Forbidden' }
              }
            },
            post: {
              summary: 'Tạo API key mới (🟡 ADMIN)',
              tags: ['🔑 API Keys'],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['name', 'permissions'],
                      properties: {
                        name: { type: 'string', example: 'Mobile App API' },
                        permissions: { 
                          type: 'array', 
                          items: { type: 'string' }, 
                          example: ['members:view', 'stats:view', 'achievements:view'] 
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                201: {
                  description: 'API key được tạo thành công',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          apiKey: { type: 'string' },
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          permissions: { type: 'array', items: { type: 'string' } }
                        }
                      }
                    }
                  }
                },
                403: { $ref: '#/components/responses/Forbidden' }
              }
            }
          },
          '/api/admin/api-keys/{id}': {
            put: {
              summary: 'Cập nhật API key (🟡 ADMIN)',
              tags: ['🔑 API Keys'],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  schema: { type: 'integer' },
                  description: 'ID API key'
                }
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        permissions: { 
                          type: 'array', 
                          items: { type: 'string' }, 
                          example: ['members:view', 'stats:view'] 
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'API key được cập nhật',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ApiKey' }
                    }
                  }
                },
                404: { $ref: '#/components/responses/NotFound' }
              }
            },
            delete: {
              summary: 'Xóa API key (🟡 ADMIN)',
              tags: ['🔑 API Keys'],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  in: 'path',
                  name: 'id',
                  required: true,
                  schema: { type: 'integer' },
                  description: 'ID API key'
                }
              ],
              responses: {
                200: {
                  description: 'API key được xóa',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'API key đã được xóa' }
                        }
                      }
                    }
                  }
                },
                404: { $ref: '#/components/responses/NotFound' }
              }
            }
          },
          '/api/external/stats': {
            get: {
              summary: 'Lấy thống kê cho ứng dụng bên ngoài',
              tags: ['🌐 External API'],
              security: [{ ApiKeyAuth: [] }],
              responses: {
                200: {
                  description: 'Thống kê cho ứng dụng bên ngoài',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Stats' }
                    }
                  }
                },
                401: { $ref: '#/components/responses/Unauthorized' }
              }
            }
          },
          '/api/external/members': {
            get: {
              summary: 'Lấy danh sách thành viên cho ứng dụng bên ngoài',
              tags: ['🌐 External API'],
              security: [{ ApiKeyAuth: [] }],
              parameters: [
                {
                  in: 'query',
                  name: 'departmentId',
                  schema: { type: 'integer' },
                  description: 'ID phòng ban'
                }
              ],
              responses: {
                200: {
                  description: 'Danh sách thành viên cho ứng dụng bên ngoài',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Member' }
                      }
                    }
                  }
                },
                401: { $ref: '#/components/responses/Unauthorized' }
              }
            }
          },
          '/api/external/achievements': {
            get: {
              summary: 'Lấy danh sách thành tích cho ứng dụng bên ngoài',
              tags: ['🌐 External API'],
              security: [{ ApiKeyAuth: [] }],
              responses: {
                200: {
                  description: 'Danh sách thành tích cho ứng dụng bên ngoài',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Achievement' }
                      }
                    }
                  }
                },
                401: { $ref: '#/components/responses/Unauthorized' }
              }
            }
          }
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
      apis: [],
    };

    const specs = swaggerJsdoc(options);
    
    const html = swaggerUi.generateHTML(specs, {
      explorer: true,
      customSiteTitle: 'CLB Sáng Tạo - API Documentation',
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #1f2937; font-size: 24px; }
        .swagger-ui .info .description { font-size: 14px; line-height: 1.6; white-space: pre-line; }
        .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .swagger-ui .opblock.opblock-post { border-color: #059669; background: rgba(5, 150, 105, 0.1); }
        .swagger-ui .opblock.opblock-get { border-color: #0284c7; background: rgba(2, 132, 199, 0.1); }
        .swagger-ui .opblock.opblock-put { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .swagger-ui .opblock.opblock-delete { border-color: #dc2626; background: rgba(220, 38, 38, 0.1); }
        .swagger-ui .opblock-tag { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .swagger-ui .opblock-summary { font-weight: 500; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        filter: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        tagsSorter: (a: string, b: string) => {
          const order = [
            '🟢 Public',
            '🔐 Authentication', 
            '👥 Users',
            '🎓 Members',
            '🏢 Departments',
            '👑 Positions',
            '📋 Divisions',
            '📅 Academic Years',
            '🏆 Achievements',
            '🍯 BeePoints',
            '📊 Statistics',
            '🔑 API Keys',
            '🌐 External API'
          ];
          return order.indexOf(a) - order.indexOf(b);
        },
      },
    });
    
    res.send(html);
  });

  // JSON spec
  app.get('/api-docs.json', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const serverUrl = `${protocol}://${host}`;
    
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'CLB Sáng Tạo - API Documentation',
          version: '2.1.0',
          description: 'API cho hệ thống quản lý câu lạc bộ sáng tạo',
        },
        servers: [{ url: serverUrl, description: 'Current Server' }],
        // Minimal schema for JSON export
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
          },
        },
      },
      apis: [],
    };
    
    const specs = swaggerJsdoc(options);
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Postman collection
  app.get('/postman-collection.json', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const serverUrl = `${protocol}://${host}`;
    
    const collection = {
      info: {
        name: 'CLB Sáng Tạo API - Production Ready',
        description: 'Complete API collection for club management system',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        { key: 'baseUrl', value: serverUrl },
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
              event: [
                {
                  listen: 'test',
                  script: {
                    exec: [
                      'if (pm.response.to.have.status(200)) {',
                      '    const response = pm.response.json();',
                      '    pm.collectionVariables.set("authToken", response.token);',
                      '}'
                    ]
                  }
                }
              ],
              request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({ username: 'admin', password: 'password123' })
                },
                url: '{{baseUrl}}/api/auth/login'
              }
            }
          ]
        }
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="CLB-SangTao-Production.postman_collection.json"');
    res.send(collection);
  });

  // Landing page redirect
  app.get('/docs', (req, res) => res.redirect('/api-docs'));
}