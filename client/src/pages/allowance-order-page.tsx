import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Printer, Save } from "lucide-react";
import { AllowancePromotion, Employee, User } from "@shared/schema";

// مكون لإضافة أعضاء اللجنة
interface CommitteeMemberProps {
  name: string;
  position: string;
  onChange: (name: string, position: string, index: number) => void;
  onRemove: () => void;
  index: number;
}

const CommitteeMember = ({ name, position, onChange, onRemove, index }: CommitteeMemberProps) => {
  return (
    <div className="flex flex-col space-y-2 p-4 border rounded-md">
      <div className="flex justify-between">
        <h4 className="text-sm font-medium">عضو اللجنة #{index + 1}</h4>
        {index > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            حذف
          </Button>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <Label htmlFor={`committee-name-${index}`}>الاسم</Label>
          <Input
            id={`committee-name-${index}`}
            value={name}
            onChange={(e) => onChange(e.target.value, position, index)}
            placeholder="اسم عضو اللجنة"
            dir="rtl"
          />
        </div>
        <div>
          <Label htmlFor={`committee-position-${index}`}>المنصب</Label>
          <Input
            id={`committee-position-${index}`}
            value={position}
            onChange={(e) => onChange(name, e.target.value, index)}
            placeholder="المنصب الوظيفي"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
};

interface OrderDetails {
  orderNumber: string;
  orderDate: string;
  subject: string;
  content: string;
  committeeMembers: Array<{ name: string; position: string }>;
  footer: string;
}

const AllowanceOrderPage = () => {
  const params = useParams();
  const { id } = params;
  const [_] = useLocation();
  const { toast } = useToast();
  const { formatDate } = useLocale();
  const [printMode, setPrintMode] = useState(false);
  
  // نموذج أمر العلاوة
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderNumber: "",
    orderDate: new Date().toISOString().split("T")[0],
    subject: "أمر إداري - منح علاوة",
    content: "",
    committeeMembers: [
      { name: "", position: "رئيس اللجنة" },
      { name: "", position: "عضو" },
      { name: "", position: "عضو" },
    ],
    footer: "مع التقدير"
  });

  // جلب بيانات العلاوة/الترقية
  const { data: allowancePromotion, isLoading: isLoadingAllowance } = useQuery<AllowancePromotion>({
    queryKey: ["/api/allowance-promotions", id ? parseInt(id) : 0],
    queryFn: async ({ queryKey }) => {
      const allPromotionsRes = await fetch("/api/allowance-promotions");
      const allPromotions = await allPromotionsRes.json();
      const promotionId = queryKey[1] as number;
      const promotion = allPromotions.find((p: AllowancePromotion) => p.id === promotionId);
      
      if (!promotion) {
        throw new Error(`العلاوة/الترقية برقم ${promotionId} غير موجودة`);
      }
      
      return promotion;
    },
    enabled: !!id,
  });

  // جلب بيانات الموظف
  const { data: employee, isLoading: isLoadingEmployee } = useQuery<Employee>({
    queryKey: ["/api/employees", allowancePromotion?.employeeId],
    enabled: !!allowancePromotion?.employeeId,
  });

  // جلب بيانات المستخدم الحالي
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // تحديث محتوى الأمر عند تحميل بيانات الموظف
  useEffect(() => {
    if (employee && allowancePromotion) {
      const newContent = `استناداً إلى الصلاحيات المخولة لنا، وبعد الاطلاع على ملف الموظف ${employee.fullName} (${employee.employeeNumber})، وبناءً على سنوات الخدمة المستحقة، تقرر منح المذكور علاوة وفقاً للقانون والتعليمات النافذة، وذلك اعتباراً من تاريخ ${formatDate(allowancePromotion.dueDate)}.`;
      
      setOrderDetails(prev => ({
        ...prev,
        content: newContent,
        orderNumber: `${new Date().getFullYear()}/ع/${employee.id}`,
      }));
    }
  }, [employee, allowancePromotion, formatDate]);

  // تحديث أعضاء اللجنة
  const handleCommitteeMemberChange = (name: string, position: string, index: number) => {
    const newMembers = [...orderDetails.committeeMembers];
    newMembers[index] = { name, position };
    setOrderDetails({ ...orderDetails, committeeMembers: newMembers });
  };

  // إضافة عضو جديد للجنة
  const handleAddMember = () => {
    setOrderDetails({
      ...orderDetails,
      committeeMembers: [
        ...orderDetails.committeeMembers,
        { name: "", position: "عضو" }
      ]
    });
  };

  // حذف عضو من اللجنة
  const handleRemoveMember = (index: number) => {
    if (orderDetails.committeeMembers.length <= 3) {
      toast({
        title: "لا يمكن الحذف",
        description: "يجب أن تحتوي اللجنة على الأقل على 3 أعضاء",
        variant: "destructive",
      });
      return;
    }

    const newMembers = [...orderDetails.committeeMembers];
    newMembers.splice(index, 1);
    setOrderDetails({ ...orderDetails, committeeMembers: newMembers });
  };

  // حفظ الأمر كملف PDF
  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 500);
  };

  // التحقق من صحة البيانات
  const isFormValid = () => {
    // التحقق من وجود رقم الأمر والتاريخ والموضوع والمحتوى
    if (!orderDetails.orderNumber || !orderDetails.orderDate || !orderDetails.subject || !orderDetails.content) {
      return false;
    }
    
    // التحقق من وجود أسماء أعضاء اللجنة
    return orderDetails.committeeMembers.every(member => member.name.trim() !== "");
  };

  // تحقق من وجود المعرف وإعادة محاولة لجلب البيانات
  useEffect(() => {
    if (id && (!allowancePromotion || !employee)) {
      console.log("محاولة جلب البيانات مرة أخرى للمعرف:", id);
    }
  }, [id, allowancePromotion, employee]);

  if (isLoadingAllowance || isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!allowancePromotion || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-xl font-medium mb-4">لم يتم العثور على العلاوة/الترقية المطلوبة</div>
        <div className="text-sm text-gray-500 mb-4">المعرف: {id}</div>
        <Button onClick={() => { window.location.href = "/"; }}>العودة إلى الرئيسية</Button>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 ${printMode ? 'print-mode' : ''}`}>
      {!printMode && (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">إصدار أمر علاوة</h1>
          <p className="text-gray-600">
            يمكنك إصدار أمر علاوة رسمي للموظف. تأكد من تعبئة جميع البيانات المطلوبة بشكل صحيح.
          </p>
        </div>
      )}
      
      <div className="print-content bg-white p-6 border rounded-lg shadow-sm">
        {/* رأس الأمر */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-2">جمهورية العراق</h1>
          <h2 className="text-lg font-semibold mb-1">وزارة الخدمة المدنية</h2>
          <div className="flex justify-between items-center mt-6">
            <div className="text-right">
              <div className="mb-2">
                {!printMode ? (
                  <div>
                    <Label htmlFor="order-number">رقم الأمر</Label>
                    <Input
                      id="order-number"
                      value={orderDetails.orderNumber}
                      onChange={(e) => setOrderDetails({ ...orderDetails, orderNumber: e.target.value })}
                      className="max-w-xs"
                      dir="rtl"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold">الرقم: </span>
                    <span>{orderDetails.orderNumber}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-left">
              <div className="mb-2">
                {!printMode ? (
                  <div>
                    <Label htmlFor="order-date">التاريخ</Label>
                    <Input
                      id="order-date"
                      type="date"
                      value={orderDetails.orderDate}
                      onChange={(e) => setOrderDetails({ ...orderDetails, orderDate: e.target.value })}
                      className="max-w-xs"
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold">التاريخ: </span>
                    <span>{formatDate(orderDetails.orderDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* موضوع الأمر */}
        <div className="mb-6 text-center">
          {!printMode ? (
            <div>
              <Label htmlFor="subject">الموضوع</Label>
              <Input
                id="subject"
                value={orderDetails.subject}
                onChange={(e) => setOrderDetails({ ...orderDetails, subject: e.target.value })}
                dir="rtl"
              />
            </div>
          ) : (
            <h3 className="text-lg font-bold underline">{orderDetails.subject}</h3>
          )}
        </div>

        {/* محتوى الأمر */}
        <div className="mb-8">
          {!printMode ? (
            <div>
              <Label htmlFor="content">المحتوى</Label>
              <Textarea
                id="content"
                value={orderDetails.content}
                onChange={(e) => setOrderDetails({ ...orderDetails, content: e.target.value })}
                rows={6}
                dir="rtl"
              />
            </div>
          ) : (
            <p className="text-lg leading-relaxed mb-6">{orderDetails.content}</p>
          )}
        </div>

        {/* أعضاء اللجنة */}
        <div className="mb-6">
          {!printMode && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">أعضاء اللجنة</h3>
              <p className="text-sm text-gray-600 mb-4">
                يجب إضافة على الأقل 3 أعضاء للجنة مع تحديد مناصبهم.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {orderDetails.committeeMembers.map((member, index) => (
                  <CommitteeMember
                    key={index}
                    name={member.name}
                    position={member.position}
                    onChange={handleCommitteeMemberChange}
                    onRemove={() => handleRemoveMember(index)}
                    index={index}
                  />
                ))}
              </div>
              <Button onClick={handleAddMember} variant="outline" className="mt-2">
                إضافة عضو جديد
              </Button>
            </div>
          )}

          {printMode && (
            <div className="mt-16">
              <p className="text-center mb-4 font-medium">اللجنة</p>
              <div className="flex flex-col space-y-12">
                {orderDetails.committeeMembers.map((member, index) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex-1 text-center border-b border-dashed border-gray-300 pb-1">
                      <p className="font-semibold">{member.name || "_______________"}</p>
                      <p className="text-sm mt-1">{member.position}</p>
                    </div>
                    {index < orderDetails.committeeMembers.length - 1 && (
                      <div className="mx-8"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* التذييل */}
        {!printMode ? (
          <div className="mb-4">
            <Label htmlFor="footer">تذييل الأمر</Label>
            <Input
              id="footer"
              value={orderDetails.footer}
              onChange={(e) => setOrderDetails({ ...orderDetails, footer: e.target.value })}
              dir="rtl"
            />
          </div>
        ) : (
          <div className="text-center mt-12">
            <p>{orderDetails.footer}</p>
          </div>
        )}
      </div>

      {!printMode && (
        <div className="flex justify-between mt-6">
          <Button onClick={() => { window.location.href = "/"; }} variant="outline">
            العودة
          </Button>
          <div className="space-x-4 space-x-reverse">
            <Button 
              onClick={handlePrint} 
              className="bg-green-600 hover:bg-green-700" 
              disabled={!isFormValid()}
            >
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            <Button className="bg-primary-600 hover:bg-primary-700" disabled={!isFormValid()}>
              <Save className="ml-2 h-4 w-4" />
              حفظ
            </Button>
          </div>
        </div>
      )}

      <style>
        {`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
          .print-mode .print-hide {
            display: none;
          }
        }
        `}
      </style>
    </div>
  );
};

export default AllowanceOrderPage;