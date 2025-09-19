import { storage } from "../storage";

export async function createNotification(
  userId: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  relatedLeaveId?: string
) {
  try {
    const notification = await storage.createNotification({
      userId,
      message,
      type,
      relatedLeaveId: relatedLeaveId || null,
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
    let approvers: any[] = [];
    
    switch (stage) {
      case "mentor":
        // TODO: Get mentor based on student's department and year
        approvers = await storage.getUsersByRole("Mentor");
        break;
      case "hod":
        // TODO: Get HOD based on department
        approvers = await storage.getUsersByRole("HOD");
        if (department) {
          approvers = approvers.filter(user => user.department === department);
        }
        break;
      case "principal":
        approvers = await storage.getUsersByRole("Principal");
        break;
      case "warden":
        approvers = await storage.getUsersByRole("Warden");
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
