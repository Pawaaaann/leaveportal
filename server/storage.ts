import { type User, type InsertUser, type LeaveRequest, type InsertLeaveRequest, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByDepartment(department: string): Promise<User[]>;
  
  // Leave request operations
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByStudent(studentId: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequestsByStage(stage: string, departmentFilter?: string): Promise<LeaveRequest[]>;
  getCurrentLeaveRequest(studentId: string): Promise<LeaveRequest | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leaveRequests: Map<string, LeaveRequest>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.leaveRequests = new Map();
    this.notifications = new Map();
    this.initializeTestData();
  }

  private initializeTestData() {
    // Create test users for different roles
    const testUsers = [
      {
        id: "student-001",
        email: "student@college.edu",
        name: "John Student",
        role: "Student",
        department: "Computer Science",
        year: "3rd Year",
        rollNumber: "CS2021001",
        hostelStatus: "Hostel A - Room 205",
        profilePicUrl: null,
        mentorId: "mentor-001",
        createdAt: new Date().toISOString()
      },
      {
        id: "mentor-001", 
        email: "mentor@college.edu",
        name: "Dr. Sarah Mentor",
        role: "Mentor", 
        department: "Computer Science",
        year: null,
        rollNumber: null,
        hostelStatus: null,
        profilePicUrl: null,
        mentorId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: "hod-001",
        email: "hod@college.edu", 
        name: "Prof. Michael HOD",
        role: "HOD",
        department: "Computer Science",
        year: null,
        rollNumber: null,
        hostelStatus: null,
        profilePicUrl: null,
        mentorId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: "principal-001",
        email: "principal@college.edu",
        name: "Dr. Jennifer Principal", 
        role: "Principal",
        department: null,
        year: null,
        rollNumber: null,
        hostelStatus: null,
        profilePicUrl: null,
        mentorId: null,
        createdAt: new Date().toISOString()
      },
      {
        id: "warden-001",
        email: "warden@college.edu",
        name: "Mr. David Warden",
        role: "Warden",
        department: null,
        year: null,
        rollNumber: null,
        hostelStatus: null,
        profilePicUrl: null,
        mentorId: null,
        createdAt: new Date().toISOString()
      }
    ];

    testUsers.forEach(user => {
      this.users.set(user.id, user);
    });

    // Create a sample leave request for testing
    const sampleLeaveRequest = {
      id: "leave-001",
      studentId: "student-001",
      leaveType: "medical",
      reason: "Medical checkup appointment",
      fromDate: "2024-01-15",
      toDate: "2024-01-16", 
      emergencyContact: "+91-9876543210",
      supportingDocs: null,
      isHostelStudent: true,
      status: "pending",
      currentStage: "mentor",
      approvals: [],
      finalQrUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.leaveRequests.set(sampleLeaveRequest.id, sampleLeaveRequest);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      department: insertUser.department ?? null,
      year: insertUser.year ?? null,
      rollNumber: insertUser.rollNumber ?? null,
      hostelStatus: insertUser.hostelStatus ?? null,
      profilePicUrl: insertUser.profilePicUrl ?? null,
      mentorId: insertUser.mentorId ?? null,
      id,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.department === department);
  }

  // Leave request operations
  async createLeaveRequest(insertRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = randomUUID();
    const request: LeaveRequest = {
      ...insertRequest,
      emergencyContact: insertRequest.emergencyContact ?? null,
      supportingDocs: insertRequest.supportingDocs ?? null,
      isHostelStudent: insertRequest.isHostelStudent ?? null,
      id,
      status: "pending",
      currentStage: "mentor",
      approvals: [],
      finalQrUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.leaveRequests.set(id, request);
    return request;
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const request = this.leaveRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { 
      ...request, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.leaveRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getLeaveRequestsByStudent(studentId: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .filter(request => request.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getPendingLeaveRequestsByStage(stage: string, departmentFilter?: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(request => {
      if (request.status !== "pending" || request.currentStage !== stage) {
        return false;
      }
      
      if (departmentFilter) {
        // For HOD dashboard, filter by department
        // This would require joining with user data in a real database
        return true; // Simplified for in-memory storage
      }
      
      return true;
    });
  }

  async getCurrentLeaveRequest(studentId: string): Promise<LeaveRequest | undefined> {
    return Array.from(this.leaveRequests.values())
      .filter(request => request.studentId === studentId && request.status === "pending")
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      relatedLeaveId: insertNotification.relatedLeaveId ?? null,
      id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(id, notification);
    }
  }
}

export const storage = new MemStorage();
