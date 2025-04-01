CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS "workplaces" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

CREATE TABLE IF NOT EXISTS "job_titles" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "grade" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "educational_qualifications" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "employees" (
    "id" SERIAL PRIMARY KEY,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "hiringDate" TEXT NOT NULL,
    "currentGrade" INTEGER NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "workplaceId" INTEGER,
    "jobTitleId" INTEGER,
    "educationalQualificationId" INTEGER,
    "status" TEXT DEFAULT 'active',
    "retirementDate" TEXT
);

CREATE TABLE IF NOT EXISTS "appreciations" (
    "id" SERIAL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL REFERENCES "employees"("id"),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "allowance_promotions" (
    "id" SERIAL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL REFERENCES "employees"("id"),
    "type" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "processedAt" TIMESTAMP,
    "processedBy" INTEGER REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES "users"("id"),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "relatedId" INTEGER,
    "relatedType" TEXT
);

-- إنشاء مستخدم إداري افتراضي
INSERT INTO "users" (username, password, name, email, role)
VALUES ('admin', 'admin123', 'مدير النظام', 'admin@example.com', 'admin')
ON CONFLICT (username) DO NOTHING;