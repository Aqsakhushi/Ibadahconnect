const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/* ══════════════════════════════════════════════════════════════
   AUTO CERTIFICATE GENERATOR (Feature #4)
   Order "Completed" hote hi khud-ba-khud ek PDF certificate
   generate hota hai jisme sponsor, recipient, performer, service
   type aur completion date likhi hoti hai. File backend/uploads/
   certificates/ mein save hoti hai aur /uploads/... se serve hoti
   hai (server.js mein already static route mojood hai).
   ══════════════════════════════════════════════════════════════ */

const CERT_DIR = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

/**
 * @param {Object} order    Order document (populated performer + sponsor not required, plain fields ok)
 * @param {Object} sponsor  { firstName, lastName } — jis ne booking ki
 * @param {Object} performer { firstName, lastName } — jis ne ibadah perform ki
 * @returns {Promise<string>} public URL of generated PDF, e.g. /uploads/certificates/IC-2026-000123.pdf
 */
async function generateCertificate(order, sponsor = {}, performer = {}) {
  const fileName = `${order.orderCode || order._id}.pdf`;
  const filePath = path.join(CERT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const W = doc.page.width;
  const H = doc.page.height;

  // Background
  doc.rect(0, 0, W, H).fill('#FAF7F0');
  // Outer decorative border
  doc.lineWidth(3).strokeColor('#1B5E20').rect(24, 24, W - 48, H - 48).stroke();
  doc.lineWidth(1).strokeColor('#D4AF37').rect(34, 34, W - 68, H - 68).stroke();

  doc.fillColor('#1B5E20');
  doc.fontSize(12).font('Helvetica').text('IBADAH CONNECT', 0, 60, { align: 'center', characterSpacing: 3 });

  doc.fontSize(34).font('Helvetica-Bold').fillColor('#1B5E20')
    .text('Certificate of Completion', 0, 90, { align: 'center' });

  doc.moveTo(W / 2 - 90, 140).lineTo(W / 2 + 90, 140).strokeColor('#D4AF37').lineWidth(2).stroke();

  const serviceType = order.serviceType || 'Umrah Badal';
  const recipientName = order.recipientName || 'the beneficiary';
  const performerName = `${performer.firstName || ''} ${performer.lastName || ''}`.trim() || 'our verified performer';
  const sponsorName = `${sponsor.firstName || ''} ${sponsor.lastName || ''}`.trim() || 'Sponsor';
  const dateStr = new Date(order.completedAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  doc.fontSize(13).font('Helvetica').fillColor('#333333')
    .text('This is to certify that', 0, 175, { align: 'center' });

  doc.fontSize(24).font('Helvetica-Bold').fillColor('#1B5E20')
    .text(performerName, 0, 200, { align: 'center' });

  doc.fontSize(13).font('Helvetica').fillColor('#333333')
    .text(`has successfully performed ${serviceType} on behalf of`, 0, 240, { align: 'center' });

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1B5E20')
    .text(recipientName, 0, 262, { align: 'center' });

  doc.fontSize(12).font('Helvetica').fillColor('#555555')
    .text(`Booked by ${sponsorName}  •  Order ID: ${order.orderCode || order._id}`, 0, 300, { align: 'center' });

  doc.fontSize(11).fillColor('#777777')
    .text(`Completed with full Shariah compliance, verified with photo/video proof, on ${dateStr}.`, 90, 330, {
      align: 'center', width: W - 180,
    });

  // Footer signatures
  doc.fontSize(10).fillColor('#333333');
  doc.text('_____________________', 100, H - 110);
  doc.text('IbadahConnect', 100, H - 92);
  doc.text('Verified Platform', 100, H - 78);

  doc.text('_____________________', W - 260, H - 110);
  doc.text(dateStr, W - 260, H - 92);
  doc.text('Date of Completion', W - 260, H - 78);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return `/uploads/certificates/${fileName}`;
}

module.exports = generateCertificate;