#!/bin/bash

echo "Building project for production..."

# Install dependencies
npm install

# Build the frontend
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

echo "Build completed. Ready for production deployment."