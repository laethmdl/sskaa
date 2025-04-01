import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const workplaces = pgTable("workplaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertWorkplaceSchema = createInsertSchema(workplaces).pick({
  name: true,
  description: true,
});

export const jobTitles = pgTable("job_titles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  grade: integer("grade").notNull(),
});

export const insertJobTitleSchema = createInsertSchema(jobTitles).pick({
  title: true,
  description: true,
  grade: true,
});

export const educationalQualifications = pgTable("educational_qualifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  level: integer("level").notNull(),
});

export const insertEducationalQualificationSchema = createInsertSchema(educationalQualifications).pick({
  name: true,
  description: true,
  level: true,
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeNumber: text("employee_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  dateOfBirth: date("date_of_birth"),
  hiringDate: date("hiring_date").notNull(),
  workplaceId: integer("workplace_id").references(() => workplaces.id),
  jobTitleId: integer("job_title_id").references(() => jobTitles.id),
  educationalQualificationId: integer("educational_qualification_id").references(() => educationalQualifications.id),
  currentGrade: integer("current_grade").notNull(),
  lastPromotionDate: date("last_promotion_date"),
  lastAllowanceDate: date("last_allowance_date"),
  status: text("status").default("active"),
  retirementDate: date("retirement_date"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  fullName: true,
});

export const appreciations = pgTable("appreciations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  type: text("type").notNull(), // appreciation or disciplinary
  description: text("description").notNull(),
  date: date("date").notNull(),
  issuedBy: text("issued_by").notNull(),
  additionalServiceMonths: integer("additional_service_months").default(0),
});

export const insertAppreciationSchema = createInsertSchema(appreciations).omit({
  id: true,
});

export const allowancePromotions = pgTable("allowance_promotions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  type: text("type").notNull(), // allowance or promotion
  dueDate: date("due_date").notNull(),
  status: text("status").default("pending"), // pending, completed, rejected
  notes: text("notes"),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

export const insertAllowancePromotionSchema = createInsertSchema(allowancePromotions).omit({
  id: true,
  processedAt: true,
  processedBy: true,
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // allowance, promotion, retirement, warning
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedId: integer("related_id"), // ID of related entity (employee, allowance, etc.)
  relatedType: text("related_type"), // Type of related entity (employee, allowance, etc.)
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Workplace = typeof workplaces.$inferSelect;
export type InsertWorkplace = z.infer<typeof insertWorkplaceSchema>;

export type JobTitle = typeof jobTitles.$inferSelect;
export type InsertJobTitle = z.infer<typeof insertJobTitleSchema>;

export type EducationalQualification = typeof educationalQualifications.$inferSelect;
export type InsertEducationalQualification = z.infer<typeof insertEducationalQualificationSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Appreciation = typeof appreciations.$inferSelect;
export type InsertAppreciation = z.infer<typeof insertAppreciationSchema>;

export type AllowancePromotion = typeof allowancePromotions.$inferSelect;
export type InsertAllowancePromotion = z.infer<typeof insertAllowancePromotionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
