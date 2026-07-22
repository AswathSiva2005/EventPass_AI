import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

interface ExportRow {
  registrationId: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  year: number;
  verificationStatus: string;
  attendanceStatus: string;
  entryTime?: Date;
  exitTime?: Date;
  createdAt: Date;
  event: unknown;
  college: unknown;
  department: unknown;
}

const relatedName = (value: unknown): string => {
  if (typeof value !== "object" || value === null || !("name" in value)) return "";
  return typeof value.name === "string" ? value.name : "";
};

export const createExcelExport = async (rows: ExportRow[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EventPass AI";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Registrations", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  sheet.columns = [
    { header: "Registration ID", key: "registrationId", width: 24 },
    { header: "Student", key: "name", width: 24 },
    { header: "Roll Number", key: "rollNumber", width: 18 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "College", key: "college", width: 28 },
    { header: "Department", key: "department", width: 24 },
    { header: "Year", key: "year", width: 10 },
    { header: "Event", key: "event", width: 28 },
    { header: "Verification", key: "verificationStatus", width: 16 },
    { header: "Attendance", key: "attendanceStatus", width: 16 },
    { header: "Entry Time", key: "entryTime", width: 22 },
    { header: "Exit Time", key: "exitTime", width: 22 },
    { header: "Registered At", key: "createdAt", width: 22 }
  ];
  for (const row of rows) {
    sheet.addRow({
      ...row,
      college: relatedName(row.college),
      department: relatedName(row.department),
      event: relatedName(row.event)
    });
  }
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0C1A2D" }
  };
  sheet.autoFilter = { from: "A1", to: "N1" };
  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
};

export const createPdfExport = (rows: ExportRow[]): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 36, bufferPages: true });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(20).fillColor("#0c1a2d").text("EventPass AI — Registrations");
    document.moveDown(0.4).fontSize(9).fillColor("#64748b").text(
      `Generated ${new Date().toLocaleString("en-IN")} • ${rows.length} records`
    );
    document.moveDown();

    for (const row of rows) {
      if (document.y > 740) document.addPage();
      document
        .fontSize(10)
        .fillColor("#0c1a2d")
        .font("Helvetica-Bold")
        .text(`${row.registrationId}  •  ${row.name}`);
      document
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#475569")
        .text(
          `${relatedName(row.event)} | ${relatedName(row.college)} | ${relatedName(row.department)} | ${row.rollNumber}`
        )
        .text(
          `${row.email} | ${row.phone} | Verification: ${row.verificationStatus} | Attendance: ${row.attendanceStatus}`
        );
      document.moveDown(0.6).strokeColor("#e2e8f0").moveTo(36, document.y).lineTo(559, document.y).stroke();
      document.moveDown(0.6);
    }
    document.end();
  });

export const createStudentPassPdf = async (pass: {
  registrationId: string;
  studentName: string;
  rollNumber: string;
  year: number;
  collegeName: string;
  departmentName: string;
  eventName: string;
  eventStartsAt: Date;
  eventEndsAt: Date;
  venue: string;
  verificationStatus: string;
  qrValue: string;
}): Promise<Buffer> => {
  const qrImage = await QRCode.toBuffer(pass.qrValue, { type: "png", width: 520, margin: 1, errorCorrectionLevel: "H" });
  return await new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 42 });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.roundedRect(42, 42, 511, 758, 18).fillAndStroke("#f8fafc", "#cbd5e1");
    document.rect(42, 42, 511, 112).fill("#064e3b");
    document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("EVENTPASS AI", 70, 68);
    document.fontSize(27).text("Student Event Pass", 70, 91);
    document.font("Helvetica").fontSize(10).fillColor("#d1fae5").text(pass.eventName, 70, 126, { width: 450 });

    document.image(qrImage, 180, 184, { width: 235, height: 235 });
    document.fillColor("#0f172a").font("Helvetica-Bold").fontSize(15).text(pass.registrationId, 42, 437, { width: 511, align: "center" });
    document.font("Helvetica").fontSize(9).fillColor("#64748b").text("Present this QR code to the volunteer at the entrance", 42, 461, { width: 511, align: "center" });

    const row = (label: string, value: string, y: number) => {
      document.fillColor("#64748b").font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), 78, y);
      document.fillColor("#0f172a").font("Helvetica").fontSize(11).text(value, 78, y + 14, { width: 440 });
    };
    row("Student", pass.studentName, 505);
    row("Roll number", `${pass.rollNumber} · Year ${pass.year}`, 552);
    row("College and department", `${pass.collegeName} · ${pass.departmentName}`, 599);
    row("Venue", pass.venue, 646);
    row("Event schedule", `${pass.eventStartsAt.toLocaleString("en-IN")} – ${pass.eventEndsAt.toLocaleString("en-IN")}`, 693);
    document.fillColor(pass.verificationStatus === "approved" ? "#047857" : "#b45309").font("Helvetica-Bold").fontSize(10).text(`Registration status: ${pass.verificationStatus.toUpperCase()}`, 78, 754);
    document.end();
  });
};
