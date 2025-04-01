import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEmployeeSchema, InsertEmployee } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Extend the insert schema with validation
const formSchema = insertEmployeeSchema.extend({
  firstName: z.string().min(2, { message: "الاسم الأول يجب أن لا يقل عن حرفين" }),
  lastName: z.string().min(2, { message: "الاسم الأخير يجب أن لا يقل عن حرفين" }),
  employeeNumber: z.string().min(1, { message: "الرقم الوظيفي مطلوب" }),
  hiringDate: z.date({ required_error: "تاريخ التعيين مطلوب" }),
  currentGrade: z.coerce.number().min(1, { message: "الدرجة الوظيفية مطلوبة" }),
});

interface EmployeeFormProps {
  employeeId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const EmployeeForm = ({ employeeId, onSuccess, onCancel }: EmployeeFormProps) => {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(!!employeeId);

  // Fetch workplaces
  const { data: workplaces, isLoading: isLoadingWorkplaces } = useQuery({
    queryKey: ["/api/workplaces"],
  });

  // Fetch job titles
  const { data: jobTitles, isLoading: isLoadingJobTitles } = useQuery({
    queryKey: ["/api/job-titles"],
  });

  // Fetch educational qualifications
  const { data: qualifications, isLoading: isLoadingQualifications } = useQuery({
    queryKey: ["/api/qualifications"],
  });

  // Fetch employee if in edit mode
  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ["/api/employees", employeeId],
    enabled: isEditMode,
  });

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      employeeNumber: "",
      email: "",
      phoneNumber: "",
      workplaceId: undefined,
      jobTitleId: undefined,
      educationalQualificationId: undefined,
      currentGrade: undefined,
      status: "active",
    },
  });

  // Set form values when employee data is loaded (for edit mode)
  useEffect(() => {
    if (isEditMode && employee) {
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeNumber: employee.employeeNumber,
        email: employee.email || "",
        phoneNumber: employee.phoneNumber || "",
        hiringDate: employee.hiringDate ? new Date(employee.hiringDate) : undefined,
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : undefined,
        workplaceId: employee.workplaceId,
        jobTitleId: employee.jobTitleId,
        educationalQualificationId: employee.educationalQualificationId,
        currentGrade: employee.currentGrade,
        status: employee.status || "active",
        lastPromotionDate: employee.lastPromotionDate ? new Date(employee.lastPromotionDate) : undefined,
        lastAllowanceDate: employee.lastAllowanceDate ? new Date(employee.lastAllowanceDate) : undefined,
        retirementDate: employee.retirementDate ? new Date(employee.retirementDate) : undefined,
      });
    }
  }, [employee, isEditMode, form]);

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "/api/protected/employees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم إنشاء الموظف بنجاح",
        description: "تم إضافة بيانات الموظف الجديد",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "فشل في إنشاء الموظف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertEmployee>) => {
      const response = await apiRequest("PUT", `/api/protected/employees/${employeeId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      toast({
        title: "تم تحديث الموظف بنجاح",
        description: "تم تحديث بيانات الموظف",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "فشل في تحديث الموظف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data as InsertEmployee);
    }
  };

  const isLoading = isLoadingWorkplaces || isLoadingJobTitles || isLoadingQualifications || 
    (isEditMode && isLoadingEmployee);

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم الأول</FormLabel>
                <FormControl>
                  <Input {...field} dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم الأخير</FormLabel>
                <FormControl>
                  <Input {...field} dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الرقم الوظيفي</FormLabel>
                <FormControl>
                  <Input {...field} dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input type="email" {...field} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الهاتف</FormLabel>
                <FormControl>
                  <Input {...field} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workplaceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مكان العمل</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مكان العمل" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workplaces?.map((workplace) => (
                      <SelectItem key={workplace.id} value={workplace.id.toString()}>
                        {workplace.name}
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
            name="jobTitleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المنصب</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنصب" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobTitles?.map((jobTitle) => (
                      <SelectItem key={jobTitle.id} value={jobTitle.id.toString()}>
                        {jobTitle.title}
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
            name="hiringDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ التعيين</FormLabel>
                <FormControl>
                  <DatePickerAr 
                    date={field.value} 
                    setDate={field.onChange}
                    placeholder="اختر تاريخ التعيين"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الميلاد</FormLabel>
                <FormControl>
                  <DatePickerAr 
                    date={field.value} 
                    setDate={field.onChange}
                    placeholder="اختر تاريخ الميلاد"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="educationalQualificationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المؤهل التعليمي</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المؤهل التعليمي" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {qualifications?.map((qual) => (
                      <SelectItem key={qual.id} value={qual.id.toString()}>
                        {qual.name}
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
            name="currentGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الدرجة الوظيفية</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدرجة الوظيفية" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">الأولى</SelectItem>
                    <SelectItem value="2">الثانية</SelectItem>
                    <SelectItem value="3">الثالثة</SelectItem>
                    <SelectItem value="4">الرابعة</SelectItem>
                    <SelectItem value="5">الخامسة</SelectItem>
                    <SelectItem value="6">السادسة</SelectItem>
                    <SelectItem value="7">السابعة</SelectItem>
                    <SelectItem value="8">الثامنة</SelectItem>
                    <SelectItem value="9">التاسعة</SelectItem>
                    <SelectItem value="10">العاشرة</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحالة</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="vacation">إجازة</SelectItem>
                    <SelectItem value="suspended">موقوف</SelectItem>
                    <SelectItem value="retired">متقاعد</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditMode && (
            <FormField
              control={form.control}
              name="lastPromotionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ آخر ترفيع</FormLabel>
                  <FormControl>
                    <DatePickerAr 
                      date={field.value} 
                      setDate={field.onChange}
                      placeholder="اختر تاريخ آخر ترفيع"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isEditMode && (
            <FormField
              control={form.control}
              name="lastAllowanceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ آخر علاوة</FormLabel>
                  <FormControl>
                    <DatePickerAr 
                      date={field.value} 
                      setDate={field.onChange}
                      placeholder="اختر تاريخ آخر علاوة"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isEditMode && (
            <FormField
              control={form.control}
              name="retirementDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ التقاعد</FormLabel>
                  <FormControl>
                    <DatePickerAr 
                      date={field.value} 
                      setDate={field.onChange}
                      placeholder="اختر تاريخ التقاعد"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end space-x-2 space-x-reverse mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "تحديث الموظف" : "إضافة موظف"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmployeeForm;
