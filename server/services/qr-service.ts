import QRCode from "qrcode";

export async function generateQRCode(data: any): Promise<string> {
  try {
    const qrString = JSON.stringify(data);
    const qrDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

export async function generateQRCodeBuffer(data: any): Promise<Buffer> {
  try {
    const qrString = JSON.stringify(data);
    const qrBuffer = await QRCode.toBuffer(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrBuffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw new Error("Failed to generate QR code buffer");
  }
}
