import * as xlsx from 'xlsx';
import { storage } from './db-storage';
import { InsertEmployee } from '@shared/schema';

// استيراد الموظفين من ملف اكسل
export async function importEmployeesFromExcel(fileBuffer: Buffer): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // تحويل البيانات من الورقة إلى مصفوفة من الكائنات
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    const errors: string[] = [];
    let successCount = 0;
    
    // التحقق من وجود الحقول المطلوبة
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      // التحقق من وجود الحقول الإلزامية
      if (!row['رقم الموظف'] || !row['الاسم الأول'] || !row['الاسم الأخير'] || !row['تاريخ التعيين'] || !row['الدرجة الحالية']) {
        errors.push(`صف ${i + 2}: بيانات إلزامية مفقودة`);
        continue;
      }
      
      try {
        // تحويل البيانات من الصف إلى نموذج الموظف
        const employee: Partial<InsertEmployee> = {
          employeeNumber: row['رقم الموظف'].toString(),
          firstName: row['الاسم الأول'],
          lastName: row['الاسم الأخير'],
          hiringDate: formatDate(row['تاريخ التعيين']),
          currentGrade: parseInt(row['الدرجة الحالية']),
          dateOfBirth: row['تاريخ الميلاد'] ? formatDate(row['تاريخ الميلاد']) : null,
          email: row['البريد الإلكتروني'] || null,
          phoneNumber: row['رقم الهاتف'] || null,
          status: row['الحالة'] || 'active',
        };
        
        // البحث عن المؤهل التعليمي
        if (row['المؤهل التعليمي']) {
          const qualifications = await storage.getEducationalQualifications();
          const qualification = qualifications.find(q => q.name === row['المؤهل التعليمي']);
          if (qualification) {
            employee.educationalQualificationId = qualification.id;
          } else {
            errors.push(`صف ${i + 2}: المؤهل التعليمي '${row['المؤهل التعليمي']}' غير موجود`);
          }
        }
        
        // البحث عن العنوان الوظيفي
        if (row['العنوان الوظيفي']) {
          const titles = await storage.getJobTitles();
          const title = titles.find(t => t.title === row['العنوان الوظيفي']);
          if (title) {
            employee.jobTitleId = title.id;
          } else {
            errors.push(`صف ${i + 2}: العنوان الوظيفي '${row['العنوان الوظيفي']}' غير موجود`);
          }
        }
        
        // البحث عن مكان العمل
        if (row['مكان العمل']) {
          const workplaces = await storage.getWorkplaces();
          const workplace = workplaces.find(w => w.name === row['مكان العمل']);
          if (workplace) {
            employee.workplaceId = workplace.id;
          } else {
            errors.push(`صف ${i + 2}: مكان العمل '${row['مكان العمل']}' غير موجود`);
          }
        }
        
        // التحقق من عدم وجود موظف بنفس الرقم
        const existingEmployees = await storage.getEmployees();
        const existingEmployee = existingEmployees.find(e => e.employeeNumber === employee.employeeNumber);
        
        if (existingEmployee) {
          errors.push(`صف ${i + 2}: رقم الموظف '${employee.employeeNumber}' موجود بالفعل`);
          continue;
        }
        
        // إضافة الموظف إلى قاعدة البيانات
        await storage.createEmployee(employee as InsertEmployee);
        successCount++;
        
      } catch (error) {
        errors.push(`صف ${i + 2}: ${(error as Error).message}`);
      }
    }
    
    return {
      success: successCount > 0,
      count: successCount,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      count: 0,
      errors: [(error as Error).message]
    };
  }
}

