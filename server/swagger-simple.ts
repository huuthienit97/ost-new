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
      url: 'http://localhost:3000',
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