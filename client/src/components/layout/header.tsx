import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Menu, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSidebarOpen: () => void;
}

const Header = ({ onSidebarOpen }: HeaderProps) => {
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Get unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  const unreadCount = notificationsData?.count || 0;

  return (
    <div className="bg-white shadow-sm z-20 sticky top-0">
      <div className="flex justify-between items-center h-16 px-4 lg:px-8">
        <button
          id="open-sidebar"
          className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          onClick={onSidebarOpen}
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-4 space-x-reverse">
          <Link href="/notifications">
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500"></span>
              )}
            </button>
          </Link>

          {user && (
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger className="flex items-center space-x-2 space-x-reverse">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {user.name?.charAt(0) || "U"}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {user.name}
                </span>
                <ChevronDown className="text-xs text-gray-500 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer">
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending
                    ? "جاري تسجيل الخروج..."
                    : "تسجيل الخروج"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
