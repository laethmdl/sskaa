import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import StatCard from "@/components/dashboard/stat-card";
import EmployeeTable from "@/components/dashboard/employee-table";
import NotificationItem from "@/components/dashboard/notification-item";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUp, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const DashboardPage = () => {
  const { user } = useAuth();
  const { formatDate } = useLocale();
  const [_, navigate] = useLocation();
  
  // Fetch data for dashboard
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: allowancePromotions, isLoading: isLoadingAllowancePromotions } = useQuery({
    queryKey: ["/api/allowance-promotions"],
  });

  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const handleDismissNotification = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/notifications/${id}/read`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest("PUT", "/api/notifications/mark-all-read", {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Filter data for dashboard cards
  const pendingAllowances = Array.isArray(allowancePromotions) 
    ? allowancePromotions.filter(ap => ap.type === "allowance" && ap.status === "pending") 
    : [];

  const pendingPromotions = Array.isArray(allowancePromotions)
    ? allowancePromotions.filter(ap => ap.type === "promotion" && ap.status === "pending")
    : [];

  // Calculate retirement notifications
  const retirementNotifications = Array.isArray(notifications)
    ? notifications.filter(n => n.type === "retirement")
    : [];

  // Calculate urgent notifications
  const urgentNotifications = Array.isArray(notifications)
    ? notifications.filter(n => n.type === "warning")
    : [];

  // Format data for employee tables
  const allowanceTableItems = pendingAllowances.slice(0, 3).map((ap: any) => {
    const employee = Array.isArray(employees) ? employees.find((e: any) => e.id === ap.employeeId) : undefined;
    return {
      id: ap.id,
      name: employee?.fullName || "غير معروف",
      position: "موظف",
      dueDate: ap.dueDate,
      status: "علاوة سنوية",
      statusColor: "green",
      onView: (id: number) => console.log("View allowance", id),
      onProcess: (id: number) => navigate(`/allowance-order/${id}`)
    };
  });

  const promotionTableItems = pendingPromotions.slice(0, 3).map((ap: any) => {
    const employee = Array.isArray(employees) ? employees.find((e: any) => e.id === ap.employeeId) : undefined;
    return {
      id: ap.id,
      name: employee?.fullName || "غير معروف",
      position: "موظف",
      dueDate: ap.dueDate,
      status: `الدرجة ${employee?.currentGrade || ""}`,
      statusColor: "yellow",
      onView: (id: number) => console.log("View promotion", id),
      onProcess: (id: number) => navigate(`/allowance-order/${id}`)
    };
  });

  const isLoading = isLoadingEmployees || isLoadingAllowancePromotions || isLoadingNotifications;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">لوحة المعلومات</h1>
        <p className="mt-1 text-sm text-gray-600">
          مرحباً بك {user?.name} في نظام العلاوات والترفيعات
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="العلاوات المستحقة"
          value={pendingAllowances.length}
          icon={<ArrowUp className="h-5 w-5 text-primary-600" />}
          linkHref="/reports?type=allowances"
          linkText="عرض التفاصيل"
          colorClass="bg-primary-100"
        />
        
        <StatCard
          title="الترفيعات المستحقة"
          value={pendingPromotions.length}
          icon={<ArrowUpRight className="h-5 w-5 text-green-600" />}
          linkHref="/reports?type=promotions"
          linkText="عرض التفاصيل"
          colorClass="bg-green-100"
        />
        
        <StatCard
          title="إشعارات التقاعد"
          value={retirementNotifications.length}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          linkHref="/reports?type=retirement"
          linkText="عرض التفاصيل"
          colorClass="bg-yellow-100"
        />
        
        <StatCard
          title="التنبيهات العاجلة"
          value={urgentNotifications.length}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          linkHref="/notifications"
          linkText="عرض التفاصيل"
          colorClass="bg-red-100"
        />
      </div>
      
      {/* Upcoming Allowances and Promotions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EmployeeTable
          title="العلاوات المستحقة القادمة"
          items={allowanceTableItems}
          linkHref="/reports?type=allowances"
          linkText="عرض الكل"
          itemType="allowance"
        />
        
        <EmployeeTable
          title="الترفيعات المستحقة القادمة"
          items={promotionTableItems}
          linkHref="/reports?type=promotions"
          linkText="عرض الكل"
          itemType="promotion"
        />
      </div>
      
      {/* Recent Notifications */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">أحدث التنبيهات</h3>
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            تعليم الكل كمقروءة
          </Button>
        </div>
        <div className="p-4">
          {Array.isArray(notifications) && notifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notifications.slice(0, 3).map((notification: any) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={handleDismissNotification}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-gray-500">
              لا توجد تنبيهات جديدة
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
          <Link
            href="/notifications"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            عرض جميع التنبيهات <span className="mr-1">&#8592;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
