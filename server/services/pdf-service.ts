import PDFDocument from "pdfkit";
import { LeaveRequest, User } from "@shared/schema";
import { storage } from "../storage";
import { generateQRCodeBuffer } from "./qr-service";

export async function generatePDF(leaveRequest: LeaveRequest): Promise<Buffer> {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  doc.on('data', buffers.push.bind(buffers));
  
  return new Promise(async (resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    try {
      // Get student data
      const storageInstance = await storage;
      const student = await storageInstance.getUser(leaveRequest.student_id);
      
      // Header
      doc.fontSize(20).text('College Leave Pass', { align: 'center' });
      doc.moveDown();
      
      // Student Information
      doc.fontSize(14).text(`Name: ${student?.name || 'N/A'}`);
      doc.text(`Register Number: ${student?.register_number || 'N/A'}`);
      doc.text(`Department: ${student?.dept || 'N/A'}`);
      doc.text(`Year: ${student?.year || 'N/A'}`);
      doc.moveDown();
      
      // Leave Details
      doc.text(`Leave Type: ${leaveRequest.leave_type}`);
      doc.text(`From Date: ${new Date(leaveRequest.start_date).toLocaleDateString()}`);
      doc.text(`To Date: ${new Date(leaveRequest.end_date).toLocaleDateString()}`);
      doc.text(`Reason: ${leaveRequest.reason}`);
      doc.moveDown();
      
      // Status
      doc.fontSize(16)
         .fillColor(leaveRequest.status === 'approved' ? 'green' : 'red')
         .text(`Status: ${leaveRequest.status.toUpperCase()}`, { align: 'center' });
      doc.fillColor('black');
      doc.moveDown();
      
      // QR Code
      if (leaveRequest.final_qr_url) {
        try {
          const qrData = {
            student_id: leaveRequest.student_id,
            leaveId: leaveRequest.id,
            status: leaveRequest.status,
            start_date: leaveRequest.start_date,
            end_date: leaveRequest.end_date,
          };
          
          const qrBuffer = await generateQRCodeBuffer(qrData);
          doc.image(qrBuffer, doc.page.width / 2 - 64, doc.y, { width: 128 });
        } catch (error) {
          console.error("Error adding QR code to PDF:", error);
          doc.text("QR Code generation failed", { align: 'center' });
        }
      }
      
      // Footer
      doc.y = doc.page.height - 100;
      doc.fontSize(10)
         .text('This is a digitally generated leave pass.', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
