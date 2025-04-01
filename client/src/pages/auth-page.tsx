import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, { message: "اسم المستخدم مطلوب" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
  rememberMe: z.boolean().optional(),
});

// Registration form schema
const registerFormSchema = z.object({
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يكون على الأقل 3 أحرف" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون على الأقل 6 أحرف" }),
  name: z.string().min(2, { message: "الاسم الكامل مطلوب" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }).optional().or(z.literal('')),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [_, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });

  // Handle login submit
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  // Handle register submit
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      password: data.password,
      name: data.name,
      email: data.email || undefined,
      role: "user",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-auto text-primary-600"
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
          <h2 className="mt-3 text-center text-3xl font-bold text-gray-900">نظام العلاوات والترفيعات</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            الرجاء تسجيل الدخول للوصول إلى النظام
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المستخدم</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم المستخدم" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox 
                              id="rememberMe" 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                            <label
                              htmlFor="rememberMe"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              تذكرني
                            </label>
                          </div>
                        )}
                      />
                      <div className="text-sm">
                        <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                          نسيت كلمة المرور؟
                        </a>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      تسجيل الدخول
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل الاسم الكامل" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المستخدم</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل اسم المستخدم" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      إنشاء حساب
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
