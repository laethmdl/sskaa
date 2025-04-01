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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Search, Pencil, Trash2, UserPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserForm from "@/components/forms/user-form";

const UsersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/users/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      toast({ title: "تم حذف المستخدم بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "فشل في حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleEditUser = (id: number) => {
    setSelectedUserId(id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "manager": return "bg-blue-100 text-blue-800";
      case "user": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Translate role to Arabic
  const translateRole = (role: string) => {
    switch (role) {
      case "admin": return "مدير النظام";
      case "manager": return "مدير";
      case "user": return "مستخدم";
      default: return role;
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">إدارة المستخدمين</h1>
          <p className="mt-1 text-sm text-gray-600">إدارة مستخدمي النظام وصلاحياتهم</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="ml-2 h-4 w-4" />
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  placeholder="بحث باسم المستخدم أو البريد الإلكتروني"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأدوار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
              }} className="w-full">
                إعادة تعيين الفلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>
            إجمالي المستخدمين: {filteredUsers.length}
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
                  <TableHead>المستخدم</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 bg-primary-100">
                            <AvatarFallback className="bg-primary-100 text-primary-800">
                              {userData.name?.charAt(0) || userData.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{userData.username}</TableCell>
                      <TableCell>{userData.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(userData.role)}>
                          {translateRole(userData.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(userData.id)}
                          className="ml-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Don't allow deleting the current user or if there's only one admin */}
                        {userData.id !== user?.id && (userData.role !== "admin" || filteredUsers.filter(u => u.role === "admin").length > 1) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(userData.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      لا توجد بيانات مطابقة لمعايير البحث
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات المستخدم الجديد. اضغط على إضافة عند الانتهاء.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            onSuccess={() => {
              setIsAddDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            }} 
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات المستخدم. اضغط على تحديث عند الانتهاء.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUserId && (
            <UserForm 
              userId={selectedUserId}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedUserId(null);
                queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              }} 
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedUserId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المستخدم؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذا المستخدم بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
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

export default UsersPage;