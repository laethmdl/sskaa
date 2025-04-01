import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  insertWorkplaceSchema, 
  insertJobTitleSchema, 
  insertEducationalQualificationSchema 
} from "@shared/schema";

// Workplace form schema
const workplaceFormSchema = insertWorkplaceSchema.extend({
  name: z.string().min(2, { message: "اسم موقع العمل يجب أن يكون على الأقل حرفين" }),
});

// Job title form schema
const jobTitleFormSchema = insertJobTitleSchema.extend({
  title: z.string().min(2, { message: "عنوان الوظيفة يجب أن يكون على الأقل حرفين" }),
  grade: z.coerce.number().min(1, { message: "الدرجة يجب أن تكون على الأقل 1" }),
});

// Education qualification form schema
const qualificationFormSchema = insertEducationalQualificationSchema.extend({
  name: z.string().min(2, { message: "اسم المؤهل يجب أن يكون على الأقل حرفين" }),
  level: z.coerce.number().min(1, { message: "المستوى يجب أن يكون على الأقل 1" }),
});

const DefinitionsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("workplaces");
  
  // State for dialogs
  const [workplaceDialogOpen, setWorkplaceDialogOpen] = useState(false);
  const [jobTitleDialogOpen, setJobTitleDialogOpen] = useState(false);
  const [qualificationDialogOpen, setQualificationDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemType, setItemType] = useState<"workplace" | "jobTitle" | "qualification" | null>(null);
  
  // Fetch data
  const { data: workplaces, isLoading: isLoadingWorkplaces } = useQuery({
    queryKey: ["/api/workplaces"],
  });
  
  const { data: jobTitles, isLoading: isLoadingJobTitles } = useQuery({
    queryKey: ["/api/job-titles"],
  });
  
  const { data: qualifications, isLoading: isLoadingQualifications } = useQuery({
    queryKey: ["/api/qualifications"],
  });
  
  // Forms
  const workplaceForm = useForm<z.infer<typeof workplaceFormSchema>>({
    resolver: zodResolver(workplaceFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const jobTitleForm = useForm<z.infer<typeof jobTitleFormSchema>>({
    resolver: zodResolver(jobTitleFormSchema),
    defaultValues: {
      title: "",
      description: "",
      grade: undefined,
    },
  });
  
  const qualificationForm = useForm<z.infer<typeof qualificationFormSchema>>({
    resolver: zodResolver(qualificationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      level: undefined,
    },
  });
  
  // Mutations
  // Workplace mutations
  const createWorkplaceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workplaceFormSchema>) => {
      const response = await apiRequest("POST", "/api/protected/workplaces", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workplaces"] });
      setWorkplaceDialogOpen(false);
      workplaceForm.reset();
      toast({ title: "تم إنشاء موقع العمل بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateWorkplaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof workplaceFormSchema> }) => {
      const response = await apiRequest("PUT", `/api/protected/workplaces/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workplaces"] });
      setWorkplaceDialogOpen(false);
      workplaceForm.reset();
      toast({ title: "تم تحديث موقع العمل بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteWorkplaceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/workplaces/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workplaces"] });
      setDeleteDialogOpen(false);
      toast({ title: "تم حذف موقع العمل بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Job title mutations
  const createJobTitleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobTitleFormSchema>) => {
      const response = await apiRequest("POST", "/api/protected/job-titles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-titles"] });
      setJobTitleDialogOpen(false);
      jobTitleForm.reset();
      toast({ title: "تم إنشاء العنوان الوظيفي بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateJobTitleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof jobTitleFormSchema> }) => {
      const response = await apiRequest("PUT", `/api/protected/job-titles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-titles"] });
      setJobTitleDialogOpen(false);
      jobTitleForm.reset();
      toast({ title: "تم تحديث العنوان الوظيفي بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteJobTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/job-titles/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-titles"] });
      setDeleteDialogOpen(false);
      toast({ title: "تم حذف العنوان الوظيفي بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Qualification mutations
  const createQualificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof qualificationFormSchema>) => {
      const response = await apiRequest("POST", "/api/protected/qualifications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qualifications"] });
      setQualificationDialogOpen(false);
      qualificationForm.reset();
      toast({ title: "تم إنشاء المؤهل التعليمي بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateQualificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof qualificationFormSchema> }) => {
      const response = await apiRequest("PUT", `/api/protected/qualifications/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qualifications"] });
      setQualificationDialogOpen(false);
      qualificationForm.reset();
      toast({ title: "تم تحديث المؤهل التعليمي بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteQualificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/qualifications/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qualifications"] });
      setDeleteDialogOpen(false);
      toast({ title: "تم حذف المؤهل التعليمي بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle edit for workplace
  const handleEditWorkplace = (workplace: any) => {
    workplaceForm.reset({
      name: workplace.name,
      description: workplace.description || "",
    });
    setSelectedItemId(workplace.id);
    setEditMode(true);
    setWorkplaceDialogOpen(true);
  };
  
  // Handle edit for job title
  const handleEditJobTitle = (jobTitle: any) => {
    jobTitleForm.reset({
      title: jobTitle.title,
      description: jobTitle.description || "",
      grade: jobTitle.grade,
    });
    setSelectedItemId(jobTitle.id);
    setEditMode(true);
    setJobTitleDialogOpen(true);
  };
  
  // Handle edit for qualification
  const handleEditQualification = (qualification: any) => {
    qualificationForm.reset({
      name: qualification.name,
      description: qualification.description || "",
      level: qualification.level,
    });
    setSelectedItemId(qualification.id);
    setEditMode(true);
    setQualificationDialogOpen(true);
  };
  
  // Handle delete
  const handleDeleteClick = (id: number, type: "workplace" | "jobTitle" | "qualification") => {
    setSelectedItemId(id);
    setItemType(type);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (!selectedItemId || !itemType) return;
    
    switch (itemType) {
      case "workplace":
        deleteWorkplaceMutation.mutate(selectedItemId);
        break;
      case "jobTitle":
        deleteJobTitleMutation.mutate(selectedItemId);
        break;
      case "qualification":
        deleteQualificationMutation.mutate(selectedItemId);
        break;
    }
  };
  
  // Form submissions
  const onWorkplaceSubmit = (data: z.infer<typeof workplaceFormSchema>) => {
    if (editMode && selectedItemId) {
      updateWorkplaceMutation.mutate({ id: selectedItemId, data });
    } else {
      createWorkplaceMutation.mutate(data);
    }
  };
  
  const onJobTitleSubmit = (data: z.infer<typeof jobTitleFormSchema>) => {
    if (editMode && selectedItemId) {
      updateJobTitleMutation.mutate({ id: selectedItemId, data });
    } else {
      createJobTitleMutation.mutate(data);
    }
  };
  
  const onQualificationSubmit = (data: z.infer<typeof qualificationFormSchema>) => {
    if (editMode && selectedItemId) {
      updateQualificationMutation.mutate({ id: selectedItemId, data });
    } else {
      createQualificationMutation.mutate(data);
    }
  };
  
  // Reset form state when opening dialog
  const openAddWorkplaceDialog = () => {
    workplaceForm.reset({
      name: "",
      description: "",
    });
    setEditMode(false);
    setSelectedItemId(null);
    setWorkplaceDialogOpen(true);
  };
  
  const openAddJobTitleDialog = () => {
    jobTitleForm.reset({
      title: "",
      description: "",
      grade: undefined,
    });
    setEditMode(false);
    setSelectedItemId(null);
    setJobTitleDialogOpen(true);
  };
  
  const openAddQualificationDialog = () => {
    qualificationForm.reset({
      name: "",
      description: "",
      level: undefined,
    });
    setEditMode(false);
    setSelectedItemId(null);
    setQualificationDialogOpen(true);
  };
  
  const isLoading = isLoadingWorkplaces || isLoadingJobTitles || isLoadingQualifications;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">الملفات التعريفية</h1>
        <p className="mt-1 text-sm text-gray-600">إدارة مواقع العمل والعناوين الوظيفية والمؤهلات التعليمية</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="workplaces">مواقع العمل</TabsTrigger>
          <TabsTrigger value="job-titles">العناوين الوظيفية</TabsTrigger>
          <TabsTrigger value="qualifications">المؤهلات التعليمية</TabsTrigger>
        </TabsList>
        
        {/* Workplaces Tab */}
        <TabsContent value="workplaces">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>مواقع العمل</CardTitle>
                <CardDescription>إدارة مواقع العمل المتاحة في النظام</CardDescription>
              </div>
              <Button onClick={openAddWorkplaceDialog}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة موقع عمل
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingWorkplaces ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم موقع العمل</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workplaces && workplaces.length > 0 ? (
                      workplaces.map((workplace) => (
                        <TableRow key={workplace.id}>
                          <TableCell className="font-medium">{workplace.name}</TableCell>
                          <TableCell>{workplace.description || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditWorkplace(workplace)}
                              className="ml-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(workplace.id, "workplace")}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                          لا توجد مواقع عمل مضافة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Job Titles Tab */}
        <TabsContent value="job-titles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>العناوين الوظيفية</CardTitle>
                <CardDescription>إدارة العناوين الوظيفية المتاحة في النظام</CardDescription>
              </div>
              <Button onClick={openAddJobTitleDialog}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة عنوان وظيفي
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingJobTitles ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنوان الوظيفي</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobTitles && jobTitles.length > 0 ? (
                      jobTitles.map((jobTitle) => (
                        <TableRow key={jobTitle.id}>
                          <TableCell className="font-medium">{jobTitle.title}</TableCell>
                          <TableCell>{jobTitle.grade}</TableCell>
                          <TableCell>{jobTitle.description || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditJobTitle(jobTitle)}
                              className="ml-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(jobTitle.id, "jobTitle")}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          لا توجد عناوين وظيفية مضافة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Qualifications Tab */}
        <TabsContent value="qualifications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>المؤهلات التعليمية</CardTitle>
                <CardDescription>إدارة المؤهلات التعليمية المتاحة في النظام</CardDescription>
              </div>
              <Button onClick={openAddQualificationDialog}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة مؤهل تعليمي
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingQualifications ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل البيانات...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المؤهل</TableHead>
                      <TableHead>المستوى</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualifications && qualifications.length > 0 ? (
                      qualifications.map((qualification) => (
                        <TableRow key={qualification.id}>
                          <TableCell className="font-medium">{qualification.name}</TableCell>
                          <TableCell>{qualification.level}</TableCell>
                          <TableCell>{qualification.description || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditQualification(qualification)}
                              className="ml-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(qualification.id, "qualification")}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          لا توجد مؤهلات تعليمية مضافة
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
      
      {/* Workplace Dialog */}
      <Dialog open={workplaceDialogOpen} onOpenChange={setWorkplaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "تعديل موقع العمل" : "إضافة موقع عمل جديد"}</DialogTitle>
            <DialogDescription>
              {editMode ? "قم بتعديل بيانات موقع العمل" : "أدخل بيانات موقع العمل الجديد"}
            </DialogDescription>
          </DialogHeader>
          <Form {...workplaceForm}>
            <form onSubmit={workplaceForm.handleSubmit(onWorkplaceSubmit)} className="space-y-4">
              <FormField
                control={workplaceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم موقع العمل</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم موقع العمل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workplaceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل وصف موقع العمل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createWorkplaceMutation.isPending || updateWorkplaceMutation.isPending}
                >
                  {(createWorkplaceMutation.isPending || updateWorkplaceMutation.isPending) && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  {editMode ? "تحديث" : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Job Title Dialog */}
      <Dialog open={jobTitleDialogOpen} onOpenChange={setJobTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "تعديل العنوان الوظيفي" : "إضافة عنوان وظيفي جديد"}</DialogTitle>
            <DialogDescription>
              {editMode ? "قم بتعديل بيانات العنوان الوظيفي" : "أدخل بيانات العنوان الوظيفي الجديد"}
            </DialogDescription>
          </DialogHeader>
          <Form {...jobTitleForm}>
            <form onSubmit={jobTitleForm.handleSubmit(onJobTitleSubmit)} className="space-y-4">
              <FormField
                control={jobTitleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان الوظيفي</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل العنوان الوظيفي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={jobTitleForm.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدرجة</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="أدخل الدرجة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={jobTitleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل وصف العنوان الوظيفي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createJobTitleMutation.isPending || updateJobTitleMutation.isPending}
                >
                  {(createJobTitleMutation.isPending || updateJobTitleMutation.isPending) && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  {editMode ? "تحديث" : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Qualification Dialog */}
      <Dialog open={qualificationDialogOpen} onOpenChange={setQualificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "تعديل المؤهل التعليمي" : "إضافة مؤهل تعليمي جديد"}</DialogTitle>
            <DialogDescription>
              {editMode ? "قم بتعديل بيانات المؤهل التعليمي" : "أدخل بيانات المؤهل التعليمي الجديد"}
            </DialogDescription>
          </DialogHeader>
          <Form {...qualificationForm}>
            <form onSubmit={qualificationForm.handleSubmit(onQualificationSubmit)} className="space-y-4">
              <FormField
                control={qualificationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المؤهل التعليمي</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المؤهل التعليمي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={qualificationForm.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستوى</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="أدخل المستوى" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={qualificationForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل وصف المؤهل التعليمي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createQualificationMutation.isPending || updateQualificationMutation.isPending}
                >
                  {(createQualificationMutation.isPending || updateQualificationMutation.isPending) && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  {editMode ? "تحديث" : "إضافة"}
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
              disabled={deleteWorkplaceMutation.isPending || deleteJobTitleMutation.isPending || deleteQualificationMutation.isPending}
            >
              {(deleteWorkplaceMutation.isPending || deleteJobTitleMutation.isPending || deleteQualificationMutation.isPending) && (
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

export default DefinitionsPage;
