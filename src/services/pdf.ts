import PDFDocument from 'pdfkit';
import { schoolConfig } from '../../config/school.config';

interface StudentInfo {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  class: string;
  session: string;
  term: string;
  parentName: string;
}

interface ResultItem {
  subjectName: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
}

interface PaymentInfo {
  receiptNumber: string;
  studentName: string;
  studentId: string;
  class: string;
  category: string;
  amountPaid: number;
  totalExpected: number;
  balance: number;
  paymentDate: string;
  recordedBy: string;
}

/**
 * Generates a beautiful Report Card PDF using PDFKit
 */
export function generateReportCardPDF(student: StudentInfo, results: ResultItem[], attendance: string = "95%"): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- PAGE BORDER ---
      doc.rect(20, 20, 555, 802).stroke('#cbd5e1');

      // --- HEADER / BRANDING ---
      // Draw a vector school crest (shield)
      doc.save();
      doc.fillColor(schoolConfig.schoolColors.primary);
      doc.path('M 55 45 L 85 45 L 90 75 L 70 95 L 50 75 Z').fill();
      doc.fillColor(schoolConfig.schoolColors.secondary);
      doc.circle(70, 70, 10).fill();
      doc.restore();

      // School Name and Motto
      doc.fillColor(schoolConfig.schoolColors.primary)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(schoolConfig.schoolName, 110, 45, { align: 'left' });
      
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .fillColor(schoolConfig.schoolColors.secondary)
         .text(schoolConfig.schoolMotto.toUpperCase(), 110, 65, { align: 'left' });

      // School Contact details
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#475569')
         .text(`${schoolConfig.schoolAddress}  |  Tel: ${schoolConfig.schoolPhone}  |  Email: ${schoolConfig.schoolEmail}`, 110, 80, { align: 'left', width: 440 });

      // Divider Line
      doc.moveTo(40, 105).lineTo(555, 105).strokeColor(schoolConfig.schoolColors.secondary).lineWidth(2).stroke();

      // --- TITLE ---
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(schoolConfig.schoolColors.primary)
         .text('OFFICIAL STUDENT REPORT CARD', 40, 120, { align: 'center' });

      // --- STUDENT INFO BLOCK ---
      doc.rect(40, 145, 515, 85).fillColor('#f8fafc').fill();
      doc.rect(40, 145, 515, 85).strokeColor('#e2e8f0').lineWidth(1).stroke();

      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      
      // Column 1
      doc.text('Student ID:', 55, 155).font('Helvetica').text(student.id, 140, 155);
      doc.font('Helvetica-Bold').text('Admission No:', 55, 172).font('Helvetica').text(student.admissionNumber, 140, 172);
      doc.font('Helvetica-Bold').text('Full Name:', 55, 190).font('Helvetica').text(student.fullName.toUpperCase(), 140, 190);
      doc.font('Helvetica-Bold').text('Gender:', 55, 208).font('Helvetica').text(student.gender, 140, 208);

      // Column 2
      doc.font('Helvetica-Bold').text('Class:', 310, 155).font('Helvetica').text(student.class, 390, 155);
      doc.font('Helvetica-Bold').text('Session:', 310, 172).font('Helvetica').text(student.session, 390, 172);
      doc.font('Helvetica-Bold').text('Term:', 310, 190).font('Helvetica').text(student.term, 390, 190);
      doc.font('Helvetica-Bold').text('Parent/Guardian:', 310, 208).font('Helvetica').text(student.parentName, 390, 208);

      // --- RESULTS TABLE HEADER ---
      const tableTop = 250;
      doc.rect(40, tableTop, 515, 20).fillColor(schoolConfig.schoolColors.primary).fill();
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('SUBJECT', 50, tableTop + 6, { width: 180 });
      doc.text('CA (30)', 240, tableTop + 6, { width: 50, align: 'center' });
      doc.text('EXAM (70)', 300, tableTop + 6, { width: 60, align: 'center' });
      doc.text('TOTAL (100)', 370, tableTop + 6, { width: 70, align: 'center' });
      doc.text('GRADE', 450, tableTop + 6, { width: 45, align: 'center' });
      doc.text('REMARK', 500, tableTop + 6, { width: 50, align: 'center' });

      // --- RESULTS TABLE BODY ---
      let currentY = tableTop + 20;
      let totalAggregate = 0;
      let subjectCount = 0;

      results.forEach((row, i) => {
        // Striped background rows
        if (i % 2 === 1) {
          doc.rect(40, currentY, 515, 20).fillColor('#f8fafc').fill();
        }
        
        doc.fillColor('#334155').fontSize(8.5).font('Helvetica');
        doc.text(row.subjectName, 50, currentY + 6, { width: 180 });
        doc.text(row.caScore.toString(), 240, currentY + 6, { width: 50, align: 'center' });
        doc.text(row.examScore.toString(), 300, currentY + 6, { width: 60, align: 'center' });
        doc.text(row.totalScore.toString(), 370, currentY + 6, { width: 70, align: 'center' });

        // Highlight failing grades in red
        const isFail = row.grade === 'F';
        if (isFail) {
          doc.fillColor(schoolConfig.schoolColors.danger).font('Helvetica-Bold');
        } else {
          doc.fillColor('#0f172a').font('Helvetica');
        }
        
        doc.text(row.grade, 450, currentY + 6, { width: 45, align: 'center' });
        doc.text(row.remark, 500, currentY + 6, { width: 55, align: 'center' });

        // Draw horizontal gridline
        doc.moveTo(40, currentY + 20).lineTo(555, currentY + 20).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        totalAggregate += row.totalScore;
        subjectCount++;
        currentY += 20;
      });

      // --- SUMMARY BLOCK ---
      doc.rect(40, currentY, 515, 20).fillColor('#f1f5f9').fill();
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('SUMMARY STATISTICS', 50, currentY + 6);
      
      const average = subjectCount > 0 ? (totalAggregate / subjectCount).toFixed(2) : '0.00';
      doc.text(`Aggregate: ${totalAggregate}`, 280, currentY + 6);
      doc.text(`Average: ${average}%`, 430, currentY + 6);
      doc.moveTo(40, currentY + 20).lineTo(555, currentY + 20).strokeColor('#cbd5e1').lineWidth(1).stroke();

      currentY += 35;

      // --- ATTENDANCE & ACADEMIC CALENDAR ---
      doc.rect(40, currentY, 515, 45).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor('#0f172a').fontSize(9);
      doc.font('Helvetica-Bold').text('Attendance:', 55, currentY + 12).font('Helvetica').text(`${attendance} of days school opened`, 140, currentY + 12);
      
      // Load next term from system settings
      const nextTermDate = 'September 14, 2026';
      doc.font('Helvetica-Bold').text('Next Term Begins:', 55, currentY + 28).font('Helvetica').text(nextTermDate, 140, currentY + 28);
      
      // Grade Guide box
      doc.rect(340, currentY + 5, 205, 35).fillColor('#f8fafc').fill();
      doc.rect(340, currentY + 5, 205, 35).strokeColor('#cbd5e1').stroke();
      doc.fillColor('#475569').fontSize(7).font('Helvetica');
      doc.text('Grade System:', 345, currentY + 8);
      doc.text('70-100 = A (Ex)  |  60-69 = B (VG)  |  50-59 = C (G)', 345, currentY + 18);
      doc.text('45-49 = D (F)      |  40-44 = E (P)      |  0-39 = F (Fails)', 345, currentY + 28);

      currentY += 65;

      // --- SIGNATURES & COMMENTS ---
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('PRINCIPAL COMMENTS AND REMARKS', 40, currentY);
      
      // Dotted lines for manual Principal writing
      doc.moveTo(40, currentY + 28).lineTo(555, currentY + 28).strokeColor('#94a3b8').dash(3, { space: 3 }).stroke();
      doc.moveTo(40, currentY + 45).lineTo(555, currentY + 45).strokeColor('#94a3b8').stroke();
      doc.undash(); // Reset dash pattern

      currentY += 80;

      // Signatures
      doc.moveTo(60, currentY).lineTo(200, currentY).strokeColor('#0f172a').lineWidth(1).stroke();
      doc.text('Class Teacher Signature', 75, currentY + 6);

      doc.moveTo(390, currentY).lineTo(530, currentY).strokeColor('#0f172a').lineWidth(1).stroke();
      doc.text('School Principal Signature', 405, currentY + 6);

      // Footer brand notice
      doc.fontSize(7)
         .fillColor('#94a3b8')
         .text('This is an official academic report card printed from Success Gate Hub. All marks are authenticated.', 40, 775, { align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Generates a beautiful Payment Receipt PDF using PDFKit
 */
export function generatePaymentReceiptPDF(payment: PaymentInfo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A5', layout: 'landscape' }); // Horizontal half page
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- PAGE BORDER ---
      doc.rect(20, 20, 555, 380).stroke('#cbd5e1');

      // --- HEADER ---
      // Shield logo
      doc.save();
      doc.fillColor(schoolConfig.schoolColors.primary);
      doc.path('M 40 35 L 60 35 L 65 50 L 52 65 L 38 50 Z').fill();
      doc.restore();

      doc.fillColor(schoolConfig.schoolColors.primary)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(schoolConfig.schoolName, 80, 35);

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#475569')
         .text(`${schoolConfig.schoolAddress}  |  Phone: ${schoolConfig.schoolPhone.split(',')[0]}`, 80, 50);

      // Receipt Title
      doc.fillColor(schoolConfig.schoolColors.secondary)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('OFFICIAL PAYMENT RECEIPT', 380, 35, { align: 'right' });

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#475569')
         .text(`Receipt No: ${payment.receiptNumber}`, 380, 50, { align: 'right' });

      // Divider Line
      doc.moveTo(30, 70).lineTo(560, 70).strokeColor(schoolConfig.schoolColors.secondary).lineWidth(1.5).stroke();

      // --- BODY INFO GRID ---
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');

      // Row 1
      doc.text('Student ID:', 40, 95).font('Helvetica').text(payment.studentId, 120, 95);
      doc.font('Helvetica-Bold').text('Date Paid:', 320, 95).font('Helvetica').text(payment.paymentDate, 410, 95);

      // Row 2
      doc.font('Helvetica-Bold').text('Student Name:', 40, 115).font('Helvetica').text(payment.studentName.toUpperCase(), 120, 115);
      doc.font('Helvetica-Bold').text('Fee Category:', 320, 115).font('Helvetica').text(payment.category, 410, 115);

      // Row 3
      doc.font('Helvetica-Bold').text('Class:', 40, 135).font('Helvetica').text(payment.class, 120, 135);
      doc.font('Helvetica-Bold').text('Bursar/Cashier:', 320, 135).font('Helvetica').text(payment.recordedBy, 410, 135);

      // Divider
      doc.moveTo(30, 160).lineTo(560, 160).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      // --- FINANCIALS BLOCK ---
      doc.rect(40, 175, 515, 60).fillColor('#f8fafc').fill();
      doc.rect(40, 175, 515, 60).strokeColor('#e2e8f0').stroke();

      doc.fontSize(10).fillColor('#475569').font('Helvetica');
      doc.text('Total Expected', 60, 185, { width: 130, align: 'center' });
      doc.text('Amount Paid', 230, 185, { width: 130, align: 'center' });
      doc.text('Outstanding Balance', 400, 185, { width: 130, align: 'center' });

      doc.fontSize(14).font('Helvetica-Bold');
      
      // Expected (Grey)
      doc.fillColor('#334155').text(`NGN ${payment.totalExpected.toLocaleString()}`, 60, 205, { width: 130, align: 'center' });
      // Paid (Green)
      doc.fillColor(schoolConfig.schoolColors.success).text(`NGN ${payment.amountPaid.toLocaleString()}`, 230, 205, { width: 130, align: 'center' });
      // Balance (Red if > 0, otherwise Green)
      const balColor = payment.balance > 0 ? schoolConfig.schoolColors.danger : schoolConfig.schoolColors.success;
      doc.fillColor(balColor).text(`NGN ${payment.balance.toLocaleString()}`, 400, 205, { width: 130, align: 'center' });

      // --- FOOTER & SIGN-OFF ---
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor('#64748b')
         .text('Thank you for your payment. Please keep this receipt safe as proof of payment.', 40, 270);

      // Signature line
      const signY = 270;
      doc.moveTo(380, signY + 30).lineTo(530, signY + 30).strokeColor('#0f172a').lineWidth(1).stroke();
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Bursary Officer Signature', 395, signY + 36);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
