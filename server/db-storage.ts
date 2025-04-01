import { db } from './db';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
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
import { IStorage } from './storage';

// إنشاء مخزن جلسات PostgreSQL
const PgSessionStore = connectPgSimple(session);

export class DbStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getAdminUsers(): Promise<User[]> {
    return db.select()
      .from(users)
      .where(
        sql`role IN ('admin', 'manager')`
      );
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const results = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const results = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return results.length > 0;
  }

  // Workplace operations
  async createWorkplace(workplace: InsertWorkplace): Promise<Workplace> {
    const results = await db.insert(workplaces).values(workplace).returning();
    return results[0];
  }

  async getWorkplaces(): Promise<Workplace[]> {
    return db.select().from(workplaces);
  }

  async getWorkplace(id: number): Promise<Workplace | undefined> {
    const results = await db.select().from(workplaces).where(eq(workplaces.id, id));
    return results[0];
  }

  async updateWorkplace(id: number, workplace: Partial<InsertWorkplace>): Promise<Workplace | undefined> {
    const results = await db.update(workplaces)
      .set(workplace)
      .where(eq(workplaces.id, id))
      .returning();
    return results[0];
  }

  async deleteWorkplace(id: number): Promise<boolean> {
    const results = await db.delete(workplaces).where(eq(workplaces.id, id)).returning();
    return results.length > 0;
  }

  // Job Title operations
  async createJobTitle(jobTitle: InsertJobTitle): Promise<JobTitle> {
    const results = await db.insert(jobTitles).values(jobTitle).returning();
    return results[0];
  }

  async getJobTitles(): Promise<JobTitle[]> {
    return db.select().from(jobTitles);
  }

  async getJobTitle(id: number): Promise<JobTitle | undefined> {
    const results = await db.select().from(jobTitles).where(eq(jobTitles.id, id));
    return results[0];
  }

  async updateJobTitle(id: number, jobTitle: Partial<InsertJobTitle>): Promise<JobTitle | undefined> {
    const results = await db.update(jobTitles)
      .set(jobTitle)
      .where(eq(jobTitles.id, id))
      .returning();
    return results[0];
  }

  async deleteJobTitle(id: number): Promise<boolean> {
    const results = await db.delete(jobTitles).where(eq(jobTitles.id, id)).returning();
    return results.length > 0;
  }

  // Educational Qualification operations
  async createEducationalQualification(qualification: InsertEducationalQualification): Promise<EducationalQualification> {
    const results = await db.insert(educationalQualifications).values(qualification).returning();
    return results[0];
  }

  async getEducationalQualifications(): Promise<EducationalQualification[]> {
    return db.select().from(educationalQualifications);
  }

  async getEducationalQualification(id: number): Promise<EducationalQualification | undefined> {
    const results = await db.select().from(educationalQualifications).where(eq(educationalQualifications.id, id));
    return results[0];
  }

  async updateEducationalQualification(id: number, qualification: Partial<InsertEducationalQualification>): Promise<EducationalQualification | undefined> {
    const results = await db.update(educationalQualifications)
      .set(qualification)
      .where(eq(educationalQualifications.id, id))
      .returning();
    return results[0];
  }

  async deleteEducationalQualification(id: number): Promise<boolean> {
    const results = await db.delete(educationalQualifications).where(eq(educationalQualifications.id, id)).returning();
    return results.length > 0;
  }

  // Employee operations
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    // إنشاء الاسم الكامل للموظف
    const fullName = `${employee.firstName} ${employee.lastName}`;
    
    // استخدام الحقول المعروفة فقط من المخطط
    const results = await db.insert(employees).values({
      ...employee,
      fullName
    }).returning();
    
    return results[0];
  }

  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const results = await db.select().from(employees).where(eq(employees.id, id));
    return results[0];
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    // تحديث الاسم الكامل إذا تم تغيير الاسم الأول أو الأخير
    let updateData:any = { ...employee };
    
    if (employee.firstName || employee.lastName) {
      // الحصول على الموظف الحالي لمعرفة القيم القديمة
      const currentEmployee = await this.getEmployee(id);
      if (currentEmployee) {
        const firstName = employee.firstName || currentEmployee.firstName;
        const lastName = employee.lastName || currentEmployee.lastName;
        updateData.fullName = `${firstName} ${lastName}`;
      }
    }
    
    const results = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return results[0];
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const results = await db.delete(employees).where(eq(employees.id, id)).returning();
    return results.length > 0;
  }

  // Appreciation operations
  async createAppreciation(appreciation: InsertAppreciation): Promise<Appreciation> {
    const results = await db.insert(appreciations).values(appreciation).returning();
    return results[0];
  }

  async getAppreciations(): Promise<Appreciation[]> {
    return db.select().from(appreciations);
  }

  async getAppreciationsByEmployee(employeeId: number): Promise<Appreciation[]> {
    return db.select().from(appreciations).where(eq(appreciations.employeeId, employeeId));
  }

  async getAppreciation(id: number): Promise<Appreciation | undefined> {
    const results = await db.select().from(appreciations).where(eq(appreciations.id, id));
    return results[0];
  }

  async updateAppreciation(id: number, appreciation: Partial<InsertAppreciation>): Promise<Appreciation | undefined> {
    const results = await db.update(appreciations)
      .set(appreciation)
      .where(eq(appreciations.id, id))
      .returning();
    return results[0];
  }

  async deleteAppreciation(id: number): Promise<boolean> {
    const results = await db.delete(appreciations).where(eq(appreciations.id, id)).returning();
    return results.length > 0;
  }

  // Allowance/Promotion operations
  async createAllowancePromotion(allowancePromotion: InsertAllowancePromotion): Promise<AllowancePromotion> {
    // Setting default values for processed fields
    const data = {
      ...allowancePromotion,
      processedAt: null,
      processedBy: null
    };
    
    const results = await db.insert(allowancePromotions).values(data).returning();
    return results[0];
  }

  async getAllowancePromotions(): Promise<AllowancePromotion[]> {
    return db.select().from(allowancePromotions);
  }

  async getPendingAllowancePromotions(): Promise<AllowancePromotion[]> {
    return db.select().from(allowancePromotions).where(eq(allowancePromotions.status, 'pending'));
  }

  async getAllowancePromotionsByEmployee(employeeId: number): Promise<AllowancePromotion[]> {
    return db.select().from(allowancePromotions).where(eq(allowancePromotions.employeeId, employeeId));
  }

  async getAllowancePromotion(id: number): Promise<AllowancePromotion | undefined> {
    const results = await db.select().from(allowancePromotions).where(eq(allowancePromotions.id, id));
    return results[0];
  }

  async updateAllowancePromotion(id: number, allowancePromotion: Partial<InsertAllowancePromotion>): Promise<AllowancePromotion | undefined> {
    const results = await db.update(allowancePromotions)
      .set(allowancePromotion)
      .where(eq(allowancePromotions.id, id))
      .returning();
    return results[0];
  }

  async processAllowancePromotion(id: number, status: string, userId: number): Promise<AllowancePromotion | undefined> {
    const results = await db.update(allowancePromotions)
      .set({
        status,
        processedAt: new Date(),
        processedBy: userId
      })
      .where(eq(allowancePromotions.id, id))
      .returning();
    return results[0];
  }

  async deleteAllowancePromotion(id: number): Promise<boolean> {
    const results = await db.delete(allowancePromotions).where(eq(allowancePromotions.id, id)).returning();
    return results.length > 0;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    // Set default values
    const data = {
      ...notification,
      isRead: false,
      createdAt: new Date()
    };
    
    const results = await db.insert(notifications).values(data).returning();
    return results[0];
  }

  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(sql`("user_id" = ${userId} OR "user_id" IS NULL)`)
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const results = await db.select({ count: sql`count(*)` })
      .from(notifications)
      .where(
        and(
          sql`("user_id" = ${userId} OR "user_id" IS NULL)`,
          eq(notifications.isRead, false)
        )
      );
    
    return results[0]?.count as number || 0;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const results = await db.select().from(notifications).where(eq(notifications.id, id));
    return results[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const results = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return results[0];
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const results = await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          sql`("user_id" = ${userId} OR "user_id" IS NULL)`,
          eq(notifications.isRead, false)
        )
      )
      .returning();
    
    return results.length > 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const results = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return results.length > 0;
  }
}

// إنشاء نموذج DbStorage
export const storage = new DbStorage();