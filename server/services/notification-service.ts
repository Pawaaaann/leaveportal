import { storage } from "../storage";
import { generateGuardianApprovalLink } from "./token-service";

export async function createNotification(
  userId: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  relatedLeaveId?: string
) {
  try {
    const storageInstance = await storage;
    const notification = await storageInstance.createNotification({
      user_id: userId,
      message,
    });
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
}

export async function notifyApprovers(
  leaveRequestId: string,
  stage: string,
  department?: string
) {
  try {
    const storageInstance = await storage;
    let approvers: any[] = [];
    
    switch (stage) {
      case "guardian":
        // For guardian stage, we need to handle external notification
        const leaveRequest = await storageInstance.getLeaveRequest(leaveRequestId);
        if (leaveRequest && leaveRequest.guardian_token) {
          const approvalLink = generateGuardianApprovalLink(leaveRequestId, leaveRequest.guardian_token);
          console.log(`Guardian approval required for leave request ${leaveRequestId}`);
          console.log(`Guardian approval link generated with token ending: ...${leaveRequest.guardian_token.slice(-8)}`);
          const guardianNumber = leaveRequest.guardian_number || '';
          const maskedNumber = guardianNumber.length > 5 ? 
            `${guardianNumber.slice(0, 3)}****${guardianNumber.slice(-2)}` : 
            '***';
          console.log(`Guardian number: ${maskedNumber}`);
          // TODO: Send SMS to guardian phone with approval link
          // For now, logging the link that would be sent via SMS
        } else {
          console.error(`No guardian token found for leave request ${leaveRequestId}`);
        }
        return;
      case "mentor":
        // TODO: Get mentor based on student's department and year
        approvers = await storageInstance.getUsersByRole("Mentor");
        break;
      case "hod":
        // TODO: Get HOD based on department
        approvers = await storageInstance.getUsersByRole("HOD");
        if (department) {
          approvers = approvers.filter(user => user.dept === department);
        }
        break;
      case "principal":
        approvers = await storageInstance.getUsersByRole("Principal");
        break;
      case "warden":
        approvers = await storageInstance.getUsersByRole("Warden");
        break;
    }
    
    for (const approver of approvers) {
      await createNotification(
        approver.id,
        `New leave application requires your approval`,
        "info",
        leaveRequestId
      );
    }
  } catch (error) {
    console.error("Error notifying approvers:", error);
  }
}
