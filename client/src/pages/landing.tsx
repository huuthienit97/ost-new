import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, BookOpen } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CLB Sáng Tạo</h1>
                <p className="text-sm text-gray-600">Hệ thống quản lý thành viên</p>
              </div>
            </div>
            <Button asChild>
              <a href="/login">Đăng nhập</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Chào mừng đến với CLB Sáng Tạo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hệ thống quản lý thành viên hiện đại, giúp tổ chức và quản lý hoạt động câu lạc bộ một cách hiệu quả
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Quản lý thành viên</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Quản lý thông tin thành viên, phân loại theo ban và chức vụ một cách dễ dàng
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Phân quyền bảo mật</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Hệ thống phân quyền chi tiết, đảm bảo bảo mật và kiểm soát truy cập
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Giao diện thân thiện</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Thiết kế hiện đại, dễ sử dụng trên mọi thiết bị
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Bắt đầu sử dụng ngay hôm nay
              </h3>
              <p className="text-gray-600 mb-6">
                Đăng nhập để truy cập vào hệ thống quản lý thành viên
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="/login">Đăng nhập</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="/api-docs" target="_blank">Xem API Docs</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 CLB Sáng Tạo. Hệ thống quản lý thành viên.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}