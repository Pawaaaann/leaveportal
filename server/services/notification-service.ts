import { storage } from "../storage";

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
        console.log(`Guardian approval required for leave request ${leaveRequestId}`);
        // TODO: Implement SMS/email notification to guardian
        // For now, just log the approval requirement
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
