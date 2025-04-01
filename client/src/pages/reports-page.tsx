import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "wouter-search";
import { useLocation } from "wouter";
import { useLocale } from "@/hooks/use-locale";
import { useToast } from "@/hooks/use-toast";
import ExportData from "@/components/export-data";
import { FileDown } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import { Loader2, Calendar, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ReportsPage = () => {
  const { formatDate } = useLocale();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("allowances");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Set active tab based on URL query param
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "promotions" || type === "retirement") {
      setActiveTab(type);
    } else {
      setActiveTab("allowances");
    }
  }, [searchParams]);

  // تعريف أنواع البيانات
  type Employee = {
    id: number;
    employeeNumber: string;
    fullName: string;
    firstName: string;
    lastName: string;
    gender: string;
    birthDate: string;
    nationalId: string;
    hireDate: string;
    retirementDate?: string;
    email?: string;
    phone?: string;
    address?: string;
    currentGrade?: number;
    jobTitleId?: number;
    workplaceId?: number;
    educationalQualificationId?: number;
  };

  type AllowancePromotion = {
    id: number;
    employeeId: number;
    type: string;
    dueDate: string;
    status: string;
    notes?: string;
    processedAt?: string;
    processedBy?: number;
  };

  // Fetch data
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: allowancePromotions = [], isLoading: isLoadingAllowancePromotions } = useQuery<AllowancePromotion[]>({
    queryKey: ["/api/allowance-promotions"],
  });

  // Helper function to get employee name
  const getEmployeeName = (employeeId: number) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee?.fullName || "غير معروف";
  };

  // Helper function to get employee details
  const getEmployeeDetails = (employeeId: number) => {
    const employee = employees?.find(e => e.id === employeeId);
    return employee;
  };

  // Filter data based on active tab and filters
  const filteredData = allowancePromotions?.filter(ap => {
    // Filter by type (tab)
    const matchesType = activeTab === "allowances" 
      ? ap.type === "allowance" 
      : activeTab === "promotions" 
        ? ap.type === "promotion"
        : true; // retirement tab handles this differently

    // Filter by date range
    const apDate = new Date(ap.dueDate);
    const matchesDateRange = (!startDate || apDate >= startDate) && 
                             (!endDate || apDate <= endDate);

    // Filter by status
    const matchesStatus = statusFilter === "all" || ap.status === statusFilter;

    // Filter by search term (employee name)
    const employee = employees?.find(e => e.id === ap.employeeId);
    const matchesSearch = !searchTerm || 
      (employee && employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesDateRange && matchesStatus && matchesSearch;
  }) || [];

  // Filter retirement data (employees approaching retirement)
  const retirementData = employees?.filter(employee => {
    if (!employee.retirementDate) return false;

    const retirementDate = new Date(employee.retirementDate);
    const today = new Date();
    const diffTime = retirementDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Filter employees retiring within the next 180 days
    const isApproachingRetirement = diffDays >= 0 && diffDays <= 180;

    // Apply search filter
    const matchesSearch = !searchTerm || 
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    return isApproachingRetirement && matchesSearch;
  }).sort((a, b) => {
    // Sort by retirement date (ascending)
    const dateA = new Date(a.retirementDate!).getTime();
    const dateB = new Date(b.retirementDate!).getTime();
    return dateA - dateB;
  }) || [];

  // Prepare chart data
  const prepareChartData = () => {
    const data: any[] = [];
    const now = new Date();

    // Create data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('ar-IQ', { month: 'long' });

      const allowances = allowancePromotions?.filter(ap => {
        const apDate = new Date(ap.dueDate);
        return ap.type === 'allowance' && 
               apDate.getMonth() === date.getMonth() && 
               apDate.getFullYear() === date.getFullYear();
      }).length || 0;

      const promotions = allowancePromotions?.filter(ap => {
        const apDate = new Date(ap.dueDate);
        return ap.type === 'promotion' && 
               apDate.getMonth() === date.getMonth() && 
               apDate.getFullYear() === date.getFullYear();
      }).length || 0;

      data.push({
        name: monthName,
        allowances,
        promotions
      });
    }

    return data;
  };

  // Prepare status distribution data
  const prepareStatusData = () => {
    const statuses = ['pending', 'completed', 'rejected'];
    const statusLabels = {
      pending: 'معلق',
      completed: 'مكتمل',
      rejected: 'مرفوض'
    };

    return statuses.map(status => {
      const count = activeTab === 'allowances'
        ? allowancePromotions?.filter(ap => ap.type === 'allowance' && ap.status === status).length || 0
        : allowancePromotions?.filter(ap => ap.type === 'promotion' && ap.status === status).length || 0;

      return {
        name: statusLabels[status as keyof typeof statusLabels],
        value: count
      };
    }).filter(item => item.value > 0);
  };

  // Status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Translate status to Arabic
  const translateStatus = (status: string) => {
    switch (status) {
      case "pending": return "معلق";
      case "completed": return "مكتمل";
      case "rejected": return "مرفوض";
      default: return status;
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    let data: any[] = [];
    let filename = "";

    if (activeTab === "allowances") {
      data = filteredData.map(ap => ({
        الموظف: getEmployeeName(ap.employeeId),
        تاريخ_الاستحقاق: formatDate(ap.dueDate),
        الحالة: translateStatus(ap.status),
        ملاحظات: ap.notes || ""
      }));
      filename = "تقرير_العلاوات.csv";
    } else if (activeTab === "promotions") {
      data = filteredData.map(ap => ({
        الموظف: getEmployeeName(ap.employeeId),
        تاريخ_الاستحقاق: formatDate(ap.dueDate),
        الحالة: translateStatus(ap.status),
        ملاحظات: ap.notes || ""
      }));
      filename = "تقرير_الترفيعات.csv";
    } else {
      data = retirementData.map(employee => ({
        الموظف: employee.fullName,
        الرقم_الوظيفي: employee.employeeNumber,
        تاريخ_التقاعد: formatDate(employee.retirementDate),
      }));
      filename = "تقرير_التقاعد.csv";
    }

    if (data.length === 0) return;

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ""}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = prepareChartData();
  const statusData = prepareStatusData();
  const pieColors = ['#FFBB28', '#00C49F', '#FF8042'];

  const isLoading = isLoadingEmployees || isLoadingAllowancePromotions;

  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleProcess = (itemId: number) => {
    const item = filteredData.find((i: any) => i.id === itemId);
    if (!item) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لم يتم العثور على العلاوة/الترقية المطلوبة"
      });
      return;
    }
    
    if (item.type === "allowance") {
      setLocation(`/allowance-order/${itemId}`);
    } else {
      // Handle promotion processing
      setLocation(`/promotion-order/${itemId}`);
    }
  };


  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">التقارير</h1>
        <p className="mt-1 text-sm text-gray-600">عرض وتحليل بيانات العلاوات والترفيعات والتقاعد</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="allowances">العلاوات</TabsTrigger>
            <TabsTrigger value="promotions">الترفيعات</TabsTrigger>
            <TabsTrigger value="retirement">التقاعد</TabsTrigger>
          </TabsList>

          {activeTab === "allowances" && (
            <ExportData 
              data={filteredData.map(item => {
                const employee = getEmployeeDetails(item.employeeId);
                return {
                  id: item.id,
                  employeeName: getEmployeeName(item.employeeId),
                  employeeNumber: employee?.employeeNumber || "",
                  dueDate: formatDate(item.dueDate),
                  status: translateStatus(item.status),
                  notes: item.notes || ""
                };
              })}
              columns={[
                { header: "الموظف", accessor: "employeeName" },
                { header: "الرقم الوظيفي", accessor: "employeeNumber" },
                { header: "تاريخ الاستحقاق", accessor: "dueDate" },
                { header: "الحالة", accessor: "status" },
                { header: "ملاحظات", accessor: "notes" }
              ]}
              fileName="تقرير_العلاوات"
              title="تقرير العلاوات"
            />
          )}
          {activeTab === "promotions" && (
            <ExportData 
              data={filteredData.map(item => {
                const employee = getEmployeeDetails(item.employeeId);
                return {
                  id: item.id,
                  employeeName: getEmployeeName(item.employeeId),
                  employeeNumber: employee?.employeeNumber || "",
                  dueDate: formatDate(item.dueDate),
                  status: translateStatus(item.status),
                  notes: item.notes || ""
                };
              })}
              columns={[
                { header: "الموظف", accessor: "employeeName" },
                { header: "الرقم الوظيفي", accessor: "employeeNumber" },
                { header: "تاريخ الاستحقاق", accessor: "dueDate" },
                { header: "الحالة", accessor: "status" },
                { header: "ملاحظات", accessor: "notes" }
              ]}
              fileName="تقرير_الترفيعات"
              title="تقرير الترفيعات"
            />
          )}
          {activeTab === "retirement" && (
            <ExportData 
              data={retirementData.map(employee => {
                const retirementDate = new Date(employee.retirementDate || "");
                const today = new Date();
                const diffTime = retirementDate.getTime() - today.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return {
                  fullName: employee.fullName,
                  employeeNumber: employee.employeeNumber,
                  retirementDate: formatDate(employee.retirementDate),
                  daysRemaining: daysRemaining.toString()
                };
              })}
              columns={[
                { header: "الموظف", accessor: "fullName" },
                { header: "الرقم الوظيفي", accessor: "employeeNumber" },
                { header: "تاريخ التقاعد", accessor: "retirementDate" },
                { header: "عدد الأيام المتبقية", accessor: "daysRemaining" }
              ]}
              fileName="تقرير_التقاعد"
              title="تقرير التقاعد"
            />
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              {activeTab !== "retirement" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                    placeholder="بحث باسم الموظف"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allowances Tab Content */}
        <TabsContent value="allowances">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>تحليل العلاوات</CardTitle>
                <CardDescription>عدد العلاوات المستحقة خلال الأشهر الستة الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="allowances" name="العلاوات" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الحالات</CardTitle>
                <CardDescription>توزيع العلاوات حسب الحالة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة العلاوات</CardTitle>
              <CardDescription>
                تم العثور على {filteredData.length} علاوة مطابقة لمعايير البحث
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الرقم الوظيفي</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead>معالجة</TableHead> {/* Added header for process column */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => {
                        const employee = getEmployeeDetails(item.employeeId);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {getEmployeeName(item.employeeId).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="mr-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {getEmployeeName(item.employeeId)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{employee?.employeeNumber || "—"}</TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusBadgeColor(item.status)}
                              >
                                {translateStatus(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.notes || "—"}</TableCell>
                            <TableCell><Button onClick={() => handleProcess(item.id)}>معالجة</Button></TableCell> {/* Added process button */}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          لا توجد بيانات مطابقة لمعايير البحث
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab Content */}
        <TabsContent value="promotions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>تحليل الترفيعات</CardTitle>
                <CardDescription>عدد الترفيعات المستحقة خلال الأشهر الستة الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="promotions" name="الترفيعات" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الحالات</CardTitle>
                <CardDescription>توزيع الترفيعات حسب الحالة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة الترفيعات</CardTitle>
              <CardDescription>
                تم العثور على {filteredData.length} ترفيع مطابق لمعايير البحث
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الرقم الوظيفي</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>الدرجة الحالية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead>معالجة</TableHead> {/* Added header for process column */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => {
                        const employee = getEmployeeDetails(item.employeeId);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {getEmployeeName(item.employeeId).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="mr-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {getEmployeeName(item.employeeId)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{employee?.employeeNumber || "—"}</TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                            <TableCell>
                              {employee?.currentGrade ? `الدرجة ${employee.currentGrade}` : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusBadgeColor(item.status)}
                              >
                                {translateStatus(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.notes || "—"}</TableCell>
                            <TableCell><Button onClick={() => handleProcess(item.id)}>معالجة</Button></TableCell> {/* Added process button */}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          لا توجد بيانات مطابقة لمعايير البحث
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retirement Tab Content */}
        <TabsContent value="retirement">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>تقرير التقاعد</CardTitle>
                <CardDescription>
                  قائمة الموظفين المقبلين على التقاعد خلال الـ 180 يوم القادمة
                </CardDescription>
              </div>
              <div className="flex items-center">
                <Calendar className="text-orange-500 ml-2" />
                <span className="text-sm text-gray-500">
                  تم العثور على {retirementData.length} موظف مقبل على التقاعد
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الرقم الوظيفي</TableHead>
                      <TableHead>العنوان الوظيفي</TableHead>
                      <TableHead>تاريخ التعيين</TableHead>
                      <TableHead>تاريخ التقاعد</TableHead>
                      <TableHead>الأيام المتبقية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retirementData.length > 0 ? (
                      retirementData.map((employee) => {
                        const today = new Date();
                        const retirementDate = new Date(employee.retirementDate!);
                        const diffTime = retirementDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const jobTitle = employee.jobTitleId ? "منصب" : "موظف";

                        return (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {employee.firstName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="mr-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {employee.fullName}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{employee.employeeNumber}</TableCell>
                            <TableCell>{jobTitle}</TableCell>
                            <TableCell>{formatDate(employee.hireDate)}</TableCell>
                            <TableCell>{formatDate(employee.retirementDate)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  diffDays <= 30
                                    ? "bg-red-100 text-red-800"
                                    : diffDays <= 90
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {diffDays} يوم
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          لا يوجد موظفين مقبلين على التقاعد خلال الفترة المحددة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;