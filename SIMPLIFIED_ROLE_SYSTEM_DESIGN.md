# Thiết Kế Hệ Thống Phân Quyền Đơn Giản

## Hệ Thống 3 Quyền Mới

### 1. ADMIN (Quản trị viên)
**Mô tả**: Có toàn quyền quản lý hệ thống
**Quyền hạn**:
- Quản lý thành viên (tạo, sửa, xóa)
- Quản lý ban/chức vụ
- Quản lý người dùng và phân quyền
- Quản lý cấu hình hệ thống
- Quản lý nhiệm vụ (tạo, giao, đánh giá)
- Quản lý thành tích và BeePoint
- Xem tất cả thống kê
- Upload/quản lý file

### 2. MANAGER (Quản lý)
**Mô tả**: Quản lý hoạt động hàng ngày của câu lạc bộ
**Quyền hạn**:
- Xem và chỉnh sửa thông tin thành viên
- Giao nhiệm vụ cho thành viên
- Đánh giá và phê duyệt nhiệm vụ
- Trao thành tích cho thành viên
- Xem thống kê cơ bản
- Upload file

### 3. MEMBER (Thành viên)
**Mô tả**: Thành viên cơ bản của câu lạc bộ
**Quyền hạn**:
- Xem thông tin cá nhân và chỉnh sửa
- Nhận và hoàn thành nhiệm vụ được giao
- Xem BeePoint và thành tích của mình
- Xem thống kê công khai

## So Sánh Với Hệ Thống Hiện Tại

### Hiện tại (5 roles):
- super_admin: 38 quyền chi tiết
- admin: 32 quyền chi tiết  
- manager: 6 quyền chi tiết
- member: 2 quyền chi tiết
- viewer: 2 quyền chi tiết

### Mới (3 roles):
- ADMIN: Tất cả quyền
- MANAGER: Quyền quản lý hoạt động
- MEMBER: Quyền cơ bản

## Kế Hoạch Thực Hiện

### Bước 1: Tạo roles mới
- Xóa 5 roles cũ
- Tạo 3 roles mới với permission đơn giản

### Bước 2: Cập nhật hệ thống auth
- Đơn giản hóa middleware phân quyền
- Sử dụng 3 levels: admin, manager, member

### Bước 3: Migration dữ liệu user
- super_admin + admin → ADMIN
- manager → MANAGER  
- member + viewer → MEMBER

### Bước 4: Cập nhật UI
- Đơn giản hóa dropdown chọn role
- Cập nhật hiển thị permissions