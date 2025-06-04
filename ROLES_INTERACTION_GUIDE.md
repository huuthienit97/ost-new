# Hướng dẫn Phân quyền và Tương tác API

## Tổng quan Hệ thống Phân quyền

Hệ thống quản lý câu lạc bộ sử dụng phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) để kiểm soát quyền truy cập các API.

## Cấu trúc Phân quyền

### 1. Vai trò (Roles)
```
🔴 SUPER_ADMIN - Quản trị viên tối cao
🟡 ADMIN       - Quản trị viên
🔵 MANAGER     - Quản lý
🟢 MEMBER      - Thành viên
⚪ VIEWER      - Người xem
```

### 2. Quyền hạn (Permissions)
```
# Quản lý người dùng
users:view     - Xem danh sách người dùng
users:create   - Tạo người dùng mới
users:edit     - Chỉnh sửa thông tin người dùng
users:delete   - Xóa người dùng

# Quản lý thành viên
members:view   - Xem danh sách thành viên
members:create - Tạo thành viên mới
members:edit   - Chỉnh sửa thông tin thành viên
members:delete - Xóa thành viên

# Quản lý vai trò
roles:view     - Xem danh sách vai trò
roles:create   - Tạo vai trò mới
roles:edit     - Chỉnh sửa vai trò
roles:delete   - Xóa vai trò

# Quản lý hệ thống
system:admin   - Quản trị toàn hệ thống
stats:view     - Xem thống kê
settings:edit  - Chỉnh sửa cài đặt

# Quản lý thành tích
achievements:view   - Xem thành tích
achievements:create - Tạo thành tích
achievements:award  - Trao thành tích

# Quản lý điểm BeePoints
beepoints:view      - Xem điểm
beepoints:manage    - Quản lý điểm
beepoints:transfer  - Chuyển điểm
```

## Cách Roles Can thiệp vào API

### 1. Middleware Xác thực
```javascript
// server/auth.ts
export const authenticate = (req, res, next) => {
  // Kiểm tra JWT token
  // Lấy thông tin user và role từ token
  // Gắn thông tin vào req.user
}

export const authorize = (requiredPermission) => {
  return (req, res, next) => {
    // Kiểm tra xem user có permission được yêu cầu không
    // Dựa trên role của user
  }
}
```

### 2. Áp dụng Phân quyền trên Routes

#### API Người dùng
```javascript
// 🔴 Chỉ SUPER_ADMIN mới có thể quản lý roles
app.get('/api/admin/roles', authenticate, authorize('roles:view'))
app.post('/api/admin/roles', authenticate, authorize('roles:create'))

// 🟡 ADMIN trở lên có thể quản lý users
app.get('/api/admin/users', authenticate, authorize('users:view'))
app.post('/api/admin/users', authenticate, authorize('users:create'))
```

#### API Thành viên
```javascript
// 🔵 USER trở lên có thể xem members
app.get('/api/members', authenticate, authorize('members:view'))

// 🟡 ADMIN trở lên có thể tạo/sửa/xóa members
app.post('/api/members', authenticate, authorize('members:create'))
app.put('/api/members/:id', authenticate, authorize('members:edit'))
app.delete('/api/members/:id', authenticate, authorize('members:delete'))
```

#### API Thống kê
```javascript
// 🔵 USER trở lên có thể xem stats cơ bản
app.get('/api/stats', authenticate, authorize('stats:view'))

// 🟡 ADMIN trở lên có thể xem stats chi tiết
app.get('/api/admin/stats/detailed', authenticate, authorize('system:admin'))
```

#### API Thành tích
```javascript
// 🟢 Tất cả có thể xem achievements
app.get('/api/achievements', authenticate, authorize('achievements:view'))

// 🟡 ADMIN trở lên có thể tạo achievements
app.post('/api/achievements', authenticate, authorize('achievements:create'))

// 🔵 MANAGER trở lên có thể trao achievements
app.post('/api/achievements/award', authenticate, authorize('achievements:award'))
```

