#!/usr/bin/env node

// Set production environment
process.env.NODE_ENV = 'production';

// Import and run the built server
import('./dist/index.js');