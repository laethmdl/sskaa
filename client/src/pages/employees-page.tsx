import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, Search } from "lucide-react";
import EmployeeForm from "@/components/forms/employee-form";
import { ExcelImportExport } from "@/components/excel-import-export";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const EmployeesPage = () => {
  const { toast } = useToast();
  const { formatDate } = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch employees, workplaces, job titles
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: workplaces, isLoading: isLoadingWorkplaces } = useQuery({
    queryKey: ["/api/workplaces"],
  });

  const { data: jobTitles, isLoading: isLoadingJobTitles } = useQuery({
    queryKey: ["/api/job-titles"],
  });

  // Helper function to get workplace name
  const getWorkplaceName = (workplaceId?: number) => {
    if (!workplaceId || !workplaces) return "غير محدد";
    const workplace = workplaces.find(w => w.id === workplaceId);
    return workplace ? workplace.name : "غير محدد";
  };

  // Helper function to get job title
  const getJobTitle = (jobTitleId?: number) => {
    if (!jobTitleId || !jobTitles) return "غير محدد";
    const jobTitle = jobTitles.find(j => j.id === jobTitleId);
    return jobTitle ? jobTitle.title : "غير محدد";
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || employee.workplaceId?.toString() === departmentFilter;
    const matchesPosition = !positionFilter || employee.jobTitleId?.toString() === positionFilter;
    const matchesStatus = !statusFilter || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesPosition && matchesStatus;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setPositionFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // Handle edit employee
  const handleEditEmployee = (id: number) => {
    setSelectedEmployeeId(id);
    setIsEditEmployeeOpen(true);
  };

  // Handle delete employee
  const handleDeleteClick = (id: number) => {
    setEmployeeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/protected/employees/${employeeToDelete}`, undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم حذف الموظف بنجاح",
      });
    } catch (error) {
      toast({
        title: "فشل في حذف الموظف",
        description: "حدث خطأ أثناء حذف الموظف",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsAddEmployeeOpen(false);
    setIsEditEmployeeOpen(false);
    setSelectedEmployeeId(null);
  };

  // Grade badges color based on grade
  const getGradeBadgeColor = (grade: number) => {
    switch (grade) {
      case 1: return "bg-purple-100 text-purple-800";
      case 2: return "bg-indigo-100 text-indigo-800";
      case 3: return "bg-blue-100 text-blue-800";
      case 4: return "bg-green-100 text-green-800";
      case 5: return "bg-yellow-100 text-yellow-800";
      case 6: return "bg-orange-100 text-orange-800";
      case 7: return "bg-red-100 text-red-800";
      case 8: return "bg-pink-100 text-pink-800";
      case 9: return "bg-gray-100 text-gray-800";
      case 10: return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Status badges color
  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "vacation": return "bg-blue-100 text-blue-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "retired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Translate status to Arabic
  const translateStatus = (status?: string) => {
    switch (status) {
      case "active": return "نشط";
      case "vacation": return "إجازة";
      case "suspended": return "موقوف";
      case "retired": return "متقاعد";
      default: return "غير محدد";
    }
  };

  const isLoading = isLoadingEmployees || isLoadingWorkplaces || isLoadingJobTitles;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">إدارة الموظفين</h1>
          <p className="mt-1 text-sm text-gray-600">قائمة بجميع الموظفين وإدارة ملفاتهم</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddEmployeeOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة موظف جديد
          </Button>
        </div>
      </div>
      
      {/* استيراد وتصدير الإكسل */}
      <ExcelImportExport />
      
      {/* Filter Controls */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-name" className="block text-sm font-medium text-gray-700 mb-1">البحث</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input 
                id="filter-name" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10" 
                placeholder="اسم الموظف أو الرقم الوظيفي" 
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="filter-department" className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger id="filter-department">
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {workplaces?.map(workplace => (
                  <SelectItem key={workplace.id} value={workplace.id.toString()}>
                    {workplace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="filter-position" className="block text-sm font-medium text-gray-700 mb-1">المنصب</label>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger id="filter-position">
                <SelectValue placeholder="جميع المناصب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المناصب</SelectItem>
                {jobTitles?.map(jobTitle => (
                  <SelectItem key={jobTitle.id} value={jobTitle.id.toString()}>
                    {jobTitle.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="vacation">إجازة</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
                <SelectItem value="retired">متقاعد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={resetFilters} className="ml-3">
            إعادة تعيين
          </Button>
          <Button>
            تطبيق الفلتر
          </Button>
        </div>
      </div>
      
      {/* Employees Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل البيانات...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الرقم الوظيفي</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>تاريخ التعيين</TableHead>
                  <TableHead>الدرجة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{employee.firstName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">{employee.fullName}</div>
                            <div className="text-sm text-gray-500">{employee.email || getJobTitle(employee.jobTitleId)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{employee.employeeNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{getWorkplaceName(employee.workplaceId)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{formatDate(employee.hiringDate)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getGradeBadgeColor(employee.currentGrade)}>
                          {`الدرجة ${employee.currentGrade}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeColor(employee.status)}>
                          {translateStatus(employee.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-primary-600 hover:text-primary-900 ml-3"
                          onClick={() => handleEditEmployee(employee.id)}
                        >
                          عرض
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-primary-600 hover:text-primary-900 ml-3"
                          onClick={() => handleEditEmployee(employee.id)}
                        >
                          تعديل
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(employee.id)}
                        >
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد بيانات للعرض
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination */}
        {filteredEmployees.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> إلى{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
                  </span>{" "}
                  من <span className="font-medium">{filteredEmployees.length}</span> موظف
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-md"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">السابق</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(index + 1)}
                      className={currentPage === index + 1 ? "z-10" : ""}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-r-md"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">التالي</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add Employee Dialog */}
      <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات الموظف الجديد. اضغط على حفظ عند الانتهاء.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAddEmployeeOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Employee Dialog */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات الموظف. اضغط على حفظ عند الانتهاء.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            employeeId={selectedEmployeeId || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsEditEmployeeOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا الموظف؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات الموظف بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeesPage;
