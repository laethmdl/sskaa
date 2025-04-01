import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { X, Home, Users, Briefcase, Award, BarChart2, Bell, UserCog, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Get unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  const unreadCount = notificationsData?.count || 0;

  const navItems = [
    { path: "/", label: "الرئيسية", icon: <Home className="ml-3 h-5 w-5" /> },
    { path: "/employees", label: "الموظفين", icon: <Users className="ml-3 h-5 w-5" /> },
    { path: "/definitions", label: "الملفات التعريفية", icon: <Briefcase className="ml-3 h-5 w-5" /> },
    { path: "/appreciation", label: "التشكرات والعقوبات", icon: <Award className="ml-3 h-5 w-5" /> },
    { path: "/reports", label: "التقارير", icon: <BarChart2 className="ml-3 h-5 w-5" /> },
    { 
      path: "/notifications", 
      label: "التنبيهات", 
      icon: <Bell className="ml-3 h-5 w-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { path: "/users", label: "المستخدمين", icon: <UserCog className="ml-3 h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div
      id="sidebar"
      className={cn(
        "fixed inset-y-0 right-0 bg-gray-800 w-64 shadow-lg transition-transform duration-300 z-30 transform",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between px-4 py-5 bg-gray-900">
        <div className="flex items-center space-x-2 space-x-reverse">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-white font-medium text-lg">نظام العلاوات</span>
        </div>
        <button
          id="toggle-sidebar"
          className="text-gray-300 hover:text-white lg:hidden"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="px-2 py-4">
        {user && (
          <div className="mb-4">
            <div className="flex items-center px-3 py-2">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="mr-3">
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="text-xs text-gray-300">{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</div>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-md",
                location === item.path
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-1 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 w-full px-4 py-4">
        <button
          onClick={handleLogout}
          className="flex items-center text-gray-300 hover:text-white"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="ml-2 h-5 w-5" />
          <span>{logoutMutation.isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
