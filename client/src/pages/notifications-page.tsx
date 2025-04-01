import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import { Badge } from "@/components/ui/badge";
import { Loader2, BellOff, Bell, Check, Search, Calendar } from "lucide-react";
import NotificationItem from "@/components/dashboard/notification-item";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NotificationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState("all");
  const [isTestNotificationSending, setIsTestNotificationSending] = useState(false);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "تم تعليم جميع الإشعارات كمقروءة",
      });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter notifications based on active tab and filters
  const filteredNotifications = notifications?.filter(notification => {
    // Filter by tab
    if (activeTab === "unread" && notification.isRead) return false;
    if (activeTab === "read" && !notification.isRead) return false;
    
    // Filter by search term
    if (searchTerm && 
        !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    const notificationDate = new Date(notification.createdAt);
    if (startDate && notificationDate < startDate) return false;
    if (endDate) {
      // Add one day to include the end date fully
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      if (notificationDate >= adjustedEndDate) return false;
    }
    
    // Filter by type
    if (typeFilter !== "all" && notification.type !== typeFilter) return false;
    
    return true;
  }) || [];

  // Handle dismissing a notification
  const handleDismissNotification = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/notifications/${id}/read`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  // Send test notification
  const handleSendTestNotification = async () => {
    try {
      setIsTestNotificationSending(true);
      await apiRequest("POST", "/api/protected/send-test-notification", {});
      
      // Refresh notifications data
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      
      toast({
        title: "تم إرسال إشعار تجريبي",
        description: "تم إنشاء إشعار تجريبي بنجاح",
      });
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "فشل إرسال الإشعار التجريبي",
        variant: "destructive",
      });
    } finally {
      setIsTestNotificationSending(false);
    }
  };
  
  // Get counts for tab badges
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const readCount = notifications?.filter(n => n.isRead).length || 0;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">التنبيهات</h1>
          <p className="mt-1 text-sm text-gray-600">عرض وإدارة جميع التنبيهات والإشعارات</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {/* زر إنشاء إشعار تجريبي */}
          <Button 
            onClick={handleSendTestNotification}
            disabled={isTestNotificationSending}
            variant="outline"
            className="flex items-center"
          >
            {isTestNotificationSending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Bell className="ml-2 h-4 w-4" />
            )}
            إنشاء إشعار تجريبي
          </Button>
          
          {/* زر تعليم الكل كمقروءة */}
          <Button 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            className="flex items-center"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="ml-2 h-4 w-4" />
            )}
            تعليم الكل كمقروءة
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center mb-6">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              الكل
              <Badge className="mr-1 bg-primary text-white absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {notifications?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              غير مقروءة
              {unreadCount > 0 && (
                <Badge className="mr-1 bg-red-500 text-white absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">
              مقروءة
              <Badge className="mr-1 bg-green-500 text-white absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {readCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="allowance">علاوات</SelectItem>
                    <SelectItem value="promotion">ترفيعات</SelectItem>
                    <SelectItem value="retirement">تقاعد</SelectItem>
                    <SelectItem value="warning">تحذيرات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                <DatePickerAr
                  date={startDate}
                  setDate={setStartDate}
                  placeholder="اختر تاريخ البداية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                <DatePickerAr
                  date={endDate}
                  setDate={setEndDate}
                  placeholder="اختر تاريخ النهاية"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                    placeholder="بحث في العنوان أو المحتوى"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>جميع التنبيهات</CardTitle>
              <CardDescription>
                عرض جميع التنبيهات والإشعارات ({filteredNotifications.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDismiss={handleDismissNotification}
                    />
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <BellOff className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تنبيهات</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    لا توجد تنبيهات تطابق معايير البحث الحالية.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread">
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات غير المقروءة</CardTitle>
              <CardDescription>
                عرض التنبيهات والإشعارات التي لم تتم قراءتها بعد ({filteredNotifications.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDismiss={handleDismissNotification}
                    />
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <Check className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تنبيهات غير مقروءة</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    لقد قمت بقراءة جميع التنبيهات.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read">
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات المقروءة</CardTitle>
              <CardDescription>
                عرض التنبيهات والإشعارات التي تمت قراءتها ({filteredNotifications.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDismiss={handleDismissNotification}
                    />
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تنبيهات مقروءة</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    لم تقم بقراءة أي تنبيهات بعد أو لا توجد تنبيهات تطابق معايير البحث.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;
