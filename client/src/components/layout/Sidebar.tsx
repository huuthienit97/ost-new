import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  Users, 
  Target, 
  Award, 
  ShoppingCart, 
  Settings, 
  Shield, 
  UserCog,
  Calendar,
  Building,
  Crown,
  Key,
  BarChart3,
  CheckCircle,
  PlusCircle,
  Eye,
  FileText,
  Coins,
  Menu,
  X,
  LogOut,
  User,
  Package
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  permission?: string;
  adminOnly?: boolean;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, hasPermission, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Fetch user's BeePoints separately
  const { data: beePoints } = useQuery({
    queryKey: ["/api/bee-points/me"],
    enabled: !!user,
  });

  const mainNavItems: NavItem[] = [
    {
      title: "Trang chủ",
      href: "/",
      icon: Home,
    },
    {
      title: "Thành viên",
      href: "/members",
      icon: Users,
    },
    {
      title: "Nhiệm vụ",
      href: "/missions",
      icon: Target,
    },
    {
      title: "Nhiệm vụ của tôi",
      href: "/my-missions",
      icon: Eye,
    },
    {
      title: "Thành tích",
      href: "/achievements",
      icon: Award,
    },
    {
      title: "Cửa hàng",
      href: "/shop",
      icon: ShoppingCart,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      title: "Quản lý nhiệm vụ",
      href: "/mission-admin",
      icon: PlusCircle,
      permission: "mission:create"
    },
    {
      title: "Duyệt nhiệm vụ",
      href: "/mission-completion",
      icon: CheckCircle,
      permission: "mission:review"
    },
    {
      title: "Quản lý cửa hàng",
      href: "/shop-admin",
      icon: ShoppingCart,
      permission: "shop:manage"
    },
    {
      title: "Quản lý sản phẩm",
      href: "/shop-products",
      icon: Package,
      adminOnly: true
    },
    {
      title: "Quản lý đơn hàng",
      href: "/shop-orders",
      icon: FileText,
      adminOnly: true
    },
    {
      title: "Quản lý tài khoản",
      href: "/user-management",
      icon: UserCog,
      adminOnly: true
    },
    {
      title: "Quản trị hệ thống",
      href: "/admin",
      icon: Shield,
      adminOnly: true
    },
  ];

  const systemNavItems: NavItem[] = [
    {
      title: "Năm học",
      href: "/academic-years",
      icon: Calendar,
      permission: "academic_year:view"
    },
    {
      title: "Phân ban",
      href: "/divisions",
      icon: Building,
      permission: "division:view"
    },
    {
      title: "Chức vụ",
      href: "/positions",
      icon: Crown,
      permission: "position:view"
    },
    {
      title: "API Keys",
      href: "/api-keys",
      icon: Key,
      permission: "api_key:view"
    },
    {
      title: "Cài đặt",
      href: "/settings",
      icon: Settings,
      permission: "settings:view"
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const shouldShowItem = (item: NavItem) => {
    if (item.adminOnly) {
      return user?.role?.name === 'admin' || user?.role?.name === 'super_admin' || user?.role?.displayName === 'Admin';
    }
    if (item.permission) {
      // Super admin should have all permissions
      if (user?.role?.name === 'super_admin') return true;
      return hasPermission(item.permission);
    }
    return true;
  };

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => {
    const visibleItems = items.filter(shouldShowItem);
    
    if (visibleItems.length === 0) return null;

    return (
      <div className="px-3 py-2">
        {!collapsed && (
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-muted-foreground">
            {title}
          </h2>
        )}
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-12",
                  collapsed ? "px-2" : "px-4",
                  isActive(item.href) && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex h-full flex-col border-r bg-background", className)}>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Users className="text-white text-sm" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">CLB Sáng Tạo</h1>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Info */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role?.displayName}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-3 flex space-x-2">
            <Link href="/profile">
              <Button variant="outline" size="sm" className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Hồ sơ
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex-1 space-y-2 py-4">
          <NavSection title="Chính" items={mainNavItems} />
          <NavSection title="Quản lý" items={adminNavItems} />
          <NavSection title="Hệ thống" items={systemNavItems} />
        </nav>
      </ScrollArea>

      {/* BeePoints Display */}
      {!collapsed && user && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">BeePoints</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {beePoints?.currentPoints || 0}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}