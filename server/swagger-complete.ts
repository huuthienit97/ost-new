import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerDefinition = {
  definition: {
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
        AcademicYear: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            isActive: { type: 'boolean' },
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
        },
        BeePointTransaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            memberId: { type: 'integer' },
            amount: { type: 'integer' },
            type: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            beePointsCost: { type: 'integer' },
            stockQuantity: { type: 'integer' },
            category: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            memberId: { type: 'integer' },
            productId: { type: 'integer' },
            quantity: { type: 'integer' },
            totalBeePoints: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'delivered', 'cancelled'] },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        BeePointCirculation: {
          type: 'object',
          properties: {
            totalSupply: { type: 'integer' },
            distributedPoints: { type: 'integer' },
            redeemedPoints: { type: 'integer' }
          }
        }
      }
    },
    paths: {}
  },
  apis: []
};

const swaggerPaths = {
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
  '/api/academic-years': {
    get: {
      summary: 'Get all academic years',
      tags: ['📅 Academic Years'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of academic years',
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
  '/api/beepoints/circulation': {
    get: {
      summary: 'Get BeePoint circulation data (Admin)',
      tags: ['💰 BeePoints'],
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'BeePoint circulation data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BeePointCirculation' }
            }
          }
        }
      }
    }
  },
  '/api/shop/products': {
    get: {
      summary: 'Get all products',
      tags: ['🛒 Shop'],
      security: [{ BearerAuth: [] }],
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
      tags: ['🛒 Shop'],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'description', 'beePointsCost', 'stockQuantity', 'category'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                beePointsCost: { type: 'integer' },
                stockQuantity: { type: 'integer' },
                category: { type: 'string' },
                imageUrl: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Product created successfully',
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
      tags: ['🛒 Shop'],
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
                beePointsCost: { type: 'integer' },
                stockQuantity: { type: 'integer' },
                category: { type: 'string' },
                imageUrl: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Product updated successfully',
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
      tags: ['🛒 Shop'],
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
          description: 'Product deleted successfully'
        }
      }
    }
  },
  '/api/shop/orders': {
    get: {
      summary: 'Get orders',
      tags: ['🛒 Shop'],
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
    },
    post: {
      summary: 'Create new order',
      tags: ['🛒 Shop'],
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
          description: 'Order created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' }
            }
          }
        }
      }
    }
  },
  '/api/shop/orders/{id}/status': {
    put: {
      summary: 'Update order status (Admin)',
      tags: ['🛒 Shop'],
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
                status: { type: 'string', enum: ['pending', 'confirmed', 'delivered', 'cancelled'] },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Order status updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' }
            }
          }
        }
      }
    }
  }
};

// Merge paths into main definition
swaggerDefinition.definition.paths = swaggerPaths;

export function setupSwagger(app: Express) {
  const specs = swaggerJsdoc(swaggerDefinition);

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
          '🔐 Authentication', 
          '👥 Members',
          '🏢 Organization',
          '📅 Academic Years',
          '🎯 Missions',
          '🏆 Achievements',
          '💰 BeePoints',
          '🛒 Shop'
        ];
        return order.indexOf(a) - order.indexOf(b);
      },
    },
  }));

  // JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}