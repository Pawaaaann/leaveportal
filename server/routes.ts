import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type IStorage } from "./storage";
import { insertLeaveRequestSchema, insertUserSchema, insertNotificationSchema, type LeaveRequest } from "@shared/schema";
import { generateQRCode } from "./services/qr-service";
import { generatePDF } from "./services/pdf-service";
import { notifyApprovers, createNotification } from "./services/notification-service";
// Guardian approval removed - no longer needed

// Helper function to remove sensitive guardian token fields from responses
function sanitizeLeaveRequest(leaveRequest: any) {
  const { guardian_token, guardian_token_expires_at, ...sanitized } = leaveRequest;
  return sanitized;
}

// Helper function to escape HTML in Node.js
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Leave request routes
  app.post("/api/leave-requests", async (req, res) => {
    try {
      const validatedData = insertLeaveRequestSchema.parse(req.body);
      let storageInstance: IStorage;
      try {
        storageInstance = await storage;
      } catch (storageError: any) {
        console.error("Storage initialization failed:", storageError);
        return res.status(500).json({ 
          error: "Database connection failed. Please check server configuration.",
          details: storageError.message
        });
      }
      
      // Create leave request - starts directly at mentor stage (guardian approval removed)
      const leaveRequestData = {
        ...validatedData,
        guardian_token: null,
        guardian_token_expires_at: null
      };
      
      const leaveRequest = await storageInstance.createLeaveRequest(leaveRequestData);
      
      // Create notification for mentor (first approver)
      await notifyApprovers(leaveRequest.id, "mentor");
      console.log("New leave application submitted by student:", validatedData.student_id);
      
      // Remove sensitive token fields from response to student
      const { guardian_token, guardian_token_expires_at, ...safeResponse } = leaveRequest;
      res.json(safeResponse);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/leave-requests/student/:studentId", async (req, res) => {
    try {
      const storageInstance = await storage;
      const applications = await storageInstance.getLeaveRequestsByStudent(req.params.studentId);
      const sanitizedApplications = applications.map(sanitizeLeaveRequest);
      res.json(sanitizedApplications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/leave-requests/current/:studentId", async (req, res) => {
    try {
      const storageInstance = await storage;
      const currentApplication = await storageInstance.getCurrentLeaveRequest(req.params.studentId);
      const sanitizedApplication = currentApplication ? sanitizeLeaveRequest(currentApplication) : null;
      res.json(sanitizedApplication);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current application" });
    }
  });

  app.get("/api/leave-requests/pending/:stage", async (req, res) => {
    try {
      const { stage } = req.params;
      const { department } = req.query;
      
      const storageInstance = await storage;
      const pendingApplications = await storageInstance.getPendingLeaveRequestsByStage(
        stage, 
        department as string
      );
      const sanitizedApplications = pendingApplications.map(sanitizeLeaveRequest);
      res.json(sanitizedApplications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending applications" });
    }
  });

  app.get("/api/leave-requests/mentor/:mentorId", async (req, res) => {
    try {
      const { mentorId } = req.params;
      const storageInstance = await storage;
      
      const mentor = await storageInstance.getUser(mentorId);
      if (!mentor || mentor.role !== "Mentor") {
        return res.status(403).json({ error: "User is not a mentor" });
      }
      
      const pendingMentorRequests = await storageInstance.getPendingLeaveRequestsByStage("mentor");
      
      const mentorSpecificRequests = [];
      for (const request of pendingMentorRequests) {
        const student = await storageInstance.getUser(request.student_id);
        if (!student) continue;
        
        if (student.mentor_id === mentorId) {
          mentorSpecificRequests.push(request);
        } else if (student.dept === mentor.dept && student.year === mentor.year) {
          mentorSpecificRequests.push(request);
        } else if (student.dept === mentor.dept && !mentor.year) {
          mentorSpecificRequests.push(request);
        }
      }
      
      const sanitizedApplications = mentorSpecificRequests.map(sanitizeLeaveRequest);
      res.json(sanitizedApplications);
    } catch (error) {
      console.error("Error fetching mentor leave requests:", error);
      res.status(500).json({ error: "Failed to fetch mentor applications" });
    }
  });

  app.post("/api/leave-requests/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { action, comments } = req.body;
      
      const storageInstance = await storage;
      const leaveRequest = await storageInstance.getLeaveRequest(id);
      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      if (action === "reject") {
        // If rejected, update status and stop workflow
        await storageInstance.updateLeaveRequest(id, {
          status: "rejected",
          comments: comments || "Application rejected",
        });

        // Generate rejection QR code with verification URL
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.BASE_URL || (process.env.REPL_SLUG 
            ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
            : `http://localhost:5000`);
        const verificationUrl = `${baseUrl}/verify/${id}`;
        const qrUrl = await generateQRCode(verificationUrl);
        
        await storageInstance.updateLeaveRequest(id, { final_qr_url: qrUrl });
        
        // Notify student of rejection
        await createNotification(
          leaveRequest.student_id,
          `Your leave request has been rejected. Reason: ${comments || "No reason provided"}`,
          "error",
          id
        );
      } else {
        // If approved, move to next stage or complete
        // Guardian stage removed - flow starts at mentor
        const stages = ["mentor", "hod", "principal"];
        
        // Check if student is hostel student by looking up user info
        const student = await storageInstance.getUser(leaveRequest.student_id);
        if (student?.hostel_status && student.hostel_status.toLowerCase() === "hostel") {
          stages.push("warden");
        }

        const currentStageIndex = stages.indexOf(leaveRequest.approver_stage);
        const nextStageIndex = currentStageIndex + 1;

        if (nextStageIndex >= stages.length) {
          // Final approval - generate QR code with verification URL
          const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}`
            : process.env.BASE_URL || (process.env.REPL_SLUG 
              ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
              : `http://localhost:5000`);
          const verificationUrl = `${baseUrl}/verify/${id}`;
          const qrUrl = await generateQRCode(verificationUrl);

          await storageInstance.updateLeaveRequest(id, {
            status: "approved",
            comments: comments || "Application approved",
            final_qr_url: qrUrl,
          });
          
          // Notify student of final approval
          await createNotification(
            leaveRequest.student_id,
            `Your leave request has been approved! You can download your leave pass from the dashboard.`,
            "success",
            id
          );
        } else {
          // Move to next stage
          await storageInstance.updateLeaveRequest(id, {
            approver_stage: stages[nextStageIndex],
            comments: comments || `Approved by ${leaveRequest.approver_stage}`,
          });

          // Notify next stage approvers
          const student = await storageInstance.getUser(leaveRequest.student_id);
          await notifyApprovers(id, stages[nextStageIndex], student?.dept ?? undefined);
          
          // Notify student of progress
          await createNotification(
            leaveRequest.student_id,
            `Your leave request has been approved by ${leaveRequest.approver_stage} and forwarded to ${stages[nextStageIndex]}.`,
            "info",
            id
          );
        }
      }

      console.log(`Leave application ${action}d for student:`, leaveRequest.student_id);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process approval" });
    }
  });

  app.get("/api/leave-requests/:id/pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const storageInstance = await storage;
      const leaveRequest = await storageInstance.getLeaveRequest(id);
      
      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      const pdfBuffer = await generatePDF(leaveRequest);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=leave-pass-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Verification endpoint for QR code scanning
  app.get("/api/leave-requests/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const storageInstance = await storage;
      const leaveRequest = await storageInstance.getLeaveRequest(id);
      
      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      const student = await storageInstance.getUser(leaveRequest.student_id);
      
      res.json({
        leaveRequest: sanitizeLeaveRequest(leaveRequest),
        student: student ? {
          name: student.name,
          register_number: student.register_number,
          dept: student.dept,
          year: student.year,
          hostel_status: student.hostel_status,
        } : null
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Failed to verify leave request" });
    }
  });

  // Get all leave requests for admin overview
  app.get("/api/leave-requests/all", async (req, res) => {
    try {
      const storageInstance = await storage;
      
      // Get all leave requests (pending, approved, rejected)
      const allRequests = await storageInstance.getAllLeaveRequests();
      const sanitizedRequests = allRequests.map(sanitizeLeaveRequest);
      
      res.json(sanitizedRequests);
    } catch (error) {
      console.error("Error fetching all leave requests:", error);
      res.status(500).json({ error: "Failed to fetch leave requests" });
    }
  });

  // Get approved leave requests filtered by department and year
  app.get("/api/leave-requests/approved", async (req, res) => {
    try {
      const { department, year } = req.query;
      const storageInstance = await storage;
      
      // Get all leave requests
      const allRequests = await storageInstance.getAllLeaveRequests();
      
      // Filter approved requests
      let approvedRequests = allRequests.filter(req => req.status === "approved");
      
      // Filter by department and year if provided
      if (department || year) {
        const filteredResults = await Promise.all(
          approvedRequests.map(async (request) => {
            const student = await storageInstance.getUser(request.student_id);
            if (!student) return null;
            
            if (department && student.dept !== department) return null;
            if (year && student.year !== year) return null;
            
            return request;
          })
        );
        approvedRequests = filteredResults.filter((req): req is LeaveRequest => req !== null);
      }
      
      // Sort by date (newest first)
      approvedRequests.sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      
      const sanitizedRequests = approvedRequests.map(sanitizeLeaveRequest);
      res.json(sanitizedRequests);
    } catch (error) {
      console.error("Error fetching approved leave requests:", error);
      res.status(500).json({ error: "Failed to fetch approved leave requests" });
    }
  });

  // Get rejected leave requests filtered by department and year
  app.get("/api/leave-requests/rejected", async (req, res) => {
    try {
      const { department, year } = req.query;
      const storageInstance = await storage;
      
      // Get all leave requests
      const allRequests = await storageInstance.getAllLeaveRequests();
      
      // Filter rejected requests
      let rejectedRequests = allRequests.filter(req => req.status === "rejected");
      
      // Filter by department and year if provided
      if (department || year) {
        const filteredResults = await Promise.all(
          rejectedRequests.map(async (request) => {
            const student = await storageInstance.getUser(request.student_id);
            if (!student) return null;
            
            if (department && student.dept !== department) return null;
            if (year && student.year !== year) return null;
            
            return request;
          })
        );
        rejectedRequests = filteredResults.filter((req): req is LeaveRequest => req !== null);
      }
      
      // Sort by date (newest first)
      rejectedRequests.sort((a, b) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      
      const sanitizedRequests = rejectedRequests.map(sanitizeLeaveRequest);
      res.json(sanitizedRequests);
    } catch (error) {
      console.error("Error fetching rejected leave requests:", error);
      res.status(500).json({ error: "Failed to fetch rejected leave requests" });
    }
  });

  // Statistics routes
  app.get("/api/leave-requests/stats/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const storageInstance = await storage;
      const applications = await storageInstance.getLeaveRequestsByStudent(studentId);
      
      const stats = {
        total: applications.length,
        approved: applications.filter(app => app.status === "approved").length,
        pending: applications.filter(app => app.status === "pending").length,
        rejected: applications.filter(app => app.status === "rejected").length,
        daysUsed: applications
          .filter(app => app.status === "approved")
          .reduce((total, app) => {
            const from = new Date(app.start_date);
            const to = new Date(app.end_date);
            const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return total + days;
          }, 0),
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // User validation route for login
  app.post("/api/users/validate", async (req, res) => {
    try {
      const { email, role } = req.body;
      
      if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
      }
      
      const storageInstance = await storage;
      
      // Check if user exists with this email
      const user = await storageInstance.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found. Only admin-created accounts can sign in." });
      }
      
      // Validate that the selected role matches the user's stored role
      if (user.role !== role) {
        return res.status(400).json({ error: `Invalid role. Your account role is ${user.role}.` });
      }
      
      res.json({ valid: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("User validation error:", error);
      res.status(500).json({ error: "Failed to validate user" });
    }
  });

  // User login route with password validation
  app.post("/api/users/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      if (!email || !password || !role) {
        return res.status(400).json({ error: "Email, password and role are required" });
      }
      
      let storageInstance: IStorage;
      try {
        storageInstance = await storage;
      } catch (storageError: any) {
        console.error("Storage initialization failed:", storageError);
        return res.status(500).json({ 
          error: "Database connection failed. Please check server configuration.",
          details: process.env.NODE_ENV === 'production' ? "Firebase Firestore may not be configured correctly." : storageError.message
        });
      }
      
      // Check if user exists with this email
      const user = await storageInstance.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Validate that the selected role matches the user's stored role
      if (user.role !== role) {
        return res.status(400).json({ error: `Invalid role. Your account role is ${user.role}.` });
      }
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } catch (error: any) {
      console.error("User login error:", error);
      res.status(500).json({ 
        error: "Failed to login user",
        message: error?.message || "An unexpected error occurred"
      });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const { role, department } = req.query;
      const storageInstance = await storage;
      
      let users;
      if (role) {
        users = await storageInstance.getUsersByRole(role as string);
      } else if (department) {
        users = await storageInstance.getUsersByDepartment(department as string);
      } else {
        // For now, return users by role since we don't have a getAllUsers method
        const roles = ["Student", "Mentor", "HOD", "Principal", "Warden"];
        const allUsers = await Promise.all(
          roles.map(r => storageInstance.getUsersByRole(r))
        );
        users = allUsers.flat();
      }
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      console.log("[ADMIN] Create user request:", req.body?.email, req.body?.role);
      const validatedData = insertUserSchema.parse(req.body);
      
      // Validate that role is one of the admin roles
      const adminRoles = ["Mentor", "HOD", "Principal", "Warden"];
      if (!adminRoles.includes(validatedData.role)) {
        return res.status(400).json({ error: "Invalid role for admin user creation" });
      }
      
      const storageInstance = await storage;
      
      // Check if user with email already exists
      const existingUser = await storageInstance.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const userData = { ...validatedData, password: hashedPassword };
      
      // Create user in storage with hashed password
      const user = await storageInstance.createUser(userData);
      console.log("[ADMIN] Storage user created:", user.id);
      
      // Also create user in Firebase Authentication
      try {
        const { getAuth } = await import('firebase-admin/auth');
        const auth = getAuth();
        
        await auth.createUser({
          uid: user.id,
          email: user.email,
          password: validatedData.password, // Use original password for Firebase Auth
          displayName: user.name,
        });
        
        console.log(`User created in Firebase Auth: ${user.email}`);
      } catch (firebaseError: any) {
        console.warn("Firebase Auth user creation failed (continuing):", firebaseError?.message || firebaseError);
        // If Firebase Auth fails, we should probably delete the Firestore user too
        // For now, we'll continue since the user data is in Firestore
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("User creation error:", (error as any)?.message || error);
      res.status(500).json({ error: (error as any)?.message || "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const storageInstance = await storage;
      
      // Get user before deleting
      const user = await storageInstance.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Try to delete from Firebase Authentication, but don't block on failure
      try {
        const { getAuth } = await import('firebase-admin/auth');
        const auth = getAuth();
        await auth.deleteUser(id);
        console.log(`User deleted from Firebase Auth: ${user.email}`);
      } catch (firebaseError: any) {
        // If Firebase isn't configured or user not found, proceed with storage deletion
        const code = firebaseError?.code || firebaseError?.errorInfo?.code;
        const message = firebaseError?.message || String(firebaseError);
        const nonBlocking = code === 'auth/user-not-found' || code === 'app/invalid-credential' || code === 'app/no-app' || message?.toLowerCase?.().includes('credential') || message?.toLowerCase?.().includes('no app');
        if (nonBlocking) {
          console.warn(`Skipping Firebase Auth deletion for ${user.email}: ${code || ''} ${message}`);
        } else {
          console.warn(`Firebase Auth deletion error for ${user.email}, continuing with storage delete: ${message}`);
        }
      }
      
      // Always attempt storage deletion
      const deleted = await storageInstance.deleteUser(id);
      if (deleted) {
        return res.json({ success: true, message: "User deleted successfully" });
      }
      
      // Storage deletion failed
      console.error(`Storage deletion failed for user ${id}`);
      return res.status(500).json({ error: "Failed to delete user from storage" });
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/users/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Ensure role is Student for self-registration
      if (validatedData.role !== "Student") {
        return res.status(400).json({ error: "Self-registration is only allowed for students" });
      }
      
      const storageInstance = await storage;
      
      // Check if user with email already exists
      const existingUser = await storageInstance.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const userData = { ...validatedData, password: hashedPassword };
      
      // Create user in storage (Firestore or memory)
      const user = await storageInstance.createUser(userData);
      
      // Also create user in Firebase Authentication
      let firebaseAuthCreated = false;
      try {
        const { getAuth } = await import('firebase-admin/auth');
        const auth = getAuth();
        
        await auth.createUser({
          uid: user.id,
          email: user.email,
          password: validatedData.password, // Use original password for Firebase Auth
          displayName: user.name,
        });
        
        firebaseAuthCreated = true;
        console.log(`Student created in Firebase Auth: ${user.email}`);
      } catch (firebaseError: any) {
        console.error("Firebase Auth user creation failed:", firebaseError.message);
        
        // If Firebase is not properly configured, log a helpful message
        if (firebaseError.message?.includes('Firebase Admin') || firebaseError.message?.includes('credential')) {
          console.warn("Firebase Admin SDK not properly configured. User created in backend storage only.");
        }
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        console.error("Student registration error:", error);
        res.status(500).json({ error: "Failed to register user" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const storageInstance = await storage;
      const user = await storageInstance.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const storageInstance = await storage;
      const updatedUser = await storageInstance.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const storageInstance = await storage;
      const notifications = await storageInstance.getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const storageInstance = await storage;
      const notification = await storageInstance.createNotification(validatedData);
      res.json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid notification data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create notification" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
