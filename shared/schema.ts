import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(), // Student, Mentor, HOD, Principal, Warden
  department: text("department"),
  year: text("year"),
  rollNumber: text("roll_number"),
  hostelStatus: text("hostel_status"),
  profilePicUrl: text("profile_pic_url"),
  mentorId: varchar("mentor_id"),
  createdAt: text("created_at"),
});

export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  leaveType: text("leave_type").notNull(),
  reason: text("reason").notNull(),
  fromDate: text("from_date").notNull(),
  toDate: text("to_date").notNull(),
  emergencyContact: text("emergency_contact"),
  supportingDocs: text("supporting_docs"),
  isHostelStudent: boolean("is_hostel_student").default(false),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  currentStage: text("current_stage").notNull().default("mentor"), // mentor, hod, principal, warden
  approvals: jsonb("approvals").default([]), // Array of approval objects
  finalQrUrl: text("final_qr_url"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, success, warning, error
  isRead: boolean("is_read").default(false),
  relatedLeaveId: varchar("related_leave_id"),
  createdAt: text("created_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  currentStage: true,
  approvals: true,
  finalQrUrl: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const approvalSchema = z.object({
  stage: z.string(),
  approverId: z.string(),
  approverName: z.string(),
  status: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
  timestamp: z.string(),
});

export type Approval = z.infer<typeof approvalSchema>;
