import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaveRequestSchema, insertUserSchema, insertNotificationSchema } from "@shared/schema";
import { generateQRCode } from "./services/qr-service";
// import { generatePDF } from "./services/pdf-service";
import { notifyApprovers } from "./services/notification-service";
import { generateGuardianToken, verifyGuardianToken, generateGuardianApprovalLink } from "./services/token-service";

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
      const storageInstance = await storage;
      
      // Generate guardian approval token
      const { token, expiresAt } = generateGuardianToken(
        `temp-${Date.now()}`, // Will be replaced with actual ID
        validatedData.guardian_number
      );
      
      // Create leave request with guardian token
      const leaveRequestData = {
        ...validatedData,
        guardian_token: token,
        guardian_token_expires_at: expiresAt
      };
      
      const leaveRequest = await storageInstance.createLeaveRequest(leaveRequestData);
      
      // Regenerate token with actual leave request ID
      const { token: finalToken, expiresAt: finalExpiresAt } = generateGuardianToken(
        leaveRequest.id,
        validatedData.guardian_number
      );
      
      // Update leave request with final token
      await storageInstance.updateLeaveRequest(leaveRequest.id, {
        guardian_token: finalToken,
        guardian_token_expires_at: finalExpiresAt
      });
      
      // Create notification for guardian
      await notifyApprovers(leaveRequest.id, "guardian");
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
        const stages = ["guardian", "mentor", "hod", "principal"];
        
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

          // Notify next stage approvers
          const student = await storageInstance.getUser(leaveRequest.student_id);
          await notifyApprovers(id, stages[nextStageIndex], student?.dept);
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

  // Guardian-specific approval endpoint with token authentication
  app.post("/api/leave-requests/:id/guardian-approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { token, action, comments } = req.body;
      
      const storageInstance = await storage;
      const leaveRequest = await storageInstance.getLeaveRequest(id);
      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      // Verify guardian token matches stored token and is cryptographically valid
      if (!leaveRequest.guardian_token || leaveRequest.guardian_token !== token) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      
      const tokenVerification = verifyGuardianToken(token, id, leaveRequest.guardian_number);
      if (!tokenVerification.valid) {
        return res.status(403).json({ 
          error: tokenVerification.error || "Invalid token",
          expired: tokenVerification.expired 
        });
      }

      // Only allow guardian approval if currently at guardian stage
      if (leaveRequest.approver_stage !== "guardian") {
        return res.status(400).json({ error: "Leave request is not at guardian approval stage" });
      }

      if (action === "reject") {
        // If rejected by guardian, update status and stop workflow
        await storageInstance.updateLeaveRequest(id, {
          status: "rejected",
          comments: comments || "Application rejected by guardian",
          guardian_token: null, // Invalidate token after use
        });

        // Generate rejection QR code
        const qrData = {
          student_id: leaveRequest.student_id,
          leaveId: id,
          status: "Not Approved",
          rejectedBy: "Guardian",
          rejectionReason: comments || "Rejected by guardian",
        };
        const qrUrl = await generateQRCode(qrData);
        
        await storageInstance.updateLeaveRequest(id, { final_qr_url: qrUrl });
      } else {
        // If approved by guardian, move to next stage (mentor)
        await storageInstance.updateLeaveRequest(id, {
          approver_stage: "mentor",
          comments: comments || "Approved by guardian",
          guardian_token: null, // Invalidate token after use
        });

        // Get student info for department-based mentor notification
        const student = await storageInstance.getUser(leaveRequest.student_id);
        await notifyApprovers(id, "mentor", student?.dept);
      }

      res.json({ success: true, message: `Leave request ${action}d by guardian` });
    } catch (error) {
      console.error("Guardian approval error:", error);
      res.status(500).json({ error: "Failed to process guardian approval" });
    }
  });

  // Guardian approval page endpoint (GET)
  app.get("/guardian-approve/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).send("Missing approval token");
      }

      const storageInstance = await storage;
      const leaveRequest = await storageInstance.getLeaveRequest(id);
      if (!leaveRequest) {
        return res.status(404).send("Leave request not found");
      }

      // Verify token is valid before showing approval page
      if (!leaveRequest.guardian_token || leaveRequest.guardian_token !== token) {
        return res.status(403).send("Invalid or expired approval link");
      }

      const tokenVerification = verifyGuardianToken(token as string, id, leaveRequest.guardian_number);
      if (!tokenVerification.valid) {
        if (tokenVerification.expired) {
          return res.status(403).send("This approval link has expired");
        }
        return res.status(403).send("Invalid approval link");
      }

      if (leaveRequest.approver_stage !== "guardian") {
        return res.status(400).send("This leave request has already been processed");
      }

      // Serve guardian approval page with proper HTML escaping
      const approvalPage = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline' 'self'; style-src 'unsafe-inline';">
          <meta name="referrer" content="no-referrer">
          <title>Guardian Approval - Leave Request</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { padding: 10px 20px; margin: 10px; border: none; border-radius: 5px; cursor: pointer; }
            .approve { background-color: #4CAF50; color: white; }
            .reject { background-color: #f44336; color: white; }
            textarea { width: 100%; padding: 10px; margin: 10px 0; }
          </style>
        </head>
        <body data-token="${escapeHtml(token as string)}" data-leave-id="${escapeHtml(id)}">
          <h1>Guardian Approval Required</h1>
          <div class="card">
            <h3>Leave Request Details</h3>
            <p><strong>Student:</strong> <span data-field="student_id">${escapeHtml(leaveRequest.student_id)}</span></p>
            <p><strong>Leave Type:</strong> <span data-field="leave_type">${escapeHtml(leaveRequest.leave_type)}</span></p>
            <p><strong>Reason:</strong> <span data-field="reason">${escapeHtml(leaveRequest.reason)}</span></p>
            <p><strong>From:</strong> <span data-field="start_date">${escapeHtml(leaveRequest.start_date)}</span></p>
            <p><strong>To:</strong> <span data-field="end_date">${escapeHtml(leaveRequest.end_date)}</span></p>
            <p><strong>Guardian Number:</strong> <span data-field="guardian_number">${escapeHtml(leaveRequest.guardian_number)}</span></p>
          </div>
          
          <div class="card">
            <h3>Guardian Decision</h3>
            <textarea id="comments" placeholder="Optional comments..." rows="3"></textarea>
            <div>
              <button class="button approve" id="approve-btn">Approve</button>
              <button class="button reject" id="reject-btn">Reject</button>
            </div>
          </div>

          <script>
            document.addEventListener('DOMContentLoaded', function() {
              function submitDecision(action) {
                const comments = document.getElementById('comments').value;
                const token = document.body.getAttribute('data-token');
                const leaveId = document.body.getAttribute('data-leave-id');
                
                fetch('/api/leave-requests/' + leaveId + '/guardian-approve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: token,
                    action: action,
                    comments: comments
                  })
                })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    document.body.innerHTML = '<h1>Decision Submitted</h1><p>Thank you! Your decision has been recorded.</p>';
                  } else {
                    alert('Error: ' + (data.error || 'Unknown error'));
                  }
                })
                .catch(error => {
                  alert('Error submitting decision: ' + error.message);
                });
              }
              
              document.getElementById('approve-btn').addEventListener('click', function() {
                submitDecision('approve');
              });
              
              document.getElementById('reject-btn').addEventListener('click', function() {
                submitDecision('reject');
              });
            });
          </script>
        </body>
        </html>
      `;
      
      res.send(approvalPage);
    } catch (error) {
      console.error("Guardian approval page error:", error);
      res.status(500).send("Error loading approval page");
    }
  });

  // Get all leave requests for admin overview
  app.get("/api/leave-requests/all", async (req, res) => {
    try {
      const storageInstance = await storage;
      
      // Get all leave requests across all stages
      const allRequests = await Promise.all([
        storageInstance.getPendingLeaveRequestsByStage("guardian"),
        storageInstance.getPendingLeaveRequestsByStage("mentor"),
        storageInstance.getPendingLeaveRequestsByStage("hod"),
        storageInstance.getPendingLeaveRequestsByStage("principal"),
        storageInstance.getPendingLeaveRequestsByStage("warden")
      ]);
      
      // Flatten the arrays and also get approved/rejected requests
      // For now, we'll return the flattened pending requests
      const flattenedRequests = allRequests.flat();
      const sanitizedRequests = flattenedRequests.map(sanitizeLeaveRequest);
      
      res.json(sanitizedRequests);
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

  // User login route with password validation
  app.post("/api/users/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      if (!email || !password || !role) {
        return res.status(400).json({ error: "Email, password and role are required" });
      }
      
      const storageInstance = await storage;
      
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
    } catch (error) {
      console.error("User login error:", error);
      res.status(500).json({ error: "Failed to login user" });
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
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const userData = { ...validatedData, password: hashedPassword };
      
      // Create user in storage with hashed password
      const user = await storageInstance.createUser(userData);
      
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
