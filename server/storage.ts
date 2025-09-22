import { type User, type InsertUser, type LeaveRequest, type InsertLeaveRequest, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

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
  getLeaveRequestsByStudent(student_id: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequestsByStage(stage: string, departmentFilter?: string): Promise<LeaveRequest[]>;
  getCurrentLeaveRequest(student_id: string): Promise<LeaveRequest | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(user_id: string): Promise<Notification[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leaveRequests: Map<string, LeaveRequest>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.leaveRequests = new Map();
    this.notifications = new Map();
    this.initializeTestData().catch(console.error);
  }

  private async initializeTestData() {
    // Create test users for different roles with hashed passwords
    const hashedPassword = await bcrypt.hash("password123", 10);
    const testUsers = [
      {
        id: "student-001",
        email: "student@college.edu",
        name: "John Student",
        password: hashedPassword,
        role: "Student",
        dept: "Computer Science",
        year: "3rd Year",
        hostel_status: "Hostel A - Room 205",
        profile_pic_url: null,
        mentor_id: "mentor-001",
        register_number: "CS20230001"
      },
      {
        id: "mentor-001", 
        email: "mentor@college.edu",
        name: "Dr. Sarah Mentor",
        password: hashedPassword,
        role: "Mentor", 
        dept: "Computer Science",
        year: null,
        hostel_status: null,
        profile_pic_url: null,
        mentor_id: null,
        register_number: null
      },
      {
        id: "hod-001",
        email: "hod@college.edu", 
        name: "Prof. Michael HOD",
        password: hashedPassword,
        role: "HOD",
        dept: "Computer Science",
        year: null,
        hostel_status: null,
        profile_pic_url: null,
        mentor_id: null,
        register_number: null
      },
      {
        id: "principal-001",
        email: "principal@college.edu",
        name: "Dr. Jennifer Principal",
        password: hashedPassword, 
        role: "Principal",
        dept: null,
        year: null,
        hostel_status: null,
        profile_pic_url: null,
        mentor_id: null,
        register_number: null
      },
      {
        id: "warden-001",
        email: "warden@college.edu",
        name: "Mr. David Warden",
        password: hashedPassword,
        role: "Warden",
        dept: null,
        year: null,
        hostel_status: null,
        profile_pic_url: null,
        mentor_id: null,
        register_number: null
      }
    ];

    testUsers.forEach(user => {
      this.users.set(user.id, user);
    });

    // Create a sample leave request for testing
    const sampleLeaveRequest = {
      id: "leave-001",
      student_id: "student-001",
      reason: "Medical checkup appointment",
      start_date: "2024-01-15",
      end_date: "2024-01-16",
      status: "pending",
      approver_stage: "mentor",
      comments: null,
      final_qr_url: null
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
      dept: insertUser.dept ?? null,
      year: insertUser.year ?? null,
      hostel_status: insertUser.hostel_status ?? null,
      profile_pic_url: insertUser.profile_pic_url ?? null,
      mentor_id: insertUser.mentor_id ?? null,
      register_number: insertUser.register_number ?? null,
      id
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
    return Array.from(this.users.values()).filter(user => user.dept === department);
  }

  // Leave request operations
  async createLeaveRequest(insertRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = randomUUID();
    const request: LeaveRequest = {
      ...insertRequest,
      id,
      status: "pending",
      approver_stage: "mentor",
      comments: null,
      final_qr_url: null
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
      ...updates
    };
    this.leaveRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getLeaveRequestsByStudent(student_id: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .filter(request => request.student_id === student_id);
  }

  async getPendingLeaveRequestsByStage(stage: string, departmentFilter?: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(request => {
      if (request.status !== "pending" || request.approver_stage !== stage) {
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

  async getCurrentLeaveRequest(student_id: string): Promise<LeaveRequest | undefined> {
    return Array.from(this.leaveRequests.values())
      .filter(request => request.student_id === student_id && request.status === "pending")[0];
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      timestamp: new Date().toISOString()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUser(user_id: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.user_id === user_id);
  }
}

// Firebase Admin configuration for server-side
let db: FirebaseFirestore.Firestore | null = null;
let initPromise: Promise<FirebaseFirestore.Firestore | null> | null = null;

function tryInitializeFirestore(): Promise<FirebaseFirestore.Firestore | null> {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    if (!getApps().length) {
      try {
        // Try to initialize with service account (production)
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : null;
          
        if (serviceAccount && process.env.FIREBASE_PROJECT_ID) {
          // Fix private key formatting - handle various encoding issues
          if (serviceAccount.private_key) {
            let privateKey = serviceAccount.private_key;
            
            // Replace escaped newlines with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
            
            // Ensure proper PEM format
            if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
              console.warn('Private key does not start with proper PEM header');
            }
            if (!privateKey.endsWith('-----END PRIVATE KEY-----\n')) {
              if (!privateKey.endsWith('\n')) {
                privateKey += '\n';
              }
            }
            
            serviceAccount.private_key = privateKey;
          }
          
          console.log('Attempting to initialize Firebase with service account...');
          initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
        } else if (process.env.FIREBASE_PROJECT_ID) {
          // Fallback for development with Application Default Credentials
          initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
        } else {
          console.warn("No Firebase configuration found");
          return null;
        }
        
        const testDb = getFirestore();
        
        // Perform connectivity test
        await testDb.collection('health').limit(1).get();
        console.log("Firebase Firestore connected successfully");
        db = testDb;
        return testDb;
      } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
        return null;
      }
    } else {
      try {
        const testDb = getFirestore();
        await testDb.collection('health').limit(1).get();
        db = testDb;
        return testDb;
      } catch (error) {
        console.error("Firebase connectivity test failed:", error);
        return null;
      }
    }
  })();
  
  return initPromise;
}

async function ensureFirestore(): Promise<FirebaseFirestore.Firestore | null> {
  if (db) return db;
  return await tryInitializeFirestore();
}

export { ensureFirestore };

export class FirestoreStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const userDoc = await db.collection("users").doc(id).get();
      return userDoc.exists ? userDoc.data() as User : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const querySnapshot = await db.collection("users").where("email", "==", email).get();
      return querySnapshot.empty ? undefined : querySnapshot.docs[0].data() as User;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const id = randomUUID();
      const user: User = { 
        ...insertUser,
        dept: insertUser.dept ?? null,
        year: insertUser.year ?? null,
        hostel_status: insertUser.hostel_status ?? null,
        profile_pic_url: insertUser.profile_pic_url ?? null,
        mentor_id: insertUser.mentor_id ?? null,
        register_number: insertUser.register_number ?? null,
        id
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
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      await db.collection("users").doc(id).update(updates);
      return await this.getUser(id);
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const querySnapshot = await db.collection("users").where("role", "==", role).get();
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by role:", error);
      return [];
    }
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const querySnapshot = await db.collection("users").where("dept", "==", department).get();
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error("Error getting users by department:", error);
      return [];
    }
  }

  // Leave request operations
  async createLeaveRequest(insertRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const id = randomUUID();
      const request: LeaveRequest = {
        ...insertRequest,
        id,
        status: "pending",
        approver_stage: "mentor",
        comments: null,
        final_qr_url: null
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
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const leaveDoc = await db.collection("leaveRequests").doc(id).get();
      return leaveDoc.exists ? leaveDoc.data() as LeaveRequest : undefined;
    } catch (error) {
      console.error("Error getting leave request:", error);
      return undefined;
    }
  }

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      await db.collection("leaveRequests").doc(id).update(updates);
      return await this.getLeaveRequest(id);
    } catch (error) {
      console.error("Error updating leave request:", error);
      return undefined;
    }
  }

  async getLeaveRequestsByStudent(student_id: string): Promise<LeaveRequest[]> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const querySnapshot = await db.collection("leaveRequests").where("student_id", "==", student_id).get();
      return querySnapshot.docs.map(doc => doc.data() as LeaveRequest);
    } catch (error) {
      console.error("Error getting leave requests by student:", error);
      return [];
    }
  }

  async getPendingLeaveRequestsByStage(stage: string, departmentFilter?: string): Promise<LeaveRequest[]> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      let query = db.collection("leaveRequests")
        .where("status", "==", "pending")
        .where("approver_stage", "==", stage);
      
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

  async getCurrentLeaveRequest(student_id: string): Promise<LeaveRequest | undefined> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const querySnapshot = await db.collection("leaveRequests")
        .where("student_id", "==", student_id)
        .where("status", "==", "pending")
        .get();
      
      if (querySnapshot.empty) return undefined;
      
      const results = querySnapshot.docs.map(doc => doc.data() as LeaveRequest);
      return results[0];
    } catch (error) {
      console.error("Error getting current leave request:", error);
      return undefined;
    }
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const id = randomUUID();
      const notification: Notification = {
        ...insertNotification,
        id,
        timestamp: new Date().toISOString()
      };
      
      await db.collection("notifications").doc(id).set(notification);
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getNotificationsByUser(user_id: string): Promise<Notification[]> {
    try {
      const db = await ensureFirestore();
      if (!db) throw new Error("Firestore not available");
      const querySnapshot = await db.collection("notifications").where("user_id", "==", user_id).get();
      return querySnapshot.docs.map(doc => doc.data() as Notification);
    } catch (error) {
      console.error("Error getting notifications by user:", error);
      return [];
    }
  }
}

// Create storage instance with proper initialization check
async function createStorage(): Promise<IStorage> {
  const firestore = await tryInitializeFirestore();
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !firestore) {
    throw new Error("Firebase Firestore is required in production but initialization failed");
  }
  
  const shouldUseFirestore = firestore !== null;
  console.log(`Using storage: ${shouldUseFirestore ? 'Firestore' : 'Memory (development only)'}`);
  
  return shouldUseFirestore ? new FirestoreStorage() : new MemStorage();
}

// Export a promise that resolves to the appropriate storage
export const storage = createStorage();
