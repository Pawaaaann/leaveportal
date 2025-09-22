import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaveRequestSchema, insertUserSchema, insertNotificationSchema } from "@shared/schema";
import { generateQRCode } from "./services/qr-service";
// import { generatePDF } from "./services/pdf-service";
// import { createNotification } from "./services/notification-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Leave request routes
  app.post("/api/leave-requests", async (req, res) => {
    try {
      const validatedData = insertLeaveRequestSchema.parse(req.body);
      const storageInstance = await storage;
      const leaveRequest = await storageInstance.createLeaveRequest(validatedData);
      
      // Create notification for mentor
      // TODO: Implement notification service
      console.log("New leave application submitted by student:", validatedData.student_id);
      
      res.json(leaveRequest);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/leave-requests/student/:studentId", async (req, res) => {
    try {
      const storageInstance = await storage;
      const applications = await storageInstance.getLeaveRequestsByStudent(req.params.studentId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/leave-requests/current/:studentId", async (req, res) => {
    try {
      const storageInstance = await storage;
      const currentApplication = await storageInstance.getCurrentLeaveRequest(req.params.studentId);
      res.json(currentApplication);
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
      res.json(pendingApplications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending applications" });
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

        // Generate rejection QR code
        const qrData = {
          student_id: leaveRequest.student_id,
          leaveId: id,
          status: "Not Approved",
          rejectedBy: "Current User", // TODO: Get from auth context
          rejectionReason: comments,
        };
        const qrUrl = await generateQRCode(qrData);
        
        await storageInstance.updateLeaveRequest(id, { final_qr_url: qrUrl });
      } else {
        // If approved, move to next stage or complete
        const stages = ["mentor", "hod", "principal"];
        
        // Check if student is hostel student by looking up user info
        const student = await storageInstance.getUser(leaveRequest.student_id);
        if (student?.hostel_status) {
          stages.push("warden");
        }

        const currentStageIndex = stages.indexOf(leaveRequest.approver_stage);
        const nextStageIndex = currentStageIndex + 1;

        if (nextStageIndex >= stages.length) {
          // Final approval - generate QR code
          const qrData = {
            student_id: leaveRequest.student_id,
            leaveId: id,
            status: "Approved",
            start_date: leaveRequest.start_date,
            end_date: leaveRequest.end_date,
            approvedBy: "Current User", // TODO: Get from auth context
          };
          const qrUrl = await generateQRCode(qrData);

          await storageInstance.updateLeaveRequest(id, {
            status: "approved",
            comments: comments || "Application approved",
            final_qr_url: qrUrl,
          });
        } else {
          // Move to next stage
          await storageInstance.updateLeaveRequest(id, {
            approver_stage: stages[nextStageIndex],
            comments: comments || `Approved by ${leaveRequest.approver_stage}`,
          });
        }
      }

      // Create notification for student
      // TODO: Implement notification service
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

      // TODO: Implement PDF generation service
      const pdfBuffer = Buffer.from("Mock PDF content", "utf-8");
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=leave-pass-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Get all leave requests for admin overview
  app.get("/api/leave-requests/all", async (req, res) => {
    try {
      const storageInstance = await storage;
      
      // Get all leave requests across all stages
      const allRequests = await Promise.all([
        storageInstance.getPendingLeaveRequestsByStage("mentor"),
        storageInstance.getPendingLeaveRequestsByStage("hod"),
        storageInstance.getPendingLeaveRequestsByStage("principal"),
        storageInstance.getPendingLeaveRequestsByStage("warden")
      ]);
      
      // Flatten the arrays and also get approved/rejected requests
      // For now, we'll return the flattened pending requests
      const flattenedRequests = allRequests.flat();
      
      res.json(flattenedRequests);
    } catch (error) {
      console.error("Error fetching all leave requests:", error);
      res.status(500).json({ error: "Failed to fetch leave requests" });
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
      
      // Create user in storage (Firestore)
      const user = await storageInstance.createUser(validatedData);
      
      // Also create user in Firebase Authentication
      try {
        const { getAuth } = await import('firebase-admin/auth');
        const auth = getAuth();
        
        await auth.createUser({
          uid: user.id,
          email: user.email,
          password: validatedData.password,
          displayName: user.name,
        });
        
        console.log(`User created in Firebase Auth: ${user.email}`);
      } catch (firebaseError: any) {
        console.error("Firebase Auth user creation failed:", firebaseError);
        // If Firebase Auth fails, we should probably delete the Firestore user too
        // For now, we'll continue since the user data is in Firestore
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        console.error("User creation error:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
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
      
      const user = await storageInstance.createUser(validatedData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
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
