# Hướng dẫn Deploy lên VPS

## Vấn đề hiện tại
PM2 đang chạy development mode (`npm run dev`) thay vì production build, gây ra lỗi "Failed to load url /src/main.tsx".

## Cách sửa trên VPS

### 1. Stop tất cả PM2 processes
```bash
pm2 stop all
pm2 delete all
```

### 2. Build project
```bash
npm install
npm run build
```

### 3. Start lại với production mode
```bash
pm2 start ecosystem.config.js
```

### 4. Hoặc start trực tiếp
```bash
pm2 start npm --name "OST-backend" -- run start
```

## Kiểm tra
```bash
pm2 logs OST-backend
pm2 status
```

## File quan trọng đã tạo
- `ecosystem.config.js`: Cấu hình PM2 cho production
- `build.sh`: Script build tự động
- Đã cấu hình script `start` trong package.json

## Cấu trúc sau khi build
- `dist/`: Chứa server code đã build
- `client/dist/`: Chứa frontend assets đã build

Production server sẽ serve static files từ `client/dist` thay vì chạy Vite dev server.