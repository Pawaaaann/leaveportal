import { z } from "zod";

// User interface and schemas
export interface User {
  id: string;
  email: string;
  name: string;
  role: string; // Student, Mentor, HOD, Principal, Warden
  department: string | null;
  year: string | null;
  rollNumber: string | null;
  hostelStatus: string | null;
  profilePicUrl: string | null;
  mentorId: string | null;
  createdAt: string;
}

export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string(),
  department: z.string().optional(),
  year: z.string().optional(),
  rollNumber: z.string().optional(),
  hostelStatus: z.string().optional(),
  profilePicUrl: z.string().optional(),
  mentorId: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Approval interface and schema
export interface Approval {
  stage: string;
  approverId: string;
  approverName: string;
  status: "approve" | "reject";
  comments?: string;
  timestamp: string;
}

export const approvalSchema = z.object({
  stage: z.string(),
  approverId: z.string(),
  approverName: z.string(), 
  status: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
  timestamp: z.string(),
});

// Leave Request interface and schemas
export interface LeaveRequest {
  id: string;
  studentId: string;
  leaveType: string;
  reason: string;
  fromDate: string;
  toDate: string;
  emergencyContact: string | null;
  supportingDocs: string | null;
  isHostelStudent: boolean | null;
  status: string; // pending, approved, rejected
  currentStage: string; // mentor, hod, principal, warden
  approvals: Approval[];
  finalQrUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export const insertLeaveRequestSchema = z.object({
  studentId: z.string(),
  leaveType: z.string(),
  reason: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  emergencyContact: z.string().optional(),
  supportingDocs: z.string().optional(),
  isHostelStudent: z.boolean().optional(),
});

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

// Notification interface and schemas
export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string; // info, success, warning, error
  isRead: boolean;
  relatedLeaveId: string | null;
  createdAt: string;
}

export const insertNotificationSchema = z.object({
  userId: z.string(),
  message: z.string(),
  type: z.string(),
  relatedLeaveId: z.string().optional(),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
