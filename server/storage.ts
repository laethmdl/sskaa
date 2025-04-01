import { 
  users, type User, type InsertUser,
  workplaces, type Workplace, type InsertWorkplace,
  jobTitles, type JobTitle, type InsertJobTitle,
  educationalQualifications, type EducationalQualification, type InsertEducationalQualification,
  employees, type Employee, type InsertEmployee,
  appreciations, type Appreciation, type InsertAppreciation,
  allowancePromotions, type AllowancePromotion, type InsertAllowancePromotion,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";
import session from "express-session";
import { DbStorage } from "./db-storage";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Workplace operations
  createWorkplace(workplace: InsertWorkplace): Promise<Workplace>;
  getWorkplaces(): Promise<Workplace[]>;
  getWorkplace(id: number): Promise<Workplace | undefined>;
  updateWorkplace(id: number, workplace: Partial<InsertWorkplace>): Promise<Workplace | undefined>;
  deleteWorkplace(id: number): Promise<boolean>;

  // Job Title operations
  createJobTitle(jobTitle: InsertJobTitle): Promise<JobTitle>;
  getJobTitles(): Promise<JobTitle[]>;
  getJobTitle(id: number): Promise<JobTitle | undefined>;
  updateJobTitle(id: number, jobTitle: Partial<InsertJobTitle>): Promise<JobTitle | undefined>;
  deleteJobTitle(id: number): Promise<boolean>;

  // Educational Qualification operations
  createEducationalQualification(qualification: InsertEducationalQualification): Promise<EducationalQualification>;
  getEducationalQualifications(): Promise<EducationalQualification[]>;
  getEducationalQualification(id: number): Promise<EducationalQualification | undefined>;
  updateEducationalQualification(id: number, qualification: Partial<InsertEducationalQualification>): Promise<EducationalQualification | undefined>;
  deleteEducationalQualification(id: number): Promise<boolean>;

  // Employee operations
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Appreciation operations
  createAppreciation(appreciation: InsertAppreciation): Promise<Appreciation>;
  getAppreciations(): Promise<Appreciation[]>;
  getAppreciationsByEmployee(employeeId: number): Promise<Appreciation[]>;
  getAppreciation(id: number): Promise<Appreciation | undefined>;
  updateAppreciation(id: number, appreciation: Partial<InsertAppreciation>): Promise<Appreciation | undefined>;
  deleteAppreciation(id: number): Promise<boolean>;

  // Allowance/Promotion operations
  createAllowancePromotion(allowancePromotion: InsertAllowancePromotion): Promise<AllowancePromotion>;
  getAllowancePromotions(): Promise<AllowancePromotion[]>;
  getPendingAllowancePromotions(): Promise<AllowancePromotion[]>;
  getAllowancePromotionsByEmployee(employeeId: number): Promise<AllowancePromotion[]>;
  getAllowancePromotion(id: number): Promise<AllowancePromotion | undefined>;
  updateAllowancePromotion(id: number, allowancePromotion: Partial<InsertAllowancePromotion>): Promise<AllowancePromotion | undefined>;
  processAllowancePromotion(id: number, status: string, userId: number): Promise<AllowancePromotion | undefined>;
  deleteAllowancePromotion(id: number): Promise<boolean>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(): Promise<Notification[]>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workplaces: Map<number, Workplace>;
  private jobTitles: Map<number, JobTitle>;
  private educationalQualifications: Map<number, EducationalQualification>;
  private employees: Map<number, Employee>;
  private appreciations: Map<number, Appreciation>;
  private allowancePromotions: Map<number, AllowancePromotion>;
  private notifications: Map<number, Notification>;

  // Current IDs for autoincrement
  private userIdCounter: number;
  private workplaceIdCounter: number;
  private jobTitleIdCounter: number;
  private eduQualIdCounter: number;
  private employeeIdCounter: number;
  private appreciationIdCounter: number;
  private allowancePromotionIdCounter: number;
  private notificationIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.workplaces = new Map();
    this.jobTitles = new Map();
    this.educationalQualifications = new Map();
    this.employees = new Map();
    this.appreciations = new Map();
    this.allowancePromotions = new Map();
    this.notifications = new Map();

    this.userIdCounter = 1;
    this.workplaceIdCounter = 1;
    this.jobTitleIdCounter = 1;
    this.eduQualIdCounter = 1;
    this.employeeIdCounter = 1;
    this.appreciationIdCounter = 1;
    this.allowancePromotionIdCounter = 1;
    this.notificationIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // إضافة مستخدم إداري افتراضي 
    const adminUser: User = {
      id: this.userIdCounter++,
      username: "admin",
      password: "admin123",
      name: "مدير النظام",
      role: "admin",
      email: "admin@example.com"
    };
    this.users.set(adminUser.id, adminUser);
    console.log("تم إنشاء حساب المسؤول بنجاح");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { id, ...user };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...userData };
    this.users.set(id, updated);
    return updated;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // حماية حساب المسؤول الرئيسي من الحذف
    if (id === 1) return false;
    return this.users.delete(id);
  }

  // Workplace operations
  async createWorkplace(workplace: InsertWorkplace): Promise<Workplace> {
    const id = this.workplaceIdCounter++;
    const newWorkplace: Workplace = { id, ...workplace };
    this.workplaces.set(id, newWorkplace);
    return newWorkplace;
  }

  async getWorkplaces(): Promise<Workplace[]> {
    return Array.from(this.workplaces.values());
  }

  async getWorkplace(id: number): Promise<Workplace | undefined> {
    return this.workplaces.get(id);
  }

  async updateWorkplace(id: number, workplace: Partial<InsertWorkplace>): Promise<Workplace | undefined> {
    const existing = this.workplaces.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...workplace };
    this.workplaces.set(id, updated);
    return updated;
  }

  async deleteWorkplace(id: number): Promise<boolean> {
    return this.workplaces.delete(id);
  }

  // Job Title operations
  async createJobTitle(jobTitle: InsertJobTitle): Promise<JobTitle> {
    const id = this.jobTitleIdCounter++;
    const newJobTitle: JobTitle = { id, ...jobTitle };
    this.jobTitles.set(id, newJobTitle);
    return newJobTitle;
  }

  async getJobTitles(): Promise<JobTitle[]> {
    return Array.from(this.jobTitles.values());
  }

  async getJobTitle(id: number): Promise<JobTitle | undefined> {
    return this.jobTitles.get(id);
  }

  async updateJobTitle(id: number, jobTitle: Partial<InsertJobTitle>): Promise<JobTitle | undefined> {
    const existing = this.jobTitles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...jobTitle };
    this.jobTitles.set(id, updated);
    return updated;
  }

  async deleteJobTitle(id: number): Promise<boolean> {
    return this.jobTitles.delete(id);
  }

  // Educational Qualification operations
  async createEducationalQualification(qualification: InsertEducationalQualification): Promise<EducationalQualification> {
    const id = this.eduQualIdCounter++;
    const newQualification: EducationalQualification = { id, ...qualification };
    this.educationalQualifications.set(id, newQualification);
    return newQualification;
  }

  async getEducationalQualifications(): Promise<EducationalQualification[]> {
    return Array.from(this.educationalQualifications.values());
  }

  async getEducationalQualification(id: number): Promise<EducationalQualification | undefined> {
    return this.educationalQualifications.get(id);
  }

  async updateEducationalQualification(id: number, qualification: Partial<InsertEducationalQualification>): Promise<EducationalQualification | undefined> {
    const existing = this.educationalQualifications.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...qualification };
    this.educationalQualifications.set(id, updated);
    return updated;
  }

  async deleteEducationalQualification(id: number): Promise<boolean> {
    return this.educationalQualifications.delete(id);
  }

  // Employee operations
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeIdCounter++;
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const newEmployee: Employee = { id, fullName, ...employee };
    
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    // Update full name if first or last name changes
    let fullName = existing.fullName;
    if (employee.firstName || employee.lastName) {
      const firstName = employee.firstName || existing.firstName;
      const lastName = employee.lastName || existing.lastName;
      fullName = `${firstName} ${lastName}`;
    }
    
    const updated = { ...existing, ...employee, fullName };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Appreciation operations
  async createAppreciation(appreciation: InsertAppreciation): Promise<Appreciation> {
    const id = this.appreciationIdCounter++;
    const newAppreciation: Appreciation = { id, ...appreciation };
    
    this.appreciations.set(id, newAppreciation);
    return newAppreciation;
  }

  async getAppreciations(): Promise<Appreciation[]> {
    return Array.from(this.appreciations.values());
  }

  async getAppreciationsByEmployee(employeeId: number): Promise<Appreciation[]> {
    return Array.from(this.appreciations.values()).filter(
      appreciation => appreciation.employeeId === employeeId
    );
  }

  async getAppreciation(id: number): Promise<Appreciation | undefined> {
    return this.appreciations.get(id);
  }

  async updateAppreciation(id: number, appreciation: Partial<InsertAppreciation>): Promise<Appreciation | undefined> {
    const existing = this.appreciations.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...appreciation };
    this.appreciations.set(id, updated);
    return updated;
  }

  async deleteAppreciation(id: number): Promise<boolean> {
    return this.appreciations.delete(id);
  }

  // Allowance/Promotion operations
  async createAllowancePromotion(allowancePromotion: InsertAllowancePromotion): Promise<AllowancePromotion> {
    const id = this.allowancePromotionIdCounter++;
    const newAllowancePromotion: AllowancePromotion = { 
      id, 
      ...allowancePromotion,
      processedAt: null,
      processedBy: null
    };
    
    this.allowancePromotions.set(id, newAllowancePromotion);
    return newAllowancePromotion;
  }

  async getAllowancePromotions(): Promise<AllowancePromotion[]> {
    return Array.from(this.allowancePromotions.values());
  }

  async getPendingAllowancePromotions(): Promise<AllowancePromotion[]> {
    return Array.from(this.allowancePromotions.values()).filter(
      ap => ap.status === 'pending'
    );
  }

  async getAllowancePromotionsByEmployee(employeeId: number): Promise<AllowancePromotion[]> {
    return Array.from(this.allowancePromotions.values()).filter(
      ap => ap.employeeId === employeeId
    );
  }

  async getAllowancePromotion(id: number): Promise<AllowancePromotion | undefined> {
    return this.allowancePromotions.get(id);
  }

  async updateAllowancePromotion(id: number, allowancePromotion: Partial<InsertAllowancePromotion>): Promise<AllowancePromotion | undefined> {
    const existing = this.allowancePromotions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...allowancePromotion };
    this.allowancePromotions.set(id, updated);
    return updated;
  }

  async processAllowancePromotion(id: number, status: string, userId: number): Promise<AllowancePromotion | undefined> {
    const existing = this.allowancePromotions.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      status,
      processedAt: new Date(),
      processedBy: userId
    };
    
    this.allowancePromotions.set(id, updated);
    return updated;
  }

  async deleteAllowancePromotion(id: number): Promise<boolean> {
    return this.allowancePromotions.delete(id);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification: Notification = { 
      id, 
      ...notification,
      isRead: false,
      createdAt: new Date()
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId || notification.userId === null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => 
        (notification.userId === userId || notification.userId === null) && 
        !notification.isRead
      ).length;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updated = { ...notification, isRead: true };
    this.notifications.set(id, updated);
    return updated;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    let success = true;
    
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId || notification.userId === null)
      .forEach(notification => {
        if (!notification.isRead) {
          const updated = { ...notification, isRead: true };
          this.notifications.set(notification.id, updated);
        }
      });
    
    return success;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
}

// استخدام قاعدة البيانات
export const storage = new DbStorage();
