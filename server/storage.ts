import { type User, type InsertUser, type LeaveRequest, type InsertLeaveRequest, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

// Firebase Admin configuration for server-side
let db: FirebaseFirestore.Firestore;

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    // Try to initialize with service account (production)
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;
      
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Fallback for development - use project ID only
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    db = getFirestore();
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
    // Fall back to a basic setup if available
    db = getFirestore();
  }
} else {
  db = getFirestore();
}

export class FirestoreStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const userDoc = await db.collection("users").doc(id).get();
      return userDoc.exists ? userDoc.data() as User : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const querySnapshot = await db.collection("users").where("email", "==", email).get();
      return querySnapshot.empty ? undefined : querySnapshot.docs[0].data() as User;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
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
      
      await db.collection("users").doc(id).set(user);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      await db.collection("users").doc(id).update(updates);
      return await this.getUser(id);
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const querySnapshot = await db.collection("users").where("role", "==", role).get();
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by role:", error);
      return [];
    }
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    try {
      const querySnapshot = await db.collection("users").where("department", "==", department).get();
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by department:", error);
      return [];
    }
  }

  // Leave request operations
  async createLeaveRequest(insertRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    try {
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
      
      await db.collection("leaveRequests").doc(id).set(request);
      return request;
    } catch (error) {
      console.error("Error creating leave request:", error);
      throw error;
    }
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    try {
      const leaveDoc = await db.collection("leaveRequests").doc(id).get();
      return leaveDoc.exists ? leaveDoc.data() as LeaveRequest : undefined;
    } catch (error) {
      console.error("Error getting leave request:", error);
      return undefined;
    }
  }

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    try {
      const updateData = { 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      await db.collection("leaveRequests").doc(id).update(updateData);
      return await this.getLeaveRequest(id);
    } catch (error) {
      console.error("Error updating leave request:", error);
      return undefined;
    }
  }

  async getLeaveRequestsByStudent(studentId: string): Promise<LeaveRequest[]> {
    try {
      // Simplified query without orderBy to avoid composite index requirement
      const querySnapshot = await db.collection("leaveRequests").where("studentId", "==", studentId).get();
      const results = querySnapshot.docs.map(doc => doc.data() as LeaveRequest);
      // Sort in memory instead
      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Error getting leave requests by student:", error);
      return [];
    }
  }

  async getPendingLeaveRequestsByStage(stage: string, departmentFilter?: string): Promise<LeaveRequest[]> {
    try {
      let query = db.collection("leaveRequests")
        .where("status", "==", "pending")
        .where("currentStage", "==", stage);
      
      const querySnapshot = await query.get();
      let results = querySnapshot.docs.map(doc => doc.data() as LeaveRequest);
      
      // Additional filtering can be done client-side for complex queries
      if (departmentFilter) {
        // This would require joining with user data in a real scenario
        results = results.filter(() => true); // Simplified for now
      }
      
      return results;
    } catch (error) {
      console.error("Error getting pending leave requests:", error);
      return [];
    }
  }

  async getCurrentLeaveRequest(studentId: string): Promise<LeaveRequest | undefined> {
    try {
      // Simplified query without orderBy to avoid composite index requirement
      const querySnapshot = await db.collection("leaveRequests")
        .where("studentId", "==", studentId)
        .where("status", "==", "pending")
        .get();
      
      if (querySnapshot.empty) return undefined;
      
      // Sort in memory and get the most recent
      const results = querySnapshot.docs.map(doc => doc.data() as LeaveRequest);
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return results[0];
    } catch (error) {
      console.error("Error getting current leave request:", error);
      return undefined;
    }
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    try {
      const id = randomUUID();
      const notification: Notification = {
        ...insertNotification,
        relatedLeaveId: insertNotification.relatedLeaveId ?? null,
        id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      await db.collection("notifications").doc(id).set(notification);
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    try {
      // Simplified query without orderBy to avoid composite index requirement
      const querySnapshot = await db.collection("notifications").where("userId", "==", userId).get();
      const results = querySnapshot.docs.map(doc => doc.data() as Notification);
      // Sort in memory instead
      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("Error getting notifications by user:", error);
      return [];
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await db.collection("notifications").doc(id).update({ isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }
}

// Export the appropriate storage based on environment
export const storage = process.env.FIREBASE_PROJECT_ID 
  ? new FirestoreStorage() 
  : new MemStorage();
