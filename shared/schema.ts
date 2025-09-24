import { z } from "zod";

// User interface and schemas - matching exact specification
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string; // Student, Mentor, HOD, Principal, Warden, Admin
  dept: string | null;
  year: string | null;
  hostel_status: string | null;
  profile_pic_url: string | null;
  mentor_id: string | null;
  register_number: string | null;
}

export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  dept: z.string().optional(),
  year: z.string().optional(),
  hostel_status: z.string().optional(),
  profile_pic_url: z.string().optional(),
  mentor_id: z.string().optional(),
  register_number: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Leave Request interface and schemas - matching exact specification
export interface LeaveRequest {
  id: string;
  student_id: string;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  guardian_phone: string;
  emergency_contact: string | null;
  supporting_docs: string | null;
  is_hostel_student: boolean;
  status: string; // pending, approved, rejected
  approver_stage: string; // guardian, mentor, hod, principal, warden
  comments: string | null;
  final_qr_url: string | null;
  guardian_token: string | null;
  guardian_token_expires_at: string | null;
}

export const insertLeaveRequestSchema = z.object({
  student_id: z.string(),
  leave_type: z.string(),
  reason: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  guardian_phone: z.string().min(10, "Guardian phone number is required"),
  emergency_contact: z.string().optional(),
  supporting_docs: z.string().optional(),
});

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

// Notification interface and schemas - matching exact specification
export interface Notification {
  id: string;
  user_id: string;
  message: string;
  timestamp: string;
}

export const insertNotificationSchema = z.object({
  user_id: z.string(),
  message: z.string(),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
