import { storage } from "./db-storage";
import { employees, notifications, insertNotificationSchema } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";

// دالة لإرسال إشعارات العلاوات والترفيعات المستحقة
export async function checkDueAllowancesAndPromotions() {
  try {
    console.log("جاري فحص العلاوات والترفيعات المستحقة...");
    
    // الحصول على قائمة الموظفين النشطين
    const activeEmployees = await storage.getEmployees();
    
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);
    
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(today.getMonth() + 2);
    
    // تنسيق التواريخ بتنسيق SQL
    const formatSQLDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    console.log(`البحث عن العلاوات المستحقة قبل: ${formatSQLDate(oneMonthLater)}`);
    console.log(`البحث عن الترفيعات المستحقة قبل: ${formatSQLDate(twoMonthsLater)}`);

    // التحقق من كل موظف
    for (const employee of activeEmployees) {
      // التحقق من العلاوات (قبل شهر واحد)
      const nextAllowanceDate = getNextAllowanceDate(employee.hiringDate);
      
      if (nextAllowanceDate && isDateWithinRange(nextAllowanceDate, today, oneMonthLater)) {
        // إذا كانت العلاوة مستحقة خلال الشهر القادم
        const existingNotifications = await getExistingNotifications(
          employee.id, 
          "allowance", 
          nextAllowanceDate
        );
        
        if (existingNotifications.length === 0) {
          // إنشاء إشعار جديد إذا لم يتم إنشاء إشعار سابق
          await createDueNotification(
            employee.id,
            "علاوة مستحقة قريبًا",
            `الموظف ${employee.fullName} لديه علاوة مستحقة بتاريخ ${formatSQLDate(nextAllowanceDate)}`,
            "allowance"
          );
          console.log(`تم إنشاء إشعار علاوة للموظف: ${employee.fullName}`);
        }
      }
      
      // التحقق من الترفيعات (قبل شهرين)
      const nextPromotionDate = getNextPromotionDate(employee.hiringDate);
      
      if (nextPromotionDate && isDateWithinRange(nextPromotionDate, today, twoMonthsLater)) {
        // إذا كان الترفيع مستحق خلال الشهرين القادمين
        const existingNotifications = await getExistingNotifications(
          employee.id, 
          "promotion", 
          nextPromotionDate
        );
        
        if (existingNotifications.length === 0) {
          // إنشاء إشعار جديد إذا لم يتم إنشاء إشعار سابق
          await createDueNotification(
            employee.id,
            "ترفيع مستحق قريبًا",
            `الموظف ${employee.fullName} لديه ترفيع مستحق بتاريخ ${formatSQLDate(nextPromotionDate)}`,
            "promotion"
          );
          console.log(`تم إنشاء إشعار ترفيع للموظف: ${employee.fullName}`);
        }
      }
    }
    
    console.log("تم الانتهاء من فحص العلاوات والترفيعات المستحقة");
  } catch (error) {
    console.error("حدث خطأ أثناء فحص العلاوات والترفيعات المستحقة:", error);
  }
}

// دالة للحصول على تاريخ العلاوة التالية بناءً على تاريخ التعيين
function getNextAllowanceDate(hiringDateStr: string): Date | null {
  try {
    const hiringDate = new Date(hiringDateStr);
    const today = new Date();
    
    // يتم احتساب العلاوة كل سنة من تاريخ التعيين
    const nextAllowanceDate = new Date(hiringDate);
    
    // تعيين السنة إلى السنة الحالية
    nextAllowanceDate.setFullYear(today.getFullYear());
    
    // إذا كان التاريخ في الماضي، أضف سنة واحدة
    if (nextAllowanceDate < today) {
      nextAllowanceDate.setFullYear(today.getFullYear() + 1);
    }
    
    return nextAllowanceDate;
  } catch (error) {
    console.error("خطأ في حساب تاريخ العلاوة التالية:", error);
    return null;
  }
}

// دالة للحصول على تاريخ الترفيع التالي بناءً على تاريخ التعيين
function getNextPromotionDate(hiringDateStr: string): Date | null {
  try {
    const hiringDate = new Date(hiringDateStr);
    const today = new Date();
    
    // يتم احتساب الترفيع كل 4 سنوات من تاريخ التعيين
    const nextPromotionDate = new Date(hiringDate);
    
    // حساب عدد السنوات منذ التعيين
    const yearsSinceHiring = today.getFullYear() - hiringDate.getFullYear();
    
    // حساب العدد التالي من السنوات القابل للقسمة على 4
    const nextFourYearPeriod = Math.ceil((yearsSinceHiring + 1) / 4) * 4;
    
    // تعيين تاريخ الترفيع التالي
    nextPromotionDate.setFullYear(hiringDate.getFullYear() + nextFourYearPeriod);
    
    return nextPromotionDate;
  } catch (error) {
    console.error("خطأ في حساب تاريخ الترفيع التالي:", error);
    return null;
  }
}

// دالة للتحقق مما إذا كان التاريخ يقع ضمن نطاق محدد
function isDateWithinRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

// دالة للتحقق من وجود إشعارات مسبقة
async function getExistingNotifications(
  employeeId: number,
  notificationType: string,
  dueDate: Date
): Promise<any[]> {
  // تنسيق التواريخ للمقارنة في قاعدة البيانات
  const formattedDueDate = dueDate.toISOString().split('T')[0];
  
  // البحث عن الإشعارات المتعلقة بنفس الموظف ونفس النوع ونفس تاريخ الاستحقاق
  return await db.select()
    .from(notifications)
    .where(
      and(
        sql`related_id = ${employeeId}`,
        sql`type = ${notificationType}`,
        sql`related_type = 'employee'`,
        sql`message LIKE ${'%' + formattedDueDate + '%'}`
      )
    ) as any[];
}

// دالة لإنشاء إشعار جديد
async function createDueNotification(
  employeeId: number,
  title: string,
  message: string,
  type: string
): Promise<void> {
  // إنشاء إشعار لجميع المستخدمين الإداريين
  const adminUsers = await storage.getAdminUsers();
  
  for (const user of adminUsers) {
    await storage.createNotification({
      userId: user.id,
      title,
      message,
      type,
      relatedId: employeeId,
      relatedType: 'employee'
    });
  }
}