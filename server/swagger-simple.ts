import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CLB Sáng Tạo - API Documentation',
    version: '2.0.0',
    description: 'Hệ thống quản lý câu lạc bộ sáng tạo với BeePoint reward system'
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
        summary: 'Get all API keys',
        tags: ['🔑 API Keys'],
        security: [{ BearerAuth: [] }],
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
        summary: 'Create new API key',
        tags: ['🔑 API Keys'],
        security: [{ BearerAuth: [] }],
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