// تصدير الموظفين إلى ملف إكسل
export async function exportEmployeesToExcel(): Promise<Buffer> {
  // الحصول على جميع البيانات المطلوبة
  const employees = await storage.getEmployees();
  const jobTitles = await storage.getJobTitles();
  const workplaces = await storage.getWorkplaces();
  const qualifications = await storage.getEducationalQualifications();
  
  // إعداد بيانات التصدير
  const data = employees.map(employee => {
    const jobTitle = jobTitles.find(j => j.id === employee.jobTitleId);
    const workplace = workplaces.find(w => w.id === employee.workplaceId);
    const qualification = qualifications.find(q => q.id === employee.educationalQualificationId);
    
    return {
      'رقم الموظف': employee.employeeNumber,
      'الاسم الأول': employee.firstName,
      'الاسم الأخير': employee.lastName,
      'الاسم الكامل': employee.fullName,
      'تاريخ التعيين': employee.hiringDate,
      'الدرجة الحالية': employee.currentGrade,
      'البريد الإلكتروني': employee.email || '',
      'رقم الهاتف': employee.phoneNumber || '',
      'تاريخ الميلاد': employee.dateOfBirth || '',
      'العنوان الوظيفي': jobTitle?.title || '',
      'مكان العمل': workplace?.name || '',
      'المؤهل التعليمي': qualification?.name || '',
      'الحالة': employee.status || 'active',
      'تاريخ التقاعد': employee.retirementDate || '',
    };
  });
  
  // إنشاء ورقة عمل
  const worksheet = xlsx.utils.json_to_sheet(data);
  
  // إنشاء كتاب عمل وإضافة ورقة العمل
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'الموظفين');
  
  // تعديل عرض الأعمدة
  const colWidths = [
    { wch: 10 }, // رقم الموظف
    { wch: 15 }, // الاسم الأول
    { wch: 15 }, // الاسم الأخير
    { wch: 25 }, // الاسم الكامل
    { wch: 12 }, // تاريخ التعيين
    { wch: 10 }, // الدرجة الحالية
    { wch: 25 }, // البريد الإلكتروني
    { wch: 15 }, // رقم الهاتف
    { wch: 12 }, // تاريخ الميلاد
    { wch: 15 }, // العنوان الوظيفي
    { wch: 20 }, // مكان العمل
    { wch: 20 }, // المؤهل التعليمي
    { wch: 10 }, // الحالة
    { wch: 12 }, // تاريخ التقاعد
  ];
  
  worksheet['!cols'] = colWidths;
  
  // تحويل الكتاب إلى بايت
  const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return excelBuffer;
}

// إنشاء ملف إكسل نموذجي
export function createTemplateExcel(): Buffer {
  // إنشاء البيانات النموذجية
  const data = [
    {
      'رقم الموظف': '100006',
      'الاسم الأول': 'محمود',
      'الاسم الأخير': 'سعيد',
      'تاريخ التعيين': '2021-01-15',
      'الدرجة الحالية': 8,
      'البريد الإلكتروني': 'mahmoud@example.com',
      'رقم الهاتف': '07700123456',
      'تاريخ الميلاد': '1990-05-20',
      'العنوان الوظيفي': 'معلم',
      'مكان العمل': 'وزارة التربية والتعليم',
      'المؤهل التعليمي': 'بكالوريوس تربية',
      'الحالة': 'active',
    }
  ];
  
  // إنشاء ورقة عمل
  const worksheet = xlsx.utils.json_to_sheet(data);
  
  // إضافة ملاحظات في أعلى الورقة
  xlsx.utils.sheet_add_aoa(worksheet, [
    ['نموذج استيراد بيانات الموظفين - يجب ملء الحقول الإلزامية (رقم الموظف، الاسم الأول، الاسم الأخير، تاريخ التعيين، الدرجة الحالية)'],
    ['الحقول الأخرى اختيارية. تنسيق التاريخ: YYYY-MM-DD (مثال: 2021-01-15)'],
    ['']
  ], { origin: 'A1' });
  
  // إنشاء كتاب عمل وإضافة ورقة العمل
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'نموذج الموظفين');
  
  // تعديل عرض الأعمدة
  const colWidths = [
    { wch: 10 }, // رقم الموظف
    { wch: 15 }, // الاسم الأول
    { wch: 15 }, // الاسم الأخير
    { wch: 12 }, // تاريخ التعيين
    { wch: 10 }, // الدرجة الحالية
    { wch: 25 }, // البريد الإلكتروني
    { wch: 15 }, // رقم الهاتف
    { wch: 12 }, // تاريخ الميلاد
    { wch: 15 }, // العنوان الوظيفي
    { wch: 20 }, // مكان العمل
    { wch: 20 }, // المؤهل التعليمي
    { wch: 10 }, // الحالة
  ];
  
  worksheet['!cols'] = colWidths;
  
  // تعديل ارتفاع الصفوف الأولى (الملاحظات)
  worksheet['!rows'] = [{ hpt: 30 }, { hpt: 30 }];
  
  // تحويل الكتاب إلى بايت
  const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return excelBuffer;
}

// دالة مساعدة لتنسيق التاريخ
function formatDate(date: any): string {
  if (!date) return '';
  
  if (typeof date === 'string') {
    // التحقق من تنسيق التاريخ
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
  }
  
  // محاولة تحويل التاريخ
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('تاريخ غير صالح');
    }
    
    // تنسيق التاريخ بصيغة YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    throw new Error('تنسيق التاريخ غير صالح. الصيغة المطلوبة: YYYY-MM-DD');
  }
}