import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocale } from "@/hooks/use-locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAppreciationSchema } from "@shared/schema";

// Extended schema for the form
const appreciationFormSchema = insertAppreciationSchema.extend({
  employeeId: z.coerce.number().min(1, { message: "يجب اختيار الموظف" }),
  type: z.string().min(1, { message: "يجب اختيار النوع" }),
  description: z.string().min(5, { message: "الوصف يجب أن يكون على الأقل 5 أحرف" }),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  additionalServiceMonths: z.coerce.number().min(0, { message: "يجب أن تكون المدة صفر أو أكثر" }).default(0),
  issuedBy: z.string().min(2, { message: "اسم المصدر مطلوب" }),
});

type AppreciationFormValues = z.infer<typeof appreciationFormSchema>;

const AppreciationPage = () => {
  const { toast } = useToast();
  const { formatDate } = useLocale();
  
  // States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appreciationToDelete, setAppreciationToDelete] = useState<number | null>(null);
  
  // Queries
  const { data: appreciations = [], isLoading: isLoadingAppreciations } = useQuery<any[]>({
    queryKey: ["/api/appreciations"],
  });
  
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });
  
  // Form
  const form = useForm<AppreciationFormValues>({
    resolver: zodResolver(appreciationFormSchema),
    defaultValues: {
      employeeId: undefined,
      type: undefined,
      description: "",
      date: undefined,
      issuedBy: "",
      additionalServiceMonths: 0,
    },
  });
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: AppreciationFormValues) => {
      const response = await apiRequest("POST", "/api/protected/appreciations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appreciations"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "تم إضافة التشكر/العقوبة بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: AppreciationFormValues }) => {
      const response = await apiRequest("PUT", `/api/protected/appreciations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appreciations"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "تم تحديث التشكر/العقوبة بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/appreciations/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appreciations"] });
      setDeleteDialogOpen(false);
      toast({ title: "تم حذف التشكر/العقوبة بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleAdd = () => {
    form.reset({
      employeeId: undefined,
      type: undefined,
      description: "",
      date: undefined,
      issuedBy: "",
      additionalServiceMonths: 0,
    });
    setIsEditMode(false);
    setSelectedId(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (appreciation: any) => {
    form.reset({
      employeeId: appreciation.employeeId,
      type: appreciation.type,
      description: appreciation.description,
      date: new Date(appreciation.date),
      issuedBy: appreciation.issuedBy,
      additionalServiceMonths: appreciation.additionalServiceMonths || 0,
    });
    setIsEditMode(true);
    setSelectedId(appreciation.id);
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (id: number) => {
    setAppreciationToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (appreciationToDelete) {
      deleteMutation.mutate(appreciationToDelete);
    }
  };
  
  const onSubmit = (data: AppreciationFormValues) => {
    if (isEditMode && selectedId) {
      updateMutation.mutate({ id: selectedId, data });
    } else {
      createMutation.mutate(data);
    }
  };
  
  // Helper to get employee name
  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((e: any) => e.id === employeeId);
    return employee?.fullName || "غير معروف";
  };

  // Helper for badge styling based on type
  const getTypeBadge = (type: string) => {
    if (type === "appreciation") {
      return <Badge className="bg-green-100 text-green-800">تشكر</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">عقوبة</Badge>;
    }
  };
  
  const isLoading = isLoadingAppreciations || isLoadingEmployees;
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">التشكرات والعقوبات</h1>
          <p className="mt-1 text-sm text-gray-600">إدارة التشكرات والعقوبات للموظفين</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleAdd}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة جديد
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>قائمة التشكرات والعقوبات</CardTitle>
          <CardDescription>عرض جميع التشكرات والعقوبات المسجلة في النظام</CardDescription>
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
                  <TableHead>النوع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الجهة المصدرة</TableHead>
                  <TableHead>مدة إضافية (أشهر)</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appreciations.length > 0 ? (
                  appreciations.map((appreciation: any) => (
                    <TableRow key={appreciation.id}>
                      <TableCell>{getEmployeeName(appreciation.employeeId)}</TableCell>
                      <TableCell>{getTypeBadge(appreciation.type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{appreciation.description}</TableCell>
                      <TableCell>{formatDate(appreciation.date)}</TableCell>
                      <TableCell>{appreciation.issuedBy}</TableCell>
                      <TableCell>
                        {appreciation.type === "appreciation" ? appreciation.additionalServiceMonths || 0 : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(appreciation)}
                          className="ml-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(appreciation.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      لا توجد تشكرات أو عقوبات مسجلة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "تعديل تشكر/عقوبة" : "إضافة تشكر/عقوبة جديدة"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "قم بتعديل بيانات التشكر أو العقوبة" : "أدخل بيانات التشكر أو العقوبة الجديدة"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموظف</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الموظف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.fullName} - {employee.employeeNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="appreciation">تشكر</SelectItem>
                        <SelectItem value="disciplinary">عقوبة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="أدخل وصف التشكر أو العقوبة" 
                        {...field} 
                        className="min-h-[100px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التاريخ</FormLabel>
                    <FormControl>
                      <DatePickerAr
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="اختر التاريخ"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="issuedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجهة المصدرة</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم الجهة المصدرة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("type") === "appreciation" && (
                <FormField
                  control={form.control}
                  name="additionalServiceMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة كتاب الشكر (بالأشهر)</FormLabel>
                      <FormDescription>
                        عدد الأشهر التي سيتم إضافتها إلى خدمة الموظف للعلاوات أو الترفيعات
                      </FormDescription>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="أدخل عدد الأشهر" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "تحديث" : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذا العنصر بشكل دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppreciationPage;
