import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FilePlus2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";

export function ExcelImportExport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // مسار تنزيل ملف النموذج
  const templateUrl = '/api/employees/excel/template';
  
  // مسار تنزيل ملف تصدير البيانات
  const exportUrl = '/api/employees/excel/export';
  
  // استيراد البيانات من ملف إكسل
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      setImporting(true);
      setProgress(20);
      
      try {
        const response = await apiRequest('POST', '/api/protected/employees/excel/import', formData);
        setProgress(80);
        return await response.json();
      } finally {
        setTimeout(() => {
          setImporting(false);
          setProgress(100);
          setTimeout(() => setProgress(0), 500);
        }, 500);
      }
    },
    onSuccess: (data) => {
      // إعادة تحميل بيانات الموظفين بعد الاستيراد
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      
      toast({
        title: "تم استيراد البيانات بنجاح",
        description: data.message,
      });
      
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "فشل استيراد البيانات",
        description: error.message || "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    }
  });
  
  // معالجة اختيار الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  // معالجة تحميل الملف
  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "يرجى اختيار ملف إكسل أولاً",
        variant: "destructive",
      });
      return;
    }
    
    // التحقق من نوع الملف
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast({
        title: "نوع ملف غير صالح",
        description: "يجب اختيار ملف بصيغة Excel (.xlsx أو .xls)",
        variant: "destructive",
      });
      return;
    }
    
    // التحقق من حجم الملف (أقل من 5 ميجابايت)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يجب أن يكون حجم الملف أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }
    
    importMutation.mutate(selectedFile);
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>استيراد وتصدير بيانات الموظفين</CardTitle>
        <CardDescription>
          تصدير بيانات الموظفين إلى ملف Excel أو استيراد بيانات من ملف Excel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 flex-wrap">
            {/* زر التصدير */}
            <Button variant="outline" onClick={() => window.location.href = exportUrl}>
              <Download className="ml-2 h-4 w-4" />
              تصدير جميع البيانات
            </Button>
            
            {/* زر تنزيل النموذج */}
            <Button variant="outline" onClick={() => window.location.href = templateUrl}>
              <FilePlus2 className="ml-2 h-4 w-4" />
              تنزيل نموذج فارغ
            </Button>
          </div>
          
          <div className="border rounded-md p-4 mt-2">
            <h3 className="text-lg font-medium mb-2">استيراد بيانات من ملف Excel</h3>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || importing}
              >
                {importing ? (
                  "جاري التحميل..."
                ) : (
                  <>
                    <Upload className="ml-2 h-4 w-4" />
                    استيراد
                  </>
                )}
              </Button>
            </div>
            
            {importing && (
              <div className="mt-4">
                <Progress value={progress} className="h-2 w-full" />
                <p className="text-sm text-center mt-1">جاري استيراد البيانات...</p>
              </div>
            )}
            
            {selectedFile && (
              <p className="text-sm mt-2">
                الملف المختار: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} كيلوبايت)
              </p>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            <h4 className="font-semibold mb-1">ملاحظات:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>يجب أن يكون الملف المستورد بنفس تنسيق النموذج الفارغ</li>
              <li>الحقول الإلزامية: رقم الموظف، الاسم الأول، الاسم الأخير، تاريخ التعيين، الدرجة الحالية</li>
              <li>سيتم التحقق من وجود رقم الموظف قبل الاستيراد</li>
              <li>تنسيق التاريخ المطلوب: YYYY-MM-DD (مثال: 2021-01-15)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}