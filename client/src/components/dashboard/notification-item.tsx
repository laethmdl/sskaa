import { useLocale } from "@/hooks/use-locale";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Notification } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface NotificationIconProps {
  type: string;
}

const NotificationIcon = ({ type }: NotificationIconProps) => {
  const getIconByType = () => {
    switch (type) {
      case "allowance":
        return (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case "promotion":
        return (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case "retirement":
        return (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case "warning":
      default:
        return (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
    }
  };

  return getIconByType();
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss?: (id: number) => void;
}

const NotificationItem = ({ notification, onDismiss }: NotificationItemProps) => {
  const { formatDate } = useLocale();
  
  const handleMarkAsRead = async () => {
    try {
      await apiRequest("PUT", `/api/notifications/${notification.id}/read`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Helper function to get relative time
  const getRelativeTime = (date: string | Date) => {
    if (!date) return "غير معروف";
    
    // تحويل النص إلى كائن تاريخ إذا كان النوع نص
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "تاريخ غير صالح";
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else if (diffInDays < 7) {
      return `منذ ${diffInDays} يوم`;
    } else {
      return formatDate(dateObj);
    }
  };

  // Get badge color based on notification type
  const getBadgeColor = () => {
    switch (notification.type) {
      case "allowance":
        return "blue";
      case "promotion":
        return "green";
      case "retirement":
        return "yellow";
      case "warning":
      default:
        return "red";
    }
  };

  return (
    <li className="py-4">
      <div className="flex space-x-3 space-x-reverse">
        <div className="flex-shrink-0">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-500">{notification.message}</p>
          <div className="mt-2 flex items-center">
            <p className="text-xs text-gray-500">
              {getRelativeTime(notification.createdAt)}
            </p>
            <Badge
              variant="outline"
              className={`mr-2 bg-${getBadgeColor()}-100 text-${getBadgeColor()}-800`}
            >
              {notification.type === "allowance"
                ? "علاوة"
                : notification.type === "promotion"
                ? "ترفيع"
                : notification.type === "retirement"
                ? "تقاعد"
                : "عاجل"}
            </Badge>
          </div>
        </div>
        <div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => {
              handleMarkAsRead();
              if (onDismiss) {
                onDismiss(notification.id);
              }
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </li>
  );
};

export default NotificationItem;
