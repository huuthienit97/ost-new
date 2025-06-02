import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/pages/landing";
import HomePage from "@/pages/home";
import MembersPage from "@/pages/members";
import AdminPage from "@/pages/admin";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/login";
import ChangePasswordPage from "@/pages/change-password";
import ProfilePage from "@/pages/profile";
import AchievementsPage from "@/pages/achievements";
import ApiKeysPage from "@/pages/api-keys";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Check if user must change password (first time login)
  if (isAuthenticated && user?.mustChangePassword) {
    return <ChangePasswordPage />;
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      {isAuthenticated ? (
        <>
          <Route path="/" component={HomePage} />
          <Route path="/members" component={MembersPage} />
          <Route path="/roles" component={AdminPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/achievements" component={AchievementsPage} />
          <Route path="/api-keys" component={ApiKeysPage} />
          <Route path="/change-password" component={ChangePasswordPage} />
          <Route component={HomePage} />
        </>
      ) : (
        <>
          <Route path="/" component={LandingPage} />
          <Route component={LandingPage} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
