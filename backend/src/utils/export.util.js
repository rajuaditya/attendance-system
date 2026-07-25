const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Streams an Excel workbook of attendance report rows directly to the
 * HTTP response. `rows` is an array of plain objects; `columns` defines
 * header/key/width mapping.
 */
const exportToExcel = async (res, { title, columns, rows, filename }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Attendance System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title || 'Report');
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 18 }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  };

  rows.forEach((row) => sheet.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename || 'report'}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Streams a simple tabular PDF report directly to the HTTP response.
 */
const exportToPdf = (res, { title, columns, rows, filename }) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename || 'report'}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text(title || 'Report', { align: 'center' });
  doc.moveDown();

  const colWidth = (doc.page.width - 60) / columns.length;
  let y = doc.y;

  doc.fontSize(9).font('Helvetica-Bold');
  columns.forEach((col, i) => {
    doc.text(col.header, 30 + i * colWidth, y, { width: colWidth, ellipsis: true });
  });
  doc.moveDown();
  y = doc.y;
  doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();

  doc.font('Helvetica').fontSize(8);
  rows.forEach((row) => {
    if (doc.y > doc.page.height - 50) {
      doc.addPage();
    }
    const rowY = doc.y + 5;
    columns.forEach((col, i) => {
      doc.text(String(row[col.key] ?? ''), 30 + i * colWidth, rowY, {
        width: colWidth,
        ellipsis: true,
      });
    });
    doc.moveDown();
  });

  doc.end();
};

module.exports = { exportToExcel, exportToPdf };
