import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CLB Sáng Tạo - API Documentation',
    version: '2.0.0',
    description: `Hệ thống quản lý câu lạc bộ sáng tạo với BeePoint reward system

## Phân cấp quyền hạn và vai trò:

### 🔴 SUPER_ADMIN - Siêu quản trị viên
**Toàn quyền hệ thống:**
- Users: Tạo, sửa, xóa tài khoản người dùng
- Roles: Quản lý vai trò và phân quyền
- API Keys: Tạo, sửa, xóa API keys
- System Settings: Cấu hình hệ thống
- Statistics: Xem tất cả thống kê hệ thống

**Permissions:** system:admin, user:*, role:*, api_key:*, stats:view

### 🟠 ADMIN - Quản trị viên
**Quản lý nội dung và thành viên:**
- Members: CRUD operations cho thành viên
- Organization: Quản lý ban/phòng, chức vụ, khóa học
- BeePoints: Award, manage, xem giao dịch
- Missions: Tạo, giao, đánh giá nhiệm vụ
- Shop: Quản lý sản phẩm, đơn hàng, kho
- Achievements: Tạo, trao thưởng thành tích

**Permissions:** member:*, division:*, position:*, academic_year:*, beepoint:*, mission:*, shop:*, achievement:*

### 🟡 MANAGER - Trưởng ban
**Quản lý phạm vi hạn chế:**
- Members: Xem thành viên trong ban của mình
- Missions: Giao và đánh giá nhiệm vụ
- BeePoints: Award với giới hạn
- Statistics: Xem thống kê hạn chế

**Permissions:** member:view, mission:assign, mission:review, beepoint:award

### 🔵 MEMBER - Thành viên
**Tự quản lý và tham gia:**
- Profile: Cập nhật thông tin cá nhân
- Missions: Nộp bài và theo dõi tiến độ
- BeePoints: Xem điểm và lịch sử giao dịch
- Shop: Mua sắm với điểm BeePoint
- Achievements: Xem thành tích cá nhân

**Permissions:** mission:submit, shop:purchase, beepoint:view

### 🟢 VIEWER - Khách/Observer
**Chỉ xem thông tin công khai:**
- Public: Xem thông tin cơ bản
- Limited: Quyền truy cập hạn chế

**Permissions:** Minimal read-only access

## Hướng dẫn sử dụng API:
1. **Authentication:** POST /api/auth/login để lấy JWT token
2. **Authorization:** Click nút "Authorize", nhập: Bearer <your_token>
3. **Testing:** Thử nghiệm các endpoint theo phân cấp quyền của bạn
4. **Error Handling:** Kiểm tra mã lỗi 401 (Unauthorized), 403 (Forbidden)

## Lưu ý quan trọng:
- Mỗi API có yêu cầu quyền hạn cụ thể
- Super Admin có toàn quyền trên hệ thống
- Admin quản lý nội dung và thành viên
- Manager có quyền hạn trong phạm vi ban của mình
- Member chỉ có quyền tự quản lý và tham gia hoạt động`
  },
  servers: [
    {
      url: 'https://api.ost.edu.vn',
      description: 'Production Server'
    },
    {
      url: 'http://localhost:5000',
      description: 'Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          beePointsCost: { type: 'integer' },
          stockQuantity: { type: 'integer' },
          imageUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'integer' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          productId: { type: 'integer' },
          quantity: { type: 'integer' },
          totalBeePoints: { type: 'integer' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'delivered', 'cancelled'] },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      BeePointTransaction: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          amount: { type: 'integer' },
          type: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            roleId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullName: { type: 'string' },
            class: { type: 'string' },
            divisionId: { type: 'integer' },
            positionId: { type: 'integer' },
            academicYearId: { type: 'integer' },
            email: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            memberType: { type: 'string' },
            joinDate: { type: 'string', format: 'date' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Division: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Position: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            level: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Mission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            beePointsReward: { type: 'integer' },
            maxParticipants: { type: 'integer', nullable: true },
            currentParticipants: { type: 'integer' },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            status: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            beePointsReward: { type: 'integer' },
            type: { type: 'string' },
            criteria: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  paths: {
    '/api/shop/products': {
      get: {
        summary: 'Get all products',
        tags: ['Shop'],
        responses: {
          '200': {
            description: 'List of products',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Product' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create new product (Admin)',
        tags: ['Shop'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'category', 'beePointsCost', 'stockQuantity'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  beePointsCost: { type: 'integer' },
                  stockQuantity: { type: 'integer' },
                  imageUrl: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Product created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' }
              }
            }
          }
        }
      }
    },
    '/api/shop/products/{id}': {
      put: {
        summary: 'Update product (Admin)',
        tags: ['Shop'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  beePointsCost: { type: 'integer' },
                  stockQuantity: { type: 'integer' },
                  imageUrl: { type: 'string' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Product updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete product (Admin)',
        tags: ['Shop'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Product deleted'
          }
        }
      }
    },
    '/api/shop/purchase': {
      post: {
        summary: 'Purchase product with BeePoints',
        tags: ['Shop'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'integer' },
                  quantity: { type: 'integer' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' }
              }
            }
          }
        }
      }
    },
    '/api/shop/orders': {
      get: {
        summary: 'Get user orders',
        tags: ['Shop'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Order' }
                }
              }
            }
          }
        }
      }
    },
    '/api/shop/orders/all': {
      get: {
        summary: 'Get all orders (Admin)',
        tags: ['Shop'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of all orders',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Order' }
                }
              }
            }
          }
        }
      }
    },
    '/api/shop/orders/{id}/status': {
      put: {
        summary: 'Update order status (Admin)',
        tags: ['Shop'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  status: { 
                    type: 'string', 
                    enum: ['pending', 'confirmed', 'delivered', 'cancelled'] 
                  },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Order status updated'
          }
        }
      }
    },
    '/api/beepoints/stats': {
      get: {
        summary: 'Get BeePoint statistics',
        tags: ['BeePoints'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'BeePoint statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
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
    '/api/beepoints/circulation': {
      get: {
        summary: 'Get BeePoint circulation data (Admin)',
        tags: ['BeePoints'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'BeePoint circulation data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalSupply: { type: 'integer' },
                    distributedPoints: { type: 'integer' },
                    redeemedPoints: { type: 'integer' }
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
        summary: 'User login',
        tags: ['🔐 Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
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
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user info',
        tags: ['🔐 Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user information',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      }
    },
    '/api/members': {
      get: {
        summary: 'Get all members',
        tags: ['👥 Members'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of members',
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
        summary: 'Create new member',
        tags: ['👥 Members'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'class', 'divisionId', 'positionId', 'academicYearId'],
                properties: {
                  fullName: { type: 'string' },
                  class: { type: 'string' },
                  divisionId: { type: 'integer' },
                  positionId: { type: 'integer' },
                  academicYearId: { type: 'integer' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Member created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Member' }
              }
            }
          }
        }
      }
    },
    '/api/divisions': {
      get: {
        summary: 'Get all divisions',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of divisions',
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
      }
    },
    '/api/positions': {
      get: {
        summary: 'Get all positions',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of positions',
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
      }
    },
    '/api/missions': {
      get: {
        summary: 'Get all missions',
        tags: ['🎯 Missions'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of missions',
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
        summary: 'Create new mission',
        tags: ['🎯 Missions'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'beePointsReward'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  beePointsReward: { type: 'integer' },
                  maxParticipants: { type: 'integer' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Mission created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mission' }
              }
            }
          }
        }
      }
    },
    '/api/achievements': {
      get: {
        summary: 'Get all achievements',
        tags: ['🏆 Achievements'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of achievements',
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
      }
    },
    '/api/beepoints/transactions': {
      get: {
        summary: 'Get BeePoint transactions',
        tags: ['💰 BeePoints'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of BeePoint transactions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/BeePointTransaction' }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/check-init': {
      get: {
        summary: 'Check if system needs initialization',
        tags: ['🟢 Public'],
        responses: {
          '200': {
            description: 'System initialization status',
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
    '/api/auth/init': {
      post: {
        summary: 'Initialize first admin account',
        tags: ['🟢 Public'],
        responses: {
          '200': {
            description: 'Admin account created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    username: { type: 'string' },
                    defaultPassword: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users': {
      get: {
        summary: 'Get all users',
        tags: ['👥 Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of users',
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
      },
      post: {
        summary: 'Create new user',
        tags: ['👥 Users'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'email', 'fullName'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                  email: { type: 'string' },
                  fullName: { type: 'string' },
                  roleId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}': {
      put: {
        summary: 'Update user',
        tags: ['👥 Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  username: { type: 'string' },
                  email: { type: 'string' },
                  fullName: { type: 'string' },
                  roleId: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete user',
        tags: ['👥 Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'User deleted successfully'
          }
        }
      }
    },
    '/api/roles': {
      get: {
        summary: 'Get all roles',
        tags: ['🔒 Roles'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of roles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      permissions: {
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
    },
    '/api/statistics': {
      get: {
        summary: 'Get system statistics',
        tags: ['📊 Statistics'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'System statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalMembers: { type: 'integer' },
                    totalUsers: { type: 'integer' },
                    totalMissions: { type: 'integer' },
                    completedMissions: { type: 'integer' },
                    totalBeePoints: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/api-keys': {
      get: {
        summary: 'Get all API keys (SUPER_ADMIN)',
        tags: ['🔑 API Keys'],
        security: [{ BearerAuth: [] }],
        description: 'Requires SUPER_ADMIN role - API_KEY_VIEW permission',
        responses: {
          '200': {
            description: 'List of API keys',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      permissions: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create new API key (SUPER_ADMIN)',
        tags: ['🔑 API Keys'],
        security: [{ BearerAuth: [] }],
        description: 'Requires SUPER_ADMIN role - API_KEY_CREATE permission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'permissions'],
                properties: {
                  name: { type: 'string' },
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
          '201': {
            description: 'API key created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    key: { type: 'string' },
                    permissions: {
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
    },
    '/api/api-keys/{id}': {
      put: {
        summary: 'Update API key (SUPER_ADMIN)',
        tags: ['🔑 API Keys'],
        security: [{ BearerAuth: [] }],
        description: 'Requires SUPER_ADMIN role - API_KEY_EDIT permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  name: { type: 'string' },
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
          '200': {
            description: 'API key updated successfully'
          }
        }
      },
      delete: {
        summary: 'Delete API key (SUPER_ADMIN)',
        tags: ['🔑 API Keys'],
        security: [{ BearerAuth: [] }],
        description: 'Requires SUPER_ADMIN role - API_KEY_DELETE permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'API key deleted successfully'
          }
        }
      }
    },
    '/api/roles/{id}': {
      put: {
        summary: 'Update role (SUPER_ADMIN)',
        tags: ['🔒 Roles'],
        security: [{ BearerAuth: [] }],
        description: 'Requires SUPER_ADMIN role - ROLE_EDIT permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  name: { type: 'string' },
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
          '200': {
            description: 'Role updated successfully'
          }
        }
      },
      delete: {
        summary: 'Delete role (SUPER_ADMIN)',
        tags: ['🔒 Roles'],
        security: [{ BearerAuth: [] }],
        description: 'Requires SUPER_ADMIN role - ROLE_DELETE permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Role deleted successfully'
          }
        }
      }
    },
    '/api/roles': {
      post: {
        summary: 'Create new role (SUPER_ADMIN)',
        tags: ['🔒 Roles'],
        security: [{ BearerAuth: [] }],
        description: 'Requires SUPER_ADMIN role - ROLE_CREATE permission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'displayName', 'permissions'],
                properties: {
                  name: { type: 'string' },
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
          '201': {
            description: 'Role created successfully'
          }
        }
      }
    },
    '/api/members/{id}': {
      put: {
        summary: 'Update member (ADMIN)',
        tags: ['👥 Members'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - MEMBER_EDIT permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  fullName: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  class: { type: 'string' },
                  divisionId: { type: 'integer' },
                  positionId: { type: 'integer' },
                  academicYearId: { type: 'integer' },
                  memberType: { type: 'string', enum: ['active', 'alumni'] },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Member updated successfully'
          }
        }
      },
      delete: {
        summary: 'Delete member (ADMIN)',
        tags: ['👥 Members'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - MEMBER_DELETE permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Member deleted successfully'
          }
        }
      }
    },
    '/api/divisions/{id}': {
      put: {
        summary: 'Update division (ADMIN)',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - DIVISION_EDIT permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
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
          '200': {
            description: 'Division updated successfully'
          }
        }
      },
      delete: {
        summary: 'Delete division (ADMIN)',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - DIVISION_DELETE permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Division deleted successfully'
          }
        }
      }
    },
    '/api/divisions': {
      post: {
        summary: 'Create new division (ADMIN)',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - DIVISION_CREATE permission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  color: { type: 'string', default: '#3B82F6' },
                  icon: { type: 'string', default: 'Users' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Division created successfully'
          }
        }
      }
    },
    '/api/positions/{id}': {
      put: {
        summary: 'Update position (ADMIN)',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - POSITION_EDIT permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  name: { type: 'string' },
                  displayName: { type: 'string' },
                  level: { type: 'integer' },
                  isLeadership: { type: 'boolean' },
                  isDepartmentLevel: { type: 'boolean' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Position updated successfully'
          }
        }
      },
      delete: {
        summary: 'Delete position (ADMIN)',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - POSITION_DELETE permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Position deleted successfully'
          }
        }
      }
    },
    '/api/positions': {
      post: {
        summary: 'Create new position (ADMIN)',
        tags: ['🏢 Organization'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - POSITION_CREATE permission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'displayName', 'level'],
                properties: {
                  name: { type: 'string' },
                  displayName: { type: 'string' },
                  level: { type: 'integer' },
                  isLeadership: { type: 'boolean', default: false },
                  isDepartmentLevel: { type: 'boolean', default: false },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Position created successfully'
          }
        }
      }
    },
    '/api/missions/{id}': {
      put: {
        summary: 'Update mission (ADMIN)',
        tags: ['🎯 Missions'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - MISSION_EDIT permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  beePointsReward: { type: 'integer' },
                  maxParticipants: { type: 'integer' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  status: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Mission updated successfully'
          }
        }
      },
      delete: {
        summary: 'Delete mission (ADMIN)',
        tags: ['🎯 Missions'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - MISSION_DELETE permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Mission deleted successfully'
          }
        }
      }
    },
    '/api/achievements/{id}': {
      put: {
        summary: 'Update achievement (ADMIN)',
        tags: ['🏆 Achievements'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - ACHIEVEMENT_EDIT permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
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
                  name: { type: 'string' },
                  description: { type: 'string' },
                  beePointsReward: { type: 'integer' },
                  type: { type: 'string' },
                  criteria: { type: 'object' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Achievement updated successfully'
          }
        }
      },
      delete: {
        summary: 'Delete achievement (ADMIN)',
        tags: ['🏆 Achievements'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - ACHIEVEMENT_DELETE permission',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Achievement deleted successfully'
          }
        }
      }
    },
    '/api/achievements': {
      post: {
        summary: 'Create new achievement (ADMIN)',
        tags: ['🏆 Achievements'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN role - ACHIEVEMENT_CREATE permission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'beePointsReward', 'type'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  beePointsReward: { type: 'integer' },
                  type: { type: 'string' },
                  criteria: { type: 'object' },
                  isActive: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Achievement created successfully'
          }
        }
      }
    },
    '/api/beepoints/award': {
      post: {
        summary: 'Award BeePoints (ADMIN/MANAGER)',
        tags: ['💰 BeePoints'],
        security: [{ BearerAuth: [] }],
        description: 'Requires ADMIN/MANAGER role - BEEPOINT_AWARD permission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['memberId', 'amount', 'description'],
                properties: {
                  memberId: { type: 'integer' },
                  amount: { type: 'integer' },
                  description: { type: 'string' },
                  type: { type: 'string', default: 'manual_award' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'BeePoints awarded successfully'
          }
        }
      }
    }
  }
};

export function setupSwagger(app: Express) {
  app.use('/api-docs', (req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const serverUrl = `${protocol}://${host}`;
    
    swaggerDefinition.servers = [
      {
        url: serverUrl,
        description: 'Current Server'
      }
    ];
    next();
  });

  const options = {
    definition: swaggerDefinition,
    apis: []
  };

  const specs = swaggerJsdoc(options);
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'CLB Sáng Tạo - API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #1f2937; font-size: 24px; }
    `
  }));
}