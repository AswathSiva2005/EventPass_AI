import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

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
