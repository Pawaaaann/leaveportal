import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaveRequestSchema, approvalSchema } from "@shared/schema";
import { generateQRCode } from "./services/qr-service";
// import { generatePDF } from "./services/pdf-service";
// import { createNotification } from "./services/notification-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Leave request routes
  app.post("/api/leave-requests", async (req, res) => {
    try {
      const validatedData = insertLeaveRequestSchema.parse(req.body);
      const leaveRequest = await storage.createLeaveRequest(validatedData);
      
      // Create notification for mentor
      // TODO: Implement notification service
      console.log("New leave application submitted by student:", validatedData.studentId);
      
      res.json(leaveRequest);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/leave-requests/student/:studentId", async (req, res) => {
    try {
      const applications = await storage.getLeaveRequestsByStudent(req.params.studentId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/leave-requests/current/:studentId", async (req, res) => {
    try {
      const currentApplication = await storage.getCurrentLeaveRequest(req.params.studentId);
      res.json(currentApplication);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current application" });
    }
  });

  app.get("/api/leave-requests/pending/:stage", async (req, res) => {
    try {
      const { stage } = req.params;
      const { department } = req.query;
      
      const pendingApplications = await storage.getPendingLeaveRequestsByStage(
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
      
      const leaveRequest = await storage.getLeaveRequest(id);
      if (!leaveRequest) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      // Create approval record
      const approval = {
        stage: leaveRequest.currentStage,
        approverId: "current-user-id", // TODO: Get from auth context
        approverName: "Current User", // TODO: Get from auth context
        status: action,
        comments: comments || "",
        timestamp: new Date().toISOString(),
      };

      const currentApprovals = Array.isArray(leaveRequest.approvals) 
        ? leaveRequest.approvals as any[] 
        : [];

      if (action === "reject") {
        // If rejected, update status and stop workflow
        await storage.updateLeaveRequest(id, {
          status: "rejected",
          approvals: [...currentApprovals, approval],
        });

        // Generate rejection QR code
        const qrData = {
          studentId: leaveRequest.studentId,
          leaveId: id,
          status: "Not Approved",
          rejectedBy: approval.approverName,
          rejectionReason: comments,
        };
        const qrUrl = await generateQRCode(qrData);
        
        await storage.updateLeaveRequest(id, { finalQrUrl: qrUrl });
      } else {
        // If approved, move to next stage or complete
        const stages = ["mentor", "hod", "principal"];
        if (leaveRequest.isHostelStudent) {
          stages.push("warden");
        }

        const currentStageIndex = stages.indexOf(leaveRequest.currentStage);
        const nextStageIndex = currentStageIndex + 1;

        if (nextStageIndex >= stages.length) {
          // Final approval - generate QR code
          const qrData = {
            studentId: leaveRequest.studentId,
            leaveId: id,
            status: "Approved",
            fromDate: leaveRequest.fromDate,
            toDate: leaveRequest.toDate,
            approvedBy: approval.approverName,
          };
          const qrUrl = await generateQRCode(qrData);

          await storage.updateLeaveRequest(id, {
            status: "approved",
            approvals: [...currentApprovals, approval],
            finalQrUrl: qrUrl,
          });
        } else {
          // Move to next stage
          await storage.updateLeaveRequest(id, {
            currentStage: stages[nextStageIndex],
            approvals: [...currentApprovals, approval],
          });
        }
      }

      // Create notification for student
      // TODO: Implement notification service
      console.log(`Leave application ${action}d for student:`, leaveRequest.studentId);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to process approval" });
    }
  });

  app.get("/api/leave-requests/:id/pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const leaveRequest = await storage.getLeaveRequest(id);
      
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

  // Statistics routes
  app.get("/api/leave-requests/stats/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const applications = await storage.getLeaveRequestsByStudent(studentId);
      
      const stats = {
        total: applications.length,
        approved: applications.filter(app => app.status === "approved").length,
        pending: applications.filter(app => app.status === "pending").length,
        rejected: applications.filter(app => app.status === "rejected").length,
        daysUsed: applications
          .filter(app => app.status === "approved")
          .reduce((total, app) => {
            const from = new Date(app.fromDate);
            const to = new Date(app.toDate);
            const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return total + days;
          }, 0),
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
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
      const updatedUser = await storage.updateUser(req.params.id, req.body);
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
      const notifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
