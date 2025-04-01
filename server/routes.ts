import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage";
import { setupAuth, hashPassword } from "./auth";
import { checkDueAllowancesAndPromotions } from "./notifications-scheduler";
import { importEmployeesFromExcel, exportEmployeesToExcel, createTemplateExcel } from "./excel-handlers";
import multer from "multer";
import path from "path";
import { 
  insertWorkplaceSchema, 
  insertJobTitleSchema, 
  insertEducationalQualificationSchema,
  insertEmployeeSchema,
  insertAppreciationSchema,
  insertAllowancePromotionSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z, ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // إعداد مخزن مؤقت لتحميل الملفات
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 ميجابايت كحد أقصى
    }
  });
  
  // Set up authentication routes
  setupAuth(app);
  
  // إضافة بيانات أولية عند تشغيل التطبيق
  try {
    console.log("إضافة بيانات أولية للتطبيق...");
    await addInitialData();
    console.log("تم إضافة البيانات الأولية بنجاح");
  } catch (error) {
    console.error("خطأ في إضافة البيانات الأولية:", error);
  }
  
  // ====================== Workplace routes ======================
  app.get("/api/workplaces", async (req, res) => {
    try {
      const workplaces = await storage.getWorkplaces();
      res.json(workplaces);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات مواقع العمل" });
    }
  });
  
  app.get("/api/workplaces/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workplace = await storage.getWorkplace(id);
      
      if (!workplace) {
        return res.status(404).json({ message: "موقع العمل غير موجود" });
      }
      
      res.json(workplace);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات موقع العمل" });
    }
  });
  
  app.post("/api/protected/workplaces", async (req, res) => {
    try {
      const workplace = insertWorkplaceSchema.parse(req.body);
      const newWorkplace = await storage.createWorkplace(workplace);
      res.status(201).json(newWorkplace);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء موقع العمل" });
    }
  });
  
  app.put("/api/protected/workplaces/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workplace = insertWorkplaceSchema.partial().parse(req.body);
      
      const updatedWorkplace = await storage.updateWorkplace(id, workplace);
      
      if (!updatedWorkplace) {
        return res.status(404).json({ message: "موقع العمل غير موجود" });
      }
      
      res.json(updatedWorkplace);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تحديث موقع العمل" });
    }
  });
  
  app.delete("/api/protected/workplaces/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWorkplace(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "موقع العمل غير موجود" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف موقع العمل" });
    }
  });
  
  // ====================== Job Title routes ======================
  app.get("/api/job-titles", async (req, res) => {
    try {
      const jobTitles = await storage.getJobTitles();
      res.json(jobTitles);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات العناوين الوظيفية" });
    }
  });
  
  app.get("/api/job-titles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const jobTitle = await storage.getJobTitle(id);
      
      if (!jobTitle) {
        return res.status(404).json({ message: "العنوان الوظيفي غير موجود" });
      }
      
      res.json(jobTitle);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات العنوان الوظيفي" });
    }
  });
  
  app.post("/api/protected/job-titles", async (req, res) => {
    try {
      const jobTitle = insertJobTitleSchema.parse(req.body);
      const newJobTitle = await storage.createJobTitle(jobTitle);
      res.status(201).json(newJobTitle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء العنوان الوظيفي" });
    }
  });
  
  app.put("/api/protected/job-titles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const jobTitle = insertJobTitleSchema.partial().parse(req.body);
      
      const updatedJobTitle = await storage.updateJobTitle(id, jobTitle);
      
      if (!updatedJobTitle) {
        return res.status(404).json({ message: "العنوان الوظيفي غير موجود" });
      }
      
      res.json(updatedJobTitle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تحديث العنوان الوظيفي" });
    }
  });
  
  app.delete("/api/protected/job-titles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteJobTitle(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "العنوان الوظيفي غير موجود" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف العنوان الوظيفي" });
    }
  });
  
  // ====================== Educational Qualification routes ======================
  app.get("/api/qualifications", async (req, res) => {
    try {
      const qualifications = await storage.getEducationalQualifications();
      res.json(qualifications);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المؤهلات التعليمية" });
    }
  });
  
  app.get("/api/qualifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const qualification = await storage.getEducationalQualification(id);
      
      if (!qualification) {
        return res.status(404).json({ message: "المؤهل التعليمي غير موجود" });
      }
      
      res.json(qualification);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المؤهل التعليمي" });
    }
  });
  
  app.post("/api/protected/qualifications", async (req, res) => {
    try {
      const qualification = insertEducationalQualificationSchema.parse(req.body);
      const newQualification = await storage.createEducationalQualification(qualification);
      res.status(201).json(newQualification);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء المؤهل التعليمي" });
    }
  });
  
  app.put("/api/protected/qualifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const qualification = insertEducationalQualificationSchema.partial().parse(req.body);
      
      const updatedQualification = await storage.updateEducationalQualification(id, qualification);
      
      if (!updatedQualification) {
        return res.status(404).json({ message: "المؤهل التعليمي غير موجود" });
      }
      
      res.json(updatedQualification);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تحديث المؤهل التعليمي" });
    }
  });
  
  app.delete("/api/protected/qualifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEducationalQualification(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "المؤهل التعليمي غير موجود" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف المؤهل التعليمي" });
    }
  });
  
  // ====================== Employee routes ======================
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات الموظفين" });
    }
  });
  
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات الموظف" });
    }
  });
  
  app.post("/api/protected/employees", async (req, res) => {
    try {
      const employee = insertEmployeeSchema.parse(req.body);
      const newEmployee = await storage.createEmployee(employee);
      res.status(201).json(newEmployee);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الموظف" });
    }
  });
  
  app.put("/api/protected/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = insertEmployeeSchema.partial().parse(req.body);
      
      const updatedEmployee = await storage.updateEmployee(id, employee);
      
      if (!updatedEmployee) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      
      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تحديث الموظف" });
    }
  });
  
  app.delete("/api/protected/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف الموظف" });
    }
  });
  
  // ====================== Appreciation routes ======================
  app.get("/api/appreciations", async (req, res) => {
    try {
      const appreciations = await storage.getAppreciations();
      res.json(appreciations);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات التشكرات والعقوبات" });
    }
  });
  
  app.get("/api/employees/:employeeId/appreciations", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const appreciations = await storage.getAppreciationsByEmployee(employeeId);
      res.json(appreciations);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات التشكرات والعقوبات للموظف" });
    }
  });
  
  app.get("/api/appreciations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appreciation = await storage.getAppreciation(id);
      
      if (!appreciation) {
        return res.status(404).json({ message: "التشكر أو العقوبة غير موجودة" });
      }
      
      res.json(appreciation);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات التشكر أو العقوبة" });
    }
  });
  
  app.post("/api/protected/appreciations", async (req, res) => {
    try {
      const appreciation = insertAppreciationSchema.parse(req.body);
      
      // تحديد عدد أشهر الخدمة الإضافية بناءً على نوع كتاب الشكر - حالة عدم تحديدها من قبل المستخدم
      if (appreciation.type === 'appreciation' && (appreciation.additionalServiceMonths === undefined || appreciation.additionalServiceMonths === 0)) {
        if (appreciation.description.includes('كتاب شكر وزاري')) {
          appreciation.additionalServiceMonths = 6;
        } else if (appreciation.description.includes('كتاب شكر مدير عام')) {
          appreciation.additionalServiceMonths = 1;
        }
      }
      
      // في حالة العقوبات، يجب أن تكون قيمة الأشهر الإضافية دائمًا صفر
      if (appreciation.type === 'disciplinary') {
        appreciation.additionalServiceMonths = 0;
      }
      
      const newAppreciation = await storage.createAppreciation(appreciation);
      res.status(201).json(newAppreciation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء التشكر أو العقوبة" });
    }
  });
  
  app.put("/api/protected/appreciations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appreciation = insertAppreciationSchema.partial().parse(req.body);
      
      // في حالة العقوبات، يجب أن تكون قيمة الأشهر الإضافية دائمًا صفر
      if (appreciation.type === 'disciplinary') {
        appreciation.additionalServiceMonths = 0;
      }
      
      const updatedAppreciation = await storage.updateAppreciation(id, appreciation);
      
      if (!updatedAppreciation) {
        return res.status(404).json({ message: "التشكر أو العقوبة غير موجودة" });
      }
      
      res.json(updatedAppreciation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تحديث التشكر أو العقوبة" });
    }
  });
  
  app.delete("/api/protected/appreciations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAppreciation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "التشكر أو العقوبة غير موجودة" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف التشكر أو العقوبة" });
    }
  });
  
  // ====================== Allowance/Promotion routes ======================
  app.get("/api/allowance-promotions", async (req, res) => {
    try {
      const allowancePromotions = await storage.getAllowancePromotions();
      res.json(allowancePromotions);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات العلاوات والترفيعات" });
    }
  });
  
  app.get("/api/pending-allowance-promotions", async (req, res) => {
    try {
      const pendingAllowancePromotions = await storage.getPendingAllowancePromotions();
      res.json(pendingAllowancePromotions);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات العلاوات والترفيعات المعلقة" });
    }
  });
  
  app.get("/api/employees/:employeeId/allowance-promotions", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const allowancePromotions = await storage.getAllowancePromotionsByEmployee(employeeId);
      res.json(allowancePromotions);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات العلاوات والترفيعات للموظف" });
    }
  });
  
  app.get("/api/allowance-promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const allowancePromotion = await storage.getAllowancePromotion(id);
      
      if (!allowancePromotion) {
        return res.status(404).json({ message: "العلاوة أو الترفيع غير موجود" });
      }
      
      res.json(allowancePromotion);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات العلاوة أو الترفيع" });
    }
  });
  
  app.post("/api/protected/allowance-promotions", async (req, res) => {
    try {
      const allowancePromotion = insertAllowancePromotionSchema.parse(req.body);
      const newAllowancePromotion = await storage.createAllowancePromotion(allowancePromotion);
      res.status(201).json(newAllowancePromotion);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء العلاوة أو الترفيع" });
    }
  });
  
  app.put("/api/protected/allowance-promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const allowancePromotion = insertAllowancePromotionSchema.partial().parse(req.body);
      
      const updatedAllowancePromotion = await storage.updateAllowancePromotion(id, allowancePromotion);
      
      if (!updatedAllowancePromotion) {
        return res.status(404).json({ message: "العلاوة أو الترفيع غير موجود" });
      }
      
      res.json(updatedAllowancePromotion);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تحديث العلاوة أو الترفيع" });
    }
  });
  
  app.put("/api/protected/allowance-promotions/:id/process", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح لك بمعالجة العلاوة أو الترفيع" });
      }
      
      const updatedAllowancePromotion = await storage.processAllowancePromotion(id, status, req.user.id);
      
      if (!updatedAllowancePromotion) {
        return res.status(404).json({ message: "العلاوة أو الترفيع غير موجود" });
      }
      
      res.json(updatedAllowancePromotion);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء معالجة العلاوة أو الترفيع" });
    }
  });
  
  app.delete("/api/protected/allowance-promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAllowancePromotion(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "العلاوة أو الترفيع غير موجود" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف العلاوة أو الترفيع" });
    }
  });
  
  // ====================== Notification routes ======================
  
  // مسار API لتشغيل فحص التنبيهات التلقائية للعلاوات والترفيعات
  app.post("/api/protected/check-due-notifications", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه الوظيفة" });
    }
    
    try {
      await checkDueAllowancesAndPromotions();
      res.json({ success: true, message: "تم فحص العلاوات والترفيعات المستحقة بنجاح" });
    } catch (error) {
      console.error("حدث خطأ أثناء فحص العلاوات والترفيعات المستحقة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء فحص العلاوات والترفيعات المستحقة" });
    }
  });
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح لك بمشاهدة الإشعارات" });
      }
      
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب الإشعارات" });
    }
  });
  
  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح لك بمشاهدة الإشعارات" });
      }
      
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب عدد الإشعارات غير المقروءة" });
    }
  });
  
  // ====================== User routes ======================
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      const users = await storage.getUsers();
      
      // استبعاد كلمات المرور قبل إرسال البيانات
      const usersWithoutPasswords = users.map(({ password, ...userData }) => userData);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب المستخدمين" });
    }
  });
  
  app.get("/api/users/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // استبعاد كلمة المرور قبل إرسال البيانات
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المستخدم" });
    }
  });
  
  app.post("/api/protected/users", async (req, res) => {
    try {
      // التحقق من وجود المستخدم
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
      }
      
      // تشفير كلمة المرور
      const hashedPassword = await hashPassword(req.body.password);
      
      // إنشاء المستخدم
      const newUser = await storage.createUser({
        ...req.body,
        password: hashedPassword
      });
      
      // استبعاد كلمة المرور قبل إرسال البيانات
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء المستخدم" });
    }
  });
  
  app.put("/api/protected/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // التحقق من وجود المستخدم
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // إعداد بيانات التحديث
      let userData = { ...req.body };
      
      // إذا تم إرسال كلمة مرور جديدة، نقوم بتشفيرها
      if (userData.password && userData.password.trim() !== '') {
        userData.password = await hashPassword(userData.password);
      } else {
        // إذا لم يتم إرسال كلمة مرور، نحذفها من بيانات التحديث
        delete userData.password;
      }
      
      // تحديث المستخدم
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "فشل في تحديث المستخدم" });
      }
      
      // استبعاد كلمة المرور قبل إرسال البيانات
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء تحديث المستخدم" });
    }
  });
  
  app.delete("/api/protected/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // منع حذف المستخدم admin
      if (id === 1) {
        return res.status(403).json({ message: "لا يمكن حذف حساب المسؤول الرئيسي" });
      }
      
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف المستخدم" });
    }
  });
  
  app.post("/api/protected/notifications", async (req, res) => {
    try {
      const notification = insertNotificationSchema.parse(req.body);
      const newNotification = await storage.createNotification(notification);
      res.status(201).json(newNotification);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء الإشعار" });
    }
  });
  
  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح لك بتعديل الإشعارات" });
      }
      
      const id = parseInt(req.params.id);
      const updatedNotification = await storage.markNotificationAsRead(id);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: "الإشعار غير موجود" });
      }
      
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تعديل حالة الإشعار" });
    }
  });
  
  app.put("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح لك بتعديل الإشعارات" });
      }
      
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء تعديل حالة جميع الإشعارات" });
    }
  });
  
  app.delete("/api/protected/notifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNotification(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "الإشعار غير موجود" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "حدث خطأ أثناء حذف الإشعار" });
    }
  });
  
  // إرسال إشعار تجريبي
  app.post("/api/protected/send-test-notification", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "غير مصرح" });
      }
      
      // إنشاء إشعار تجريبي للمستخدم
      const notification = await storage.createNotification({
        userId: req.user.id,
        title: "إشعار تجريبي",
        message: "هذا إشعار تجريبي تم إنشاؤه بتاريخ " + new Date().toLocaleString('ar'),
        type: "test",
      });
      
      console.log("تم إرسال إشعار تجريبي للمستخدم:", req.user.id);
      res.status(201).json({ message: "تم إرسال الإشعار التجريبي بنجاح", notification });
    } catch (error) {
      console.error("حدث خطأ أثناء إرسال الإشعار التجريبي:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الإشعار التجريبي" });
    }
  });
  
  // التحقق يدويًا من العلاوات والترفيعات المستحقة
  app.post("/api/protected/check-due-notifications", async (req, res) => {
    try {
      console.log("تم طلب فحص العلاوات والترفيعات المستحقة يدويًا...");
      await checkDueAllowancesAndPromotions();
      console.log("تم الانتهاء من فحص العلاوات والترفيعات المستحقة يدويًا");
      res.status(200).json({ message: "تم فحص العلاوات والترفيعات المستحقة بنجاح" });
    } catch (error) {
      console.error("حدث خطأ أثناء فحص العلاوات والترفيعات المستحقة:", error);
      res.status(500).json({ message: "حدث خطأ أثناء فحص العلاوات والترفيعات المستحقة" });
    }
  });
  
  // ====================== Excel Import/Export routes ======================
  
  // تحميل نموذج إكسل فارغ
  app.get("/api/employees/excel/template", async (req, res) => {
    try {
      const templateBuffer = createTemplateExcel();
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=employee_template.xlsx',
        'Content-Length': templateBuffer.length
      });
      
      res.send(templateBuffer);
    } catch (error) {
      console.error("خطأ في إنشاء نموذج الإكسل:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء نموذج الإكسل" });
    }
  });
  
  // تصدير بيانات الموظفين إلى ملف إكسل
  app.get("/api/employees/excel/export", async (req, res) => {
    try {
      const excelBuffer = await exportEmployeesToExcel();
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=employee_data.xlsx',
        'Content-Length': excelBuffer.length
      });
      
      res.send(excelBuffer);
    } catch (error) {
      console.error("خطأ في تصدير بيانات الموظفين:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تصدير بيانات الموظفين" });
    }
  });
  
  // استيراد بيانات الموظفين من ملف إكسل
  app.post("/api/protected/employees/excel/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم تحميل أي ملف" });
      }
      
      const result = await importEmployeesFromExcel(req.file.buffer);
      
      if (result.success) {
        res.status(200).json({ 
          message: `تم استيراد ${result.count} موظف بنجاح`,
          count: result.count,
          errors: result.errors
        });
      } else {
        res.status(400).json({ 
          message: "فشل استيراد الموظفين", 
          errors: result.errors 
        });
      }
    } catch (error) {
      console.error("خطأ في استيراد بيانات الموظفين:", error);
      res.status(500).json({ message: "حدث خطأ أثناء استيراد بيانات الموظفين" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // جدولة فحص العلاوات والترفيعات المستحقة عند بدء التطبيق
  setTimeout(async () => {
    try {
      console.log("بدء جدولة فحص العلاوات والترفيعات المستحقة...");
      await checkDueAllowancesAndPromotions();
      console.log("تم الانتهاء من فحص العلاوات والترفيعات المستحقة المجدول");
      
      // جدولة فحص يومي للعلاوات والترفيعات المستحقة (كل 24 ساعة)
      setInterval(async () => {
        console.log("بدء فحص العلاوات والترفيعات المستحقة المجدول يوميًا...");
        await checkDueAllowancesAndPromotions();
        console.log("تم الانتهاء من فحص العلاوات والترفيعات المستحقة المجدول يوميًا");
      }, 24 * 60 * 60 * 1000); // 24 ساعة
    } catch (error) {
      console.error("حدث خطأ أثناء جدولة فحص العلاوات والترفيعات المستحقة:", error);
    }
  }, 10000); // انتظر 10 ثواني بعد بدء التطبيق ثم قم بالفحص

  return httpServer;
}

// وظيفة لإضافة بيانات أولية للتطبيق
async function addInitialData() {
  try {
    console.log("إضافة بيانات أولية للتطبيق...");
    
    // التحقق من وجود مواقع عمل
    const workplaces = await storage.getWorkplaces();
    if (workplaces.length === 0) {
      await storage.createWorkplace({ name: "وزارة التربية والتعليم", description: "المقر الرئيسي" });
      await storage.createWorkplace({ name: "مديرية التربية - بغداد", description: "مديرية تربية بغداد" });
      await storage.createWorkplace({ name: "مديرية التربية - البصرة", description: "مديرية تربية البصرة" });
      console.log("تم إضافة مواقع العمل");
    }
    
    // التحقق من وجود عناوين وظيفية
    const jobTitles = await storage.getJobTitles();
    if (jobTitles.length === 0) {
      await storage.createJobTitle({ title: "معلم", description: "معلم صف", grade: 8 });
      await storage.createJobTitle({ title: "مدرس", description: "مدرس مادة", grade: 7 });
      await storage.createJobTitle({ title: "مدير مدرسة", description: "مدير مدرسة", grade: 5 });
      await storage.createJobTitle({ title: "موظف إداري", description: "موظف إداري", grade: 9 });
      await storage.createJobTitle({ title: "مشرف تربوي", description: "مشرف تربوي", grade: 6 });
      console.log("تم إضافة العناوين الوظيفية");
    }
    
    // التحقق من وجود مؤهلات تعليمية
    const eduQuals = await storage.getEducationalQualifications();
    if (eduQuals.length === 0) {
      await storage.createEducationalQualification({ name: "بكالوريوس تربية", level: 1, description: "بكالوريوس في التربية" });
      await storage.createEducationalQualification({ name: "بكالوريوس آداب", level: 1, description: "بكالوريوس في الآداب" });
      await storage.createEducationalQualification({ name: "ماجستير تربية", level: 2, description: "ماجستير في التربية" });
      await storage.createEducationalQualification({ name: "دبلوم معلمين", level: 3, description: "دبلوم معهد إعداد المعلمين" });
      console.log("تم إضافة المؤهلات التعليمية");
    }
    
    // التحقق من وجود موظفين
    const employees = await storage.getEmployees();
    if (employees.length === 0) {
      await storage.createEmployee({
        employeeNumber: "100001",
        firstName: "أحمد",
        lastName: "محمد",
        hiringDate: "2010-05-15",
        currentGrade: 7,
        dateOfBirth: "1980-03-10",
        phoneNumber: "07701234567",
        email: "ahmed@example.com",
        educationalQualificationId: 1,
        jobTitleId: 2,
        workplaceId: 1,
        status: "active",
      });
      
      await storage.createEmployee({
        employeeNumber: "100002",
        firstName: "فاطمة",
        lastName: "علي",
        hiringDate: "2015-09-01",
        currentGrade: 8,
        dateOfBirth: "1985-11-20",
        phoneNumber: "07707654321",
        email: "fatima@example.com",
        educationalQualificationId: 4,
        jobTitleId: 1,
        workplaceId: 2,
        status: "active",
      });
      
      await storage.createEmployee({
        employeeNumber: "100003",
        firstName: "محمد",
        lastName: "جاسم",
        hiringDate: "2005-03-20",
        currentGrade: 5,
        dateOfBirth: "1975-06-15",
        phoneNumber: "07709876543",
        email: "mohammed@example.com",
        educationalQualificationId: 3,
        jobTitleId: 3,
        workplaceId: 1,
        status: "active",
      });
      
      await storage.createEmployee({
        employeeNumber: "100004",
        firstName: "زينب",
        lastName: "عباس",
        hiringDate: "2012-07-10",
        currentGrade: 9,
        dateOfBirth: "1988-04-12",
        phoneNumber: "07714567890",
        email: "zainab@example.com",
        educationalQualificationId: 2,
        jobTitleId: 4,
        workplaceId: 3,
        status: "active",
      });
      
      await storage.createEmployee({
        employeeNumber: "100005",
        firstName: "علي",
        lastName: "حسين",
        hiringDate: "2008-11-05",
        currentGrade: 6,
        dateOfBirth: "1978-09-25",
        phoneNumber: "07712345678",
        email: "ali@example.com",
        educationalQualificationId: 1,
        jobTitleId: 5,
        workplaceId: 2,
        status: "active",
      });
      
      console.log("تم إضافة الموظفين");
      
      // إضافة علاوات وترقيات
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const twoMonthsLater = new Date(today.getFullYear(), today.getMonth() + 2, 15);
      
      await storage.createAllowancePromotion({
        type: "allowance",
        employeeId: 1,
        dueDate: nextMonth.toISOString().slice(0, 10),
        status: "pending",
        notes: "استحقاق علاوة سنوية",
      });
      
      await storage.createAllowancePromotion({
        type: "promotion",
        employeeId: 3,
        dueDate: twoMonthsLater.toISOString().slice(0, 10),
        status: "pending",
        notes: "ترقية إلى درجة أعلى",
      });
      
      console.log("تم إضافة العلاوات والترقيات");
      
      // إضافة تقديرات
      await storage.createAppreciation({
        employeeId: 2,
        description: "شكر وتقدير - للجهود المتميزة في تنفيذ المهام التربوية",
        date: today.toISOString().slice(0, 10),
        issuedBy: "مدير عام التربية",
        type: "شكر",
      });
      
      console.log("تم إضافة التقديرات");
    }
    
    console.log("اكتملت إضافة البيانات الأولية");
  } catch (error) {
    console.error("حدث خطأ أثناء إضافة البيانات الأولية:", error);
  }
}
