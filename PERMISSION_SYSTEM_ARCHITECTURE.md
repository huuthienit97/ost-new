# Kiến trúc Hệ thống Phân quyền (Permission System Architecture)

## Tổng quan

Hệ thống sử dụng **Role-Based Access Control (RBAC)** với permissions được lưu trữ tập trung trong bảng `roles`.

## Cấu trúc Dữ liệu

### 1. Bảng `roles`
```sql
roles {
  id: serial PRIMARY KEY
  name: text UNIQUE          -- admin, manager, member
  displayName: text          -- Quản trị viên, Quản lý, Thành viên  
  permissions: text[]        -- ["member:view", "member:create", ...]
  isSystem: boolean          -- true cho roles không được xóa
}
```

### 2. Bảng `users`
```sql
users {
  id: serial PRIMARY KEY
  username: text
  email: text
  roleId: integer → roles.id  -- CHÍNH: Liên kết đến role
  -- KHÔNG có permissions riêng
}
```

## Luồng Hoạt động Permission

### 1. Xác thực (Authentication)
```
1. User đăng nhập → Nhận JWT token
2. Token chứa: userId, username, roleId
3. Middleware authenticate() kiểm tra token
4. Lấy fresh user data với role: getUserWithRole(userId)
5. Set req.user = { id, username, email, roleId, permissions: user.role.permissions }
```

### 2. Phân quyền (Authorization)  
```
1. authorize(requiredPermissions) middleware
2. Kiểm tra req.user.permissions (từ role)
3. So sánh với requiredPermissions
4. Allow/Deny access
```

### 3. Nguồn Permissions
- **AUTHORITATIVE SOURCE**: `roles.permissions` 
- **USER PERMISSIONS**: Được lấy từ role khi authentication
- **KHÔNG BAO GIỜ** lưu permissions trực tiếp trong user table

## API Quản lý Permissions

### 1. Xem tất cả permissions có sẵn
```
GET /api/permissions
Authorization: Bearer {token}
Permission: role:view

Response:
{
  "total": 57,
  "permissions": ["member:view", "member:create", ...],
  "groupedPermissions": {
    "member": ["member:view", "member:create"],
    "achievement": ["achievement:view", "achievement:create"],
    ...
  }
}
```

### 2. Xem permissions của role cụ thể
```
GET /api/roles/{roleId}/permissions
Authorization: Bearer {token}  
Permission: role:view

Response:
{
  "role": {
    "id": 1,
    "name": "admin", 
    "displayName": "Quản trị viên",
    "permissions": ["member:view", "member:create", ...]
  },
  "availablePermissions": [...],
  "permissionsCount": 57
}
```

### 3. Cập nhật permissions của role
```
PUT /api/roles/{roleId}/permissions
Authorization: Bearer {token}
Permission: role:edit

Body:
{
  "permissions": ["member:view", "member:create", "mission:view"]
}

Response:
{
  "message": "Cập nhật permissions thành công",
  "role": {...},
  "changedPermissions": {
    "added": ["mission:view"],
    "removed": ["mission:create"]
  }
}
```

## Phân tích Permissions Hiện tại

### Admin Role (57 permissions)
- member:* (4 permissions)
- department:* (4 permissions) 
- division:* (4 permissions)
- position:* (4 permissions)
- academic_year:* (5 permissions)
- user:* (4 permissions)
- role:* (4 permissions)
- achievement:* (5 permissions)
- beepoint:* (4 permissions)
- mission:* (7 permissions)
- api_key:* (4 permissions)
- settings:* (2 permissions)
- upload:* (3 permissions)
- system:admin (1 permission)
- stats:view (1 permission)

### Manager Role (21 permissions)
- member:view
- department:view
- division:view  
- position:view
- academic_year:view
- achievement:view, achievement:award
- beepoint:view, beepoint:manage
- mission:view, mission:assign, mission:review
- upload:view
- stats:view

### Member Role (7 permissions)
- member:view (chỉ xem thông tin của mình)
- achievement:view
- beepoint:view
- mission:view, mission:submit
- upload:view
- stats:view

## Bảo mật

### 1. System Roles Protection
- Roles với `isSystem: true` chỉ được sửa bởi `system:admin`
- Ngăn việc xóa hoặc sửa đổi roles quan trọng

### 2. Permission Validation
- Tất cả permissions được validate với `PERMISSIONS` constants
- Từ chối permissions không tồn tại

### 3. Fresh Data Loading
- Authentication middleware luôn lấy fresh user + role data
- Đảm bảo permissions luôn up-to-date

## Ví dụ Sử dụng

### Kiểm tra permission trong route
```javascript
app.get("/api/members", 
  authenticate, 
  authorize(PERMISSIONS.MEMBER_VIEW), 
  async (req, res) => {
    // req.user.permissions chứa permissions từ role
    // Đã được kiểm tra bởi authorize middleware
  }
);
```

### Kiểm tra multiple permissions
```javascript
app.post("/api/achievements/award",
  authenticate,
  authorize([PERMISSIONS.ACHIEVEMENT_AWARD, PERMISSIONS.BEEPOINT_AWARD]),
  async (req, res) => {
    // User cần ít nhất 1 trong 2 permissions
  }
);
```

## Kết luận

Hệ thống permission được thiết kế với:
- **Single Source of Truth**: Roles table
- **Dynamic Management**: API endpoints để quản lý
- **Security First**: Validation và protection mechanisms
- **Scalability**: Dễ dàng thêm permissions mới
- **Consistency**: Luôn sync giữa database và runtime