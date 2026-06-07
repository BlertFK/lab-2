const path = require("path");
const { Writable } = require("stream");

const createDependencyError = (packageName) => {
  const error = new Error(`Missing dependency: ${packageName}. Install it in backend/package.json before using report exports.`);
  error.statusCode = 500;
  return error;
};

const loadFastCsv = () => {
  try {
    return require("fast-csv");
  } catch {
    throw createDependencyError("fast-csv");
  }
};

const loadExcelJs = () => {
  try {
    return require("exceljs");
  } catch {
    throw createDependencyError("exceljs");
  }
};

const loadPdfKit = () => {
  try {
    return require("pdfkit");
  } catch {
    throw createDependencyError("pdfkit");
  }
};

const normalizeReport = (report) => {
  if (!report || !Array.isArray(report.rows)) {
    const error = new Error("A report object with a rows array is required.");
    error.statusCode = 400;
    throw error;
  }

  return {
    type: report.type || "report",
    parameters: report.parameters || {},
    rows: report.rows,
  };
};

const getColumns = (rows) => {
  const columns = [];
  const seen = new Set();

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    });
  });

  return columns;
};

const stringifyValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

const buildFilename = (reportType, extension) => {
  const safeType = String(reportType || "report").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safeType}_${stamp}.${extension}`;
};

const exportCsv = (report) => {
  const { format } = loadFastCsv();
  const normalized = normalizeReport(report);
  const columns = getColumns(normalized.rows);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const sink = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    const csvStream = format({ headers: columns, writeHeaders: true });

    csvStream
      .on("error", reject)
      .pipe(sink)
      .on("error", reject)
      .on("finish", () => {
        resolve({
          filename: buildFilename(normalized.type, "csv"),
          contentType: "text/csv; charset=utf-8",
          buffer: Buffer.concat(chunks),
        });
      });

    normalized.rows.forEach((row) => {
      const record = {};
      columns.forEach((column) => {
        record[column] = stringifyValue(row[column]);
      });
      csvStream.write(record);
    });

    csvStream.end();
  });
};

const exportExcel = async (report) => {
  const ExcelJS = loadExcelJs();
  const normalized = normalizeReport(report);
  const columns = getColumns(normalized.rows);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  workbook.creator = "RealEstate Platform";
  workbook.created = new Date();
  workbook.modified = new Date();

  worksheet.addRow([normalized.type]);
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.addRow(["Generated At", new Date().toISOString()]);

  Object.entries(normalized.parameters).forEach(([key, value]) => {
    worksheet.addRow([key, stringifyValue(value)]);
  });

  worksheet.addRow([]);

  const headerRowNumber = worksheet.rowCount + 1;
  worksheet.addRow(columns);

  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerRow.alignment = { vertical: "middle" };

  normalized.rows.forEach((row) => {
    worksheet.addRow(columns.map((column) => stringifyValue(row[column])));
  });

  worksheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: Math.max(columns.length, 1) },
  };

  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, String(cell.value || "").length);
    });
    column.width = Math.min(maxLength + 2, 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    filename: buildFilename(normalized.type, "xlsx"),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(buffer),
  };
};

const exportPdf = async (report) => {
  const PDFDocument = loadPdfKit();
  const normalized = normalizeReport(report);
  const columns = getColumns(normalized.rows);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => {
      resolve({
        filename: buildFilename(normalized.type, "pdf"),
        contentType: "application/pdf",
        buffer: Buffer.concat(chunks),
      });
    });

    doc.fontSize(18).text(normalized.type.replace(/_/g, " "), { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated At: ${new Date().toISOString()}`);

    Object.entries(normalized.parameters).forEach(([key, value]) => {
      doc.text(`${key}: ${stringifyValue(value)}`);
    });

    doc.moveDown();

    if (normalized.rows.length === 0) {
      doc.fontSize(11).text("No rows returned for this report.");
      doc.end();
      return;
    }

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text(columns.join(" | "));
    doc.moveDown(0.4);
    doc.font("Helvetica");

    normalized.rows.forEach((row) => {
      const line = columns.map((column) => stringifyValue(row[column])).join(" | ");
      if (doc.y > 760) doc.addPage();
      doc.text(line, { width: 520 });
    });

    doc.end();
  });
};

const exportReport = async (report, format) => {
  if (format === "csv") return exportCsv(report);
  if (format === "excel" || format === "xlsx") return exportExcel(report);
  if (format === "pdf") return exportPdf(report);

  const error = new Error("format must be csv, excel, or pdf.");
  error.statusCode = 400;
  throw error;
};

const saveExport = async (exportedReport, directory) => {
  const fs = require("fs/promises");
  await fs.mkdir(directory, { recursive: true });

  const filePath = path.join(directory, exportedReport.filename);
  await fs.writeFile(filePath, exportedReport.buffer);

  return {
    ...exportedReport,
    filePath,
  };
};

module.exports = {
  exportCsv,
  exportExcel,
  exportPdf,
  exportReport,
  saveExport,
};
