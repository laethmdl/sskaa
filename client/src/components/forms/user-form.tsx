import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Schema for adding new user
const userFormSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن يحتوي على الأقل على حرفين" }),
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يحتوي على الأقل على 3 أحرف" }),
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون على الأقل 6 أحرف" }),
  role: z.enum(["admin", "manager", "user"], {
    required_error: "يرجى اختيار دور المستخدم",
  }),
});

// Schema for editing user
const userEditFormSchema = userFormSchema.extend({
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون على الأقل 6 أحرف" }).optional(),
}).omit({ username: true });

type UserFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
  userId?: number;
};

const UserForm = ({ onSuccess, onCancel, userId }: UserFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch user data if editing
  const isEditing = !!userId;
  
  // Set up form with the correct schema
  const form = useForm({
    resolver: zodResolver(isEditing ? userEditFormSchema : userFormSchema),
    defaultValues: async () => {
      if (isEditing && userId) {
        setLoading(true);
        try {
          const res = await apiRequest("GET", `/api/users/${userId}`);
          const userData = await res.json();
          setLoading(false);
          return {
            name: userData.name,
            email: userData.email,
            role: userData.role,
          };
        } catch (error) {
          setLoading(false);
          toast({
            title: "فشل في تحميل بيانات المستخدم",
            variant: "destructive",
          });
          return {};
        }
      }
      return {
        name: "",
        username: "",
        email: "",
        password: "",
        role: "user",
      };
    },
  });

  const onSubmit = async (data: z.infer<typeof userFormSchema> | z.infer<typeof userEditFormSchema>) => {
    setLoading(true);
    try {
      if (isEditing) {
        await apiRequest("PUT", `/api/protected/users/${userId}`, data);
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({
          title: "تم تحديث المستخدم بنجاح",
        });
      } else {
        await apiRequest("POST", "/api/protected/users", data);
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({
          title: "تم إضافة المستخدم بنجاح",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: isEditing ? "فشل في تحديث المستخدم" : "فشل في إضافة المستخدم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم</FormLabel>
              <FormControl>
                <Input placeholder="الاسم الكامل" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المستخدم</FormLabel>
                <FormControl>
                  <Input placeholder="اسم المستخدم للدخول" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input placeholder="البريد الإلكتروني" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? "كلمة المرور (اتركها فارغة للاحتفاظ بنفس كلمة المرور)" : "كلمة المرور"}</FormLabel>
              <FormControl>
                <Input placeholder="كلمة المرور" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الدور</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value || "user"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر دور المستخدم" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">مسؤول</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEditing ? "تحديث المستخدم" : "إضافة المستخدم"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserForm;