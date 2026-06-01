import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Cyrillic font loading for PDF
let cyrillicFontLoaded = false;

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const loadCyrillicFont = async (doc) => {
  if (cyrillicFontLoaded) {
    doc.setFont('Roboto');
    return true;
  }
  try {
    const response = await fetch('/fonts/Roboto-Regular.ttf');
    if (!response.ok) throw new Error('Font not found');
    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    doc.addFileToVFS('Roboto-Regular.ttf', base64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    cyrillicFontLoaded = true;
    return true;
  } catch (e) {
    console.warn('Cyrillic font not loaded, PDF may not display Ukrainian text correctly');
    return false;
  }
};

export const exportToExcel = (data, columns, fileName = 'export') => {
  const headers = columns.map(c => c.title);
  const rows = data.map(row =>
    columns.map(col => {
      if (col.exportRender) return col.exportRender(row[col.dataIndex], row);
      return row[col.dataIndex] ?? '';
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Auto column widths
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
};

export const exportToPDF = async (data, columns, fileName = 'export', title = '') => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Load Cyrillic font
  const hasCyrillicFont = await loadCyrillicFont(doc);

  doc.setFontSize(14);
  if (title) {
    doc.text(title, 14, 15);
  }

  const headers = columns.map(c => c.title);
  const rows = data.map(row =>
    columns.map(col => {
      if (col.exportRender) return col.exportRender(row[col.dataIndex], row);
      return String(row[col.dataIndex] ?? '');
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 22 : 10,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      font: hasCyrillicFont ? 'Roboto' : 'helvetica',
    },
    headStyles: { fillColor: [22, 119, 255], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`${fileName}.pdf`);
};