### 3. Phân quyền Dữ liệu (Data-level Authorization)

#### Lọc dữ liệu theo Role
```javascript
// Trong controller
const getMembers = async (req, res) => {
  const userRole = req.user.role;
  
  if (userRole === 'member') {
    // Chỉ xem thông tin của chính mình
    return await getMembersByUserId(req.user.id);
  }
  
  if (userRole === 'manager') {
    // Xem thành viên trong department của mình
    return await getMembersByDepartment(req.user.departmentId);
  }
  
  if (userRole === 'admin' || userRole === 'super_admin') {
    // Xem tất cả thành viên
    return await getAllMembers();
  }
}
```

### 4. API Keys và External Access

#### Phân quyền cho API Keys
```javascript
// API Keys có permissions riêng
const apiKeyPermissions = [
  'members:view',
  'achievements:view', 
  'stats:view'
];

// Kiểm tra permission cho API Key
app.get('/api/external/members', apiKeyAuth, requireApiPermission('members:view'))
```

## Ma trận Phân quyền Chi tiết

| API Endpoint | 🔴 SUPER_ADMIN | 🟡 ADMIN | 🔵 MANAGER | 🟢 MEMBER | ⚪ VIEWER |
|--------------|----------------|----------|------------|-----------|-----------|
| `/api/admin/roles/*` | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| `/api/admin/users/*` | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| `/api/members` (GET) | ✅ All | ✅ All | ✅ Department | ✅ Self | ✅ Public |
| `/api/members` (POST/PUT/DELETE) | ✅ | ✅ | ✅ Department | ❌ | ❌ |
| `/api/achievements` (GET) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/achievements` (POST) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/api/achievements/award` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/api/stats` | ✅ Full | ✅ Full | ✅ Department | ✅ Basic | ✅ Public |
| `/api/beepoints/*` | ✅ Full | ✅ Full | ✅ Department | ✅ Self | ❌ |

## Cách Kiểm tra Phân quyền

### 1. Trong Frontend
```javascript
// hooks/useAuth.js
const { user } = useAuth();

// Kiểm tra permission
const canCreateMember = user.permissions.includes('members:create');
const canViewStats = user.permissions.includes('stats:view');

// Hiển thị UI theo permission
{canCreateMember && <AddMemberButton />}
{canViewStats && <StatsComponent />}
```

### 2. Trong Backend Controller
```javascript
const hasPermission = (user, permission) => {
  return user.role.permissions.includes(permission);
};

// Sử dụng trong controller
if (!hasPermission(req.user, 'members:edit')) {
  return res.status(403).json({ message: 'Không có quyền truy cập' });
}
```

### 3. Debug Phân quyền
```javascript
// Thêm middleware debug
app.use('/api/*', (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log(`User: ${req.user?.username}, Role: ${req.user?.role?.name}`);
  console.log(`Permissions: ${req.user?.role?.permissions}`);
  next();
});
```

## Best Practices

### 1. Nguyên tắc Least Privilege
- Chỉ cấp quyền tối thiểu cần thiết
- Định kỳ review và revoke permissions không dùng

### 2. Separation of Concerns
- Role quản lý identity (ai là ai)
- Permission quản lý authorization (ai có thể làm gì)

### 3. Hierarchical Roles
```
SUPER_ADMIN inherits all permissions
ADMIN inherits MANAGER + USER permissions  
MANAGER inherits USER permissions
USER inherits VIEWER permissions
```

### 4. Audit Trail
- Log tất cả actions có sensitive permissions
- Track role changes và permission grants

## Troubleshooting

### Lỗi 403 Forbidden
1. Kiểm tra user đã đăng nhập chưa
2. Kiểm tra role của user
3. Kiểm tra permission required cho endpoint
4. Kiểm tra middleware authenticate/authorize

### Permission không hoạt động
1. Kiểm tra JWT token có đúng không
2. Kiểm tra role permissions trong database
3. Kiểm tra cache role data (nếu có)
4. Restart application sau khi thay đổi permissions