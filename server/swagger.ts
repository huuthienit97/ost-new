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

## Phân quyền:
- 🟢 PUBLIC: Không cần xác thực
- 🔵 USER: Cần đăng nhập
- 🟡 ADMIN: Cần quyền admin
- 🔴 SUPER_ADMIN: Cần quyền super admin

## Hướng dẫn:
1. Đăng nhập tại /api/auth/login để lấy JWT token
2. Click "Authorize" và nhập: Bearer <token>
3. Test các API theo nhóm chức năng
      `,
    },
    servers: [
      {
        url: 'https://api.ost.edu.vn',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    paths: {
      // ===== SHOP & REWARD EXCHANGE API =====
      '/api/shop/products': {
        get: {
          summary: 'Lấy danh sách sản phẩm cửa hàng',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách sản phẩm',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ShopProduct' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Tạo sản phẩm mới (🟡 ADMIN)',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsertShopProduct' }
              }
            }
          },
          responses: {
            201: {
              description: 'Sản phẩm được tạo thành công',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ShopProduct' }
                }
              }
            }
          }
        }
      },
      '/api/shop/products/{id}': {
        get: {
          summary: 'Lấy thông tin sản phẩm',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Thông tin sản phẩm',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ShopProduct' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Cập nhật sản phẩm (🟡 ADMIN)',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InsertShopProduct' }
              }
            }
          },
          responses: {
            200: {
              description: 'Sản phẩm được cập nhật'
            }
          }
        },
        delete: {
          summary: 'Xóa sản phẩm (🟡 ADMIN)',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Sản phẩm được xóa'
            }
          }
        }
      },
      '/api/shop/purchase': {
        post: {
          summary: 'Đổi thưởng sản phẩm với BeePoints',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId', 'quantity'],
                  properties: {
                    productId: { type: 'integer', example: 1 },
                    quantity: { type: 'integer', minimum: 1, example: 1 },
                    deliveryInfo: { 
                      type: 'string', 
                      example: 'Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM\nSĐT: 0901234567' 
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Đổi thưởng thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      order: { $ref: '#/components/schemas/ShopOrder' },
                      remainingBeePoints: { type: 'integer' }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Lỗi đổi thưởng (không đủ BeePoints, hết hàng, etc.)'
            }
          }
        }
      },
      '/api/shop/my-orders': {
        get: {
          summary: 'Lấy lịch sử đổi thưởng của tôi',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lịch sử đổi thưởng',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ShopOrder' }
                  }
                }
              }
            }
          }
        }
      },
      '/api/shop/orders': {
        get: {
          summary: 'Lấy tất cả đơn đổi thưởng (🟡 ADMIN)',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách đơn đổi thưởng',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ShopOrder' }
                  }
                }
              }
            }
          }
        }
      },
      '/api/shop/orders/{id}': {
        put: {
          summary: 'Cập nhật trạng thái đơn đổi thưởng (🟡 ADMIN)',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { 
                      type: 'string',
                      enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
                      example: 'confirmed'
                    },
                    notes: { type: 'string', example: 'Đã xác nhận và chuẩn bị giao hàng' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cập nhật trạng thái thành công'
            }
          }
        }
      },
      '/api/shop/circulation': {
        get: {
          summary: 'Lấy thông tin lưu thông BeePoint (🟡 ADMIN)',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Thông tin lưu thông BeePoint',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BeePointCirculation' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Cập nhật lưu thông BeePoint (🔴 SUPER_ADMIN)',
          tags: ['🛒 Shop'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalSupply: { type: 'integer', example: 1000000 },
                    distributedPoints: { type: 'integer', example: 50000 },
                    availablePoints: { type: 'integer', example: 950000 }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cập nhật lưu thông thành công'
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
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
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            role: { $ref: '#/components/schemas/Role' },
            mustChangePassword: { type: 'boolean' },
            avatarUrl: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            facebookUrl: { type: 'string', nullable: true },
            instagramUrl: { type: 'string', nullable: true },
            tiktokUrl: { type: 'string', nullable: true },
            youtubeUrl: { type: 'string', nullable: true },
            linkedinUrl: { type: 'string', nullable: true },
            githubUrl: { type: 'string', nullable: true },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            member: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                studentId: { type: 'string', nullable: true },
                class: { type: 'string' },
                divisionId: { type: 'integer' },
                positionId: { type: 'integer' },
                academicYearId: { type: 'integer' },
                memberType: { type: 'string', enum: ['active', 'alumni'] },
                joinDate: { type: 'string' },
                notes: { type: 'string', nullable: true }
              }
            },
            beePoints: {
              type: 'object',
              nullable: true,
              properties: {
                currentPoints: { type: 'integer' },
                totalEarned: { type: 'integer' },
                totalSpent: { type: 'integer' }
              }
            }
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'admin' },
            displayName: { type: 'string', example: 'Quản trị viên' },
            description: { type: 'string', example: 'Quản lý toàn bộ hệ thống' },
            permissions: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['users:view', 'users:create', 'members:view', 'members:create']
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
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
            divisionId: { type: 'integer' },
            positionId: { type: 'integer' },
            academicYearId: { type: 'integer' },
            memberType: { type: 'string', enum: ['active', 'alumni'] },
            joinDate: { type: 'string', format: 'date' },
            notes: { type: 'string' },
            userId: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            division: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                color: { type: 'string' },
                icon: { type: 'string' }
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
            academicYear: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' }
              }
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                fullName: { type: 'string' },
                email: { type: 'string' }
              }
            }
          },
        },
        Setting: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            key: { type: 'string' },
            value: { type: 'string' },
            description: { type: 'string' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Mission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'special', 'project'] },
            type: { type: 'string', enum: ['one_time', 'repeatable'] },
            maxParticipants: { type: 'integer', nullable: true },
            currentParticipants: { type: 'integer' },
            beePointsReward: { type: 'integer' },
            requiresPhoto: { type: 'boolean' },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            status: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            createdBy: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                fullName: { type: 'string' },
                username: { type: 'string' }
              }
            }
          }
        },
        MissionAssignment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            missionId: { type: 'integer' },
            userId: { type: 'integer' },
            status: { type: 'string', enum: ['assigned', 'in_progress', 'completed', 'submitted', 'rejected'] },
            assignedDate: { type: 'string', format: 'date-time' },
            completedDate: { type: 'string', format: 'date-time', nullable: true },
            submissionNote: { type: 'string', nullable: true },
            reviewNote: { type: 'string', nullable: true },
            pointsAwarded: { type: 'integer' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                fullName: { type: 'string' },
                username: { type: 'string' }
              }
            }
          }
        },
        ShopProduct: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Áo thun CLB Sáng tạo' },
            description: { type: 'string', example: 'Áo thun chất lượng cao với logo CLB' },
            beePointsCost: { type: 'integer', example: 50 },
            category: { type: 'string', example: 'fashion' },
            imageUrl: { type: 'string', example: 'https://example.com/product.jpg' },
            stockQuantity: { type: 'integer', example: 100 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        InsertShopProduct: {
          type: 'object',
          required: ['name', 'description', 'beePointsCost', 'category'],
          properties: {
            name: { type: 'string', example: 'Áo thun CLB Sáng tạo' },
            description: { type: 'string', example: 'Áo thun chất lượng cao với logo CLB' },
            beePointsCost: { type: 'integer', example: 50 },
            category: { type: 'string', example: 'fashion' },
            imageUrl: { type: 'string', example: 'https://example.com/product.jpg' },
            stockQuantity: { type: 'integer', example: 100 },
            isActive: { type: 'boolean', default: true }
          }
        },
        ShopOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 2 },
            productId: { type: 'integer', example: 1 },
            quantity: { type: 'integer', example: 1 },
            totalBeePointsCost: { type: 'integer', example: 50 },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
              example: 'pending'
            },
            deliveryInfo: { type: 'string', example: 'Địa chỉ: 123 Đường ABC' },
            notes: { type: 'string', example: 'Ghi chú admin' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        BeePointCirculation: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            totalSupply: { type: 'integer', example: 1000000 },
            distributedPoints: { type: 'integer', example: 50000 },
            availablePoints: { type: 'integer', example: 950000 },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        },
      },
    },
    tags: [
      { name: '🟢 Public', description: 'API công khai' },
      { name: '🔐 Authentication', description: 'Xác thực' },
      { name: '👥 Users', description: 'Quản lý người dùng hệ thống (🟡 ADMIN)' },
      { name: '🔒 Roles', description: 'Quản lý vai trò và phân quyền (🔴 SUPER_ADMIN)' },
      { name: '🎓 Members', description: 'Quản lý thành viên' },
      { name: '🏢 Departments', description: 'Quản lý ban' },
      { name: '👑 Positions', description: 'Quản lý chức vụ (🔴 SUPER_ADMIN)' },
      { name: '📋 Divisions', description: 'Quản lý ban phụ trách (🔴 SUPER_ADMIN)' },
      { name: '📅 Academic Years', description: 'Quản lý khóa học (🔴 SUPER_ADMIN)' },
      { name: '🏆 Achievements', description: 'Hệ thống thành tích' },
      { name: '🍯 BeePoints', description: 'Hệ thống điểm thưởng' },
      { name: '🛒 Shop', description: 'Cửa hàng đổi thưởng BeePoints' },
      { name: '🎯 Missions', description: 'Hệ thống nhiệm vụ và thưởng điểm' },
      { name: '⚙️ Settings', description: 'Quản lý cấu hình hệ thống (🔴 SUPER_ADMIN)' },
      { name: '📊 Statistics', description: 'Thống kê' },
      { name: '🔑 API Keys', description: 'Quản lý API keys (🟡 ADMIN)' },
      { name: '🌐 External API', description: 'API cho ứng dụng thứ 3' },
    ],
    paths: {
      // ===== SHOP & REWARD EXCHANGE API =====
      '/api/shop/products': {
        get: {
          summary: 'Lấy danh sách sản phẩm cửa hàng',
          tags: ['🛒 Shop'],
          responses: {
            200: {
              description: 'Danh sách người dùng',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
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
                schema: { $ref: '#/components/schemas/LoginRequest' }
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
            401: {
              description: 'Thông tin đăng nhập sai',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
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
                      needsInit: { type: 'boolean', example: false }
                    }
                  }
                }
              }
            }
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
            401: {
              description: 'Chưa đăng nhập',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
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
      '/api/admin/roles': {
        get: {
          summary: 'Lấy danh sách vai trò (🔴 SUPER_ADMIN)',
          tags: ['🔒 Roles'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách vai trò',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Role' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Tạo vai trò mới (🔴 SUPER_ADMIN)',
          tags: ['🔒 Roles'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'displayName', 'permissions'],
                  properties: {
                    name: { type: 'string', example: 'content_manager' },
                    displayName: { type: 'string', example: 'Quản lý nội dung' },
                    description: { type: 'string', example: 'Quản lý bài viết và nội dung website' },
                    permissions: { 
                      type: 'array', 
                      items: { type: 'string' }, 
                      example: ['members:view', 'members:create', 'achievements:view'] 
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Vai trò được tạo thành công',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Role' }
                }
              }
            }
          }
        }
      },
      '/api/admin/roles/{id}': {
        get: {
          summary: 'Lấy thông tin vai trò (🔴 SUPER_ADMIN)',
          tags: ['🔒 Roles'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Thông tin vai trò',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Role' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Cập nhật vai trò (🔴 SUPER_ADMIN)',
          tags: ['🔒 Roles'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
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
                    description: { type: 'string' },
                    permissions: { 
                      type: 'array', 
                      items: { type: 'string' } 
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Vai trò được cập nhật',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Role' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Xóa vai trò (🔴 SUPER_ADMIN)',
          tags: ['🔒 Roles'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Vai trò được xóa',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/change-password': {
        post: {
          summary: 'Đổi mật khẩu (🔵 USER)',
          tags: ['🔐 Authentication'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string', example: 'password123' },
                    newPassword: { type: 'string', example: 'newpassword123', minLength: 6 }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Đổi mật khẩu thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Mật khẩu hiện tại không chính xác hoặc mật khẩu mới không hợp lệ'
            }
          }
        }
      },
      '/api/auth/profile': {
        put: {
          summary: 'Cập nhật thông tin cá nhân (🔵 USER)',
          tags: ['🔐 Authentication'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                    email: { type: 'string', example: 'user@example.com' },
                    bio: { type: 'string', example: 'Mô tả bản thân' },
                    phone: { type: 'string', example: '0987654321' },
                    avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
                    facebookUrl: { type: 'string', example: 'https://facebook.com/username' },
                    instagramUrl: { type: 'string', example: 'https://instagram.com/username' },
                    tiktokUrl: { type: 'string', example: 'https://tiktok.com/@username' },
                    youtubeUrl: { type: 'string', example: 'https://youtube.com/c/username' },
                    linkedinUrl: { type: 'string', example: 'https://linkedin.com/in/username' },
                    githubUrl: { type: 'string', example: 'https://github.com/username' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cập nhật thông tin thành công',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      },
      '/api/users/{id}/reset-password': {
        post: {
          summary: 'Reset mật khẩu người dùng (🔴 SUPER_ADMIN)',
          tags: ['👥 Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Reset mật khẩu thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      username: { type: 'string' },
                      newPassword: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/settings': {
        get: {
          summary: 'Lấy tất cả cấu hình hệ thống (🔴 SUPER_ADMIN)',
          tags: ['⚙️ Settings'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách cấu hình',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Setting' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Tạo cấu hình mới (🔴 SUPER_ADMIN)',
          tags: ['⚙️ Settings'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['key', 'value'],
                  properties: {
                    key: { type: 'string', example: 'beepoint_total_supply' },
                    value: { type: 'string', example: '1000000' },
                    description: { type: 'string', example: 'Tổng cung BeePoint trong hệ thống' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Tạo cấu hình thành công',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Setting' }
                }
              }
            }
          }
        }
      },
      '/api/settings/{key}': {
        get: {
          summary: 'Lấy cấu hình theo key (🔴 SUPER_ADMIN)',
          tags: ['⚙️ Settings'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'key',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Thông tin cấu hình',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Setting' }
                }
              }
            }
          }
        },
        put: {
          summary: 'Cập nhật cấu hình (🔴 SUPER_ADMIN)',
          tags: ['⚙️ Settings'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'key',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cập nhật cấu hình thành công',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Setting' }
                }
              }
            }
          }
        }
      },
      '/api/beepoint/config': {
        get: {
          summary: 'Lấy cấu hình BeePoint (🔵 USER)',
          tags: ['🏆 BeePoint'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Cấu hình BeePoint',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalSupply: { type: 'integer', example: 1000000 },
                      exchangeRate: { type: 'number', example: 1.0 },
                      welcomeBonus: { type: 'integer', example: 100 },
                      activityMultiplier: { type: 'number', example: 1.0 }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Cập nhật cấu hình BeePoint (🔴 SUPER_ADMIN)',
          tags: ['🏆 BeePoint'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalSupply: { type: 'integer', example: 1000000 },
                    exchangeRate: { type: 'number', example: 1.0 },
                    welcomeBonus: { type: 'integer', example: 100 },
                    activityMultiplier: { type: 'number', example: 1.0 }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cập nhật cấu hình BeePoint thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/beepoint/init': {
        post: {
          summary: 'Khởi tạo cấu hình BeePoint mặc định (🔴 SUPER_ADMIN)',
          tags: ['🏆 BeePoint'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Khởi tạo cấu hình BeePoint thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
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
              description: 'Tìm kiếm theo tên, mã học sinh'
            },
            {
              in: 'query',
              name: 'type',
              schema: { type: 'string', enum: ['active', 'alumni'] },
              description: 'Loại thành viên'
            }
          ],
          responses: {
            200: {
              description: 'Danh sách thành viên',
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
                  required: ['fullName', 'class', 'divisionId', 'positionId', 'academicYearId', 'memberType', 'joinDate'],
                  properties: {
                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                    studentId: { type: 'string', example: 'HS001' },
                    email: { type: 'string', example: 'student@example.com' },
                    phone: { type: 'string', example: '0987654321' },
                    class: { type: 'string', example: '12A1' },
                    divisionId: { type: 'integer', example: 1 },
                    positionId: { type: 'integer', example: 1 },
                    academicYearId: { type: 'integer', example: 1 },
                    memberType: { type: 'string', enum: ['active', 'alumni'] },
                    joinDate: { type: 'string', format: 'date', example: '2024-11-01' },
                    notes: { type: 'string', example: 'Ghi chú về thành viên' },
                    createUserAccount: { type: 'boolean', example: false }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Thành viên được tạo',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Member' }
                }
              }
            }
          }
        }
      },
      '/api/members/{id}': {
        put: {
          summary: 'Cập nhật thành viên (🟡 ADMIN)',
          tags: ['🎓 Members'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                    studentId: { type: 'string', example: 'HS001' },
                    email: { type: 'string', example: 'student@example.com' },
                    phone: { type: 'string', example: '0987654321' },
                    class: { type: 'string', example: '12A1' },
                    divisionId: { type: 'integer', example: 1 },
                    positionId: { type: 'integer', example: 1 },
                    academicYearId: { type: 'integer', example: 1 },
                    memberType: { type: 'string', enum: ['active', 'alumni'] },
                    joinDate: { type: 'string', format: 'date', example: '2024-11-01' },
                    notes: { type: 'string', example: 'Ghi chú về thành viên' },
                    isActive: { type: 'boolean', example: true }
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
            }
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
              schema: { type: 'integer' }
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
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
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
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        icon: { type: 'string' },
                        color: { type: 'string' }
                      }
                    }
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
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        displayName: { type: 'string' },
                        level: { type: 'integer' }
                      }
                    }
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
                    description: { type: 'string' },
                    color: { type: 'string', example: '#10B981' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Chức vụ được tạo',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      displayName: { type: 'string' },
                      level: { type: 'integer' }
                    }
                  }
                }
              }
            }
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
              schema: { type: 'integer' }
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
              description: 'Chức vụ được cập nhật'
            }
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
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Chức vụ được xóa'
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
              description: 'Danh sách ban phụ trách'
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
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Ban Sự kiện' },
                    description: { type: 'string' },
                    color: { type: 'string', example: '#8B5CF6' },
                    icon: { type: 'string', example: 'Calendar' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Ban phụ trách được tạo'
            }
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
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Ban phụ trách được cập nhật'
            }
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
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Ban phụ trách được xóa'
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
              description: 'Danh sách khóa học (từ 11/năm này đến 11/năm sau)'
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
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Khóa học được tạo'
            }
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
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Khóa học được cập nhật'
            }
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
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Khóa học được xóa'
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
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ['academic', 'creative', 'leadership', 'participation', 'special'] },
                        level: { type: 'string', enum: ['bronze', 'silver', 'gold', 'special'] },
                        pointsReward: { type: 'integer' }
                      }
                    }
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
              description: 'Thành tích được tạo thành công'
            }
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
              description: 'Thành tích được trao thành công (tự động cộng BeePoints)'
            }
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
              description: 'Danh sách thành tích của người dùng hiện tại'
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
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      userId: { type: 'integer' },
                      currentPoints: { type: 'integer' },
                      totalEarned: { type: 'integer' },
                      totalSpent: { type: 'integer' }
                    }
                  }
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
              description: 'Điểm được thêm thành công'
            }
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
              description: 'Lịch sử giao dịch điểm'
            }
          }
        }
      },
      '/api/users': {
        get: {
          summary: 'Lấy danh sách người dùng hệ thống (🟡 ADMIN)',
          tags: ['👥 Users'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách người dùng hệ thống'
            }
          }
        },
        post: {
          summary: 'Tạo người dùng mới (🟡 ADMIN)',
          tags: ['👥 Users'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'fullName', 'password', 'roleId'],
                  properties: {
                    username: { type: 'string', example: 'newuser' },
                    email: { type: 'string', example: 'newuser@example.com' },
                    fullName: { type: 'string', example: 'Nguyễn Văn B' },
                    password: { type: 'string', example: 'password123' },
                    roleId: { type: 'integer', example: 2 }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Người dùng được tạo thành công'
            }
          }
        }
      },
      '/api/users/{id}': {
        put: {
          summary: 'Cập nhật người dùng (🟡 ADMIN)',
          tags: ['👥 Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    fullName: { type: 'string' },
                    roleId: { type: 'integer' },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Người dùng được cập nhật'
            }
          }
        },
        delete: {
          summary: 'Xóa người dùng (🟡 ADMIN)',
          tags: ['👥 Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Người dùng được xóa'
            }
          }
        }
      },
      '/api/users/{id}/change-password': {
        post: {
          summary: 'Đổi mật khẩu người dùng (🟡 ADMIN)',
          tags: ['👥 Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['newPassword'],
                  properties: {
                    newPassword: { type: 'string', example: 'newpassword123' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Mật khẩu được đổi thành công'
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
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        permissions: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        lastUsed: { type: 'string', format: 'date-time', nullable: true }
                      }
                    }
                  }
                }
              }
            }
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
              description: 'API key được tạo thành công'
            }
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
              schema: { type: 'integer' }
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
              description: 'API key được cập nhật'
            }
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
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'API key được xóa'
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
                  schema: {
                    type: 'object',
                    properties: {
                      totalMembers: { type: 'integer' },
                      activeMembers: { type: 'integer' },
                      alumniMembers: { type: 'integer' },
                      totalDepartments: { type: 'integer' }
                    }
                  }
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
      '/api/external/achievements': {
        get: {
          summary: 'Lấy danh sách thành tích cho ứng dụng bên ngoài',
          tags: ['🌐 External API'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách thành tích cho ứng dụng bên ngoài'
            }
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
              description: 'Thống kê cho ứng dụng bên ngoài'
            }
          }
        }
      },
      '/api/external/members': {
        get: {
          summary: 'Lấy danh sách thành viên cho ứng dụng bên ngoài',
          tags: ['🌐 External API'],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách thành viên cho ứng dụng bên ngoài'
            }
          }
        }
      },
      '/api/missions': {
        get: {
          summary: 'Lấy danh sách nhiệm vụ',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'status',
              schema: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] },
              description: 'Lọc theo trạng thái'
            },
            {
              in: 'query',
              name: 'category',
              schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'special', 'project'] },
              description: 'Lọc theo danh mục'
            },
            {
              in: 'query',
              name: 'type',
              schema: { type: 'string', enum: ['one_time', 'repeatable'] },
              description: 'Lọc theo loại nhiệm vụ'
            }
          ],
          responses: {
            200: {
              description: 'Danh sách nhiệm vụ',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Mission' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Tạo nhiệm vụ mới (🟡 ADMIN)',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'category', 'type'],
                  properties: {
                    title: { type: 'string', example: 'Tham gia workshop sáng tạo' },
                    description: { type: 'string', example: 'Tham gia workshop về kỹ năng sáng tạo' },
                    category: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'special', 'project'] },
                    type: { type: 'string', enum: ['one_time', 'repeatable'] },
                    maxParticipants: { type: 'integer', example: 20 },
                    beePointsReward: { type: 'integer', example: 50 },
                    requiresPhoto: { type: 'boolean', example: true },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    tags: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Nhiệm vụ được tạo thành công',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Mission' }
                }
              }
            }
          }
        }
      },
      '/api/missions/{id}': {
        get: {
          summary: 'Lấy chi tiết nhiệm vụ',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Chi tiết nhiệm vụ',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/Mission' },
                      {
                        type: 'object',
                        properties: {
                          assignments: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MissionAssignment' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Cập nhật nhiệm vụ (🟡 ADMIN)',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    maxParticipants: { type: 'integer' },
                    beePointsReward: { type: 'integer' },
                    requiresPhoto: { type: 'boolean' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    status: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] },
                    tags: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Nhiệm vụ được cập nhật',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Mission' }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Xóa nhiệm vụ (🟡 ADMIN)',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            200: {
              description: 'Nhiệm vụ được xóa',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/missions/{id}/assign': {
        post: {
          summary: 'Giao nhiệm vụ cho người dùng (🟡 ADMIN)',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId'],
                  properties: {
                    userId: { type: 'integer', example: 2 }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Giao nhiệm vụ thành công',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MissionAssignment' }
                }
              }
            }
          }
        }
      },
      '/api/missions/my': {
        get: {
          summary: 'Lấy nhiệm vụ của tôi',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'query',
              name: 'status',
              schema: { type: 'string', enum: ['assigned', 'in_progress', 'completed', 'submitted', 'rejected'] },
              description: 'Lọc theo trạng thái'
            }
          ],
          responses: {
            200: {
              description: 'Danh sách nhiệm vụ của người dùng',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        assignment: { $ref: '#/components/schemas/MissionAssignment' },
                        mission: { $ref: '#/components/schemas/Mission' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/missions/{id}/submit': {
        post: {
          summary: 'Nộp nhiệm vụ (có thể kèm hình ảnh)',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    photo: { type: 'string', format: 'binary', description: 'Hình ảnh minh chứng (nếu cần)' },
                    submissionNote: { type: 'string', description: 'Ghi chú khi nộp bài' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Nộp nhiệm vụ thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      assignment: { $ref: '#/components/schemas/MissionAssignment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/missions/assignments/{id}/review': {
        post: {
          summary: 'Duyệt nhiệm vụ (🟡 ADMIN)',
          tags: ['🎯 Missions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['completed', 'rejected'] },
                    reviewNote: { type: 'string', example: 'Hoàn thành tốt' },
                    pointsAwarded: { type: 'integer', example: 50 }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Duyệt nhiệm vụ thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      assignment: { $ref: '#/components/schemas/MissionAssignment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/permissions': {
        get: {
          summary: 'Lấy danh sách tất cả permissions có sẵn trong hệ thống',
          tags: ['🔑 Permission Management'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách permissions được nhóm theo category',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 57 },
                      permissions: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['member:view', 'member:create', 'achievement:view']
                      },
                      groupedPermissions: {
                        type: 'object',
                        example: {
                          member: ['member:view', 'member:create'],
                          achievement: ['achievement:view', 'achievement:create']
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/roles/{id}/permissions': {
        get: {
          summary: 'Lấy permissions của role cụ thể',
          tags: ['🔑 Permission Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'ID của role'
            }
          ],
          responses: {
            200: {
              description: 'Thông tin permissions của role',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      role: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          displayName: { type: 'string' },
                          permissions: {
                            type: 'array',
                            items: { type: 'string' }
                          }
                        }
                      },
                      availablePermissions: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      permissionsCount: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Cập nhật permissions cho role',
          tags: ['🔑 Permission Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'ID của role'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['permissions'],
                  properties: {
                    permissions: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['member:view', 'member:create', 'achievement:view']
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cập nhật permissions thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      role: { $ref: '#/components/schemas/Role' },
                      changedPermissions: {
                        type: 'object',
                        properties: {
                          added: {
                            type: 'array',
                            items: { type: 'string' }
                          },
                          removed: {
                            type: 'array',
                            items: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/profile': {
        put: {
          summary: 'Cập nhật thông tin cá nhân (đã cập nhật hỗ trợ tất cả trường)',
          tags: ['🔐 Authentication'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fullName', 'email'],
                  properties: {
                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                    email: { type: 'string', example: 'user@example.com' },
                    bio: { type: 'string', example: 'Mô tả về bản thân' },
                    phone: { type: 'string', example: '0987654321' },
                    facebookUrl: { type: 'string', example: 'https://facebook.com/username' },
                    instagramUrl: { type: 'string', example: 'https://instagram.com/username' },
                    tiktokUrl: { type: 'string', example: 'https://tiktok.com/@username' },
                    youtubeUrl: { type: 'string', example: 'https://youtube.com/channel/xxx' },
                    linkedinUrl: { type: 'string', example: 'https://linkedin.com/in/username' },
                    githubUrl: { type: 'string', example: 'https://github.com/username' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cập nhật thông tin thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [],
};

export function setupSwagger(app: Express) {
  // Dynamic server URL detection
  app.use('/api-docs', (req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const serverUrl = `${protocol}://${host}`;
    
    // Update server URL dynamically
    options.definition.servers = [
      {
        url: serverUrl,
        description: 'Current Server',
      },
    ];
    next();
  });

  const specs = swaggerJsdoc(options);

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
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
    `,
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
      filter: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      tagsSorter: (a: string, b: string) => {
        const order = [
          '🟢 Public',
          '🔐 Authentication', 
          '👥 Users',
          '🔒 Roles',
          '🎓 Members',
          '🏢 Departments',
          '👑 Positions',
          '📋 Divisions',
          '📅 Academic Years',
          '🏆 Achievements',
          '🍯 BeePoints',
          '🛒 Shop',
          '🎯 Missions',
          '📊 Statistics',
          '🔑 API Keys',
          '🌐 External API'
        ];
        return order.indexOf(a) - order.indexOf(b);
      },
    },
  }));

  // JSON spec
  app.get('/api-docs.json', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const serverUrl = `${protocol}://${host}`;
    
    options.definition.servers = [{ url: serverUrl, description: 'Current Server' }];
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
        name: 'CLB Sáng Tạo API',
        description: 'Complete API collection',
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
    res.setHeader('Content-Disposition', 'attachment; filename="CLB-SangTao-API.postman_collection.json"');
    res.send(collection);
  });

  app.get('/docs', (req, res) => res.redirect('/api-docs'));
}