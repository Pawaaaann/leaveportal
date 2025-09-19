import { type User, type InsertUser, type LeaveRequest, type InsertLeaveRequest, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit 
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

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

// Firebase configuration for server-side
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class FirestoreStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(db, "users", id));
      return userDoc.exists() ? userDoc.data() as User : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
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
      
      await setDoc(doc(db, "users", id), user as any);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, updates as any);
      return await this.getUser(id);
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const q = query(collection(db, "users"), where("role", "==", role));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by role:", error);
      return [];
    }
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    try {
      const q = query(collection(db, "users"), where("department", "==", department));
      const querySnapshot = await getDocs(q);
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
      
      await setDoc(doc(db, "leaveRequests", id), request as any);
      return request;
    } catch (error) {
      console.error("Error creating leave request:", error);
      throw error;
    }
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    try {
      const leaveDoc = await getDoc(doc(db, "leaveRequests", id));
      return leaveDoc.exists() ? leaveDoc.data() as LeaveRequest : undefined;
    } catch (error) {
      console.error("Error getting leave request:", error);
      return undefined;
    }
  }

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    try {
      const leaveRef = doc(db, "leaveRequests", id);
      const updateData = { 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      await updateDoc(leaveRef, updateData as any);
      return await this.getLeaveRequest(id);
    } catch (error) {
      console.error("Error updating leave request:", error);
      return undefined;
    }
  }

  async getLeaveRequestsByStudent(studentId: string): Promise<LeaveRequest[]> {
    try {
      const q = query(
        collection(db, "leaveRequests"), 
        where("studentId", "==", studentId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as LeaveRequest);
    } catch (error) {
      console.error("Error getting leave requests by student:", error);
      return [];
    }
  }

  async getPendingLeaveRequestsByStage(stage: string, departmentFilter?: string): Promise<LeaveRequest[]> {
    try {
      const q = query(
        collection(db, "leaveRequests"),
        where("status", "==", "pending"),
        where("currentStage", "==", stage)
      );
      const querySnapshot = await getDocs(q);
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
      const q = query(
        collection(db, "leaveRequests"),
        where("studentId", "==", studentId),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? undefined : querySnapshot.docs[0].data() as LeaveRequest;
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
      
      await setDoc(doc(db, "notifications", id), notification as any);
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Notification);
    } catch (error) {
      console.error("Error getting notifications by user:", error);
      return [];
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", id);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }
}

export const storage = new FirestoreStorage();
