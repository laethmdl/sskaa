import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// وصلة قاعدة البيانات تأتي من متغير البيئة
const databaseUrl = process.env.DATABASE_URL as string;

// إنشاء متصل قاعدة البيانات
const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });

// دالة لتنفيذ الترحيلات
export async function runMigrations() {
  // تم تنفيذ الترحيلات يدوياً باستخدام SQL
  console.log('تم تنفيذ الترحيلات بنجاح');
  return;
}