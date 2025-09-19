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
      const student = await storage.getUser(leaveRequest.studentId);
      
      // Header
      doc.fontSize(20).text('College Leave Pass', { align: 'center' });
      doc.moveDown();
      
      // Student Information
      doc.fontSize(14).text(`Name: ${student?.name || 'N/A'}`);
      doc.text(`Roll Number: ${student?.rollNumber || 'N/A'}`);
      doc.text(`Department: ${student?.department || 'N/A'}`);
      doc.text(`Year: ${student?.year || 'N/A'}`);
      doc.moveDown();
      
      // Leave Details
      doc.text(`Leave Type: ${leaveRequest.leaveType}`);
      doc.text(`From Date: ${new Date(leaveRequest.fromDate).toLocaleDateString()}`);
      doc.text(`To Date: ${new Date(leaveRequest.toDate).toLocaleDateString()}`);
      doc.text(`Reason: ${leaveRequest.reason}`);
      doc.moveDown();
      
      // Status
      doc.fontSize(16)
         .fillColor(leaveRequest.status === 'approved' ? 'green' : 'red')
         .text(`Status: ${leaveRequest.status.toUpperCase()}`, { align: 'center' });
      doc.fillColor('black');
      doc.moveDown();
      
      // QR Code
      if (leaveRequest.finalQrUrl) {
        try {
          const qrData = {
            studentId: leaveRequest.studentId,
            leaveId: leaveRequest.id,
            status: leaveRequest.status,
            fromDate: leaveRequest.fromDate,
            toDate: leaveRequest.toDate,
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
