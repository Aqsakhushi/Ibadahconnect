const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createWorker } = require('tesseract.js');
const path = require('path');
const fs = require('fs');

// ============================================================
// OCR PROOF VERIFICATION (Meeting Requirement #1)
// Performer jo proof image (receipt/photo) upload karta hai,
// AI usay scan karke text nikalta hai (Tesseract.js OCR) aur
// keywords match karta hai: service type + receipt words + amount.
// Result: 'verified' | 'weak-match' | 'manual-review'
// ============================================================

// ---- JWT check (har logged-in role allow: performer/admin/sponsor) ----
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Login required — token nahi mila.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ibadahsecret');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid ya expire ho gaya.' });
  }
}

// ---- Tesseract worker (singleton — baar baar banane se bacho) ----
let workerPromise = null;
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      cachePath: path.join(__dirname, '..', '.tessdata'), // lang data yahan cache hota hai
      logger: () => {} // console spam band
    });
  }
  return workerPromise;
}

// ---- Image nikalna: data URI ya http(s) URL ----
async function fetchImage(proofUrl) {
  // 1) data URI (frontend agar file base64 bheje)
  if (proofUrl.startsWith('data:image')) {
    const b64 = proofUrl.split('base64,')[1];
    if (!b64) throw new Error('Data URI invalid hai.');
    return { buffer: Buffer.from(b64, 'base64'), type: 'data-uri' };
  }
    // 0) Local upload (relative /uploads/ URL) — seedha disk se parho (fast + reliable)
  if (proofUrl.startsWith('/uploads/')) {
    const safePath = path.normalize(proofUrl).replace(/^([.]{2}[/\\])+/, ''); // path traversal block
    const filePath = path.join(__dirname, '..', safePath);
    if (!fs.existsSync(filePath)) throw new Error('Uploaded file server par nahi mili.');
    return { buffer: fs.readFileSync(filePath), type: 'local-file' };
  }

  // 2) http(s) image URL
  const res = await axios.get(proofUrl, {
    responseType: 'arraybuffer',
    timeout: 15000,
    maxContentLength: 8 * 1024 * 1024 // 8MB cap
  });
  const type = (res.headers['content-type'] || '').toLowerCase();
  if (!type.startsWith('image/')) {
    const err = new Error(`Image nahi mili (content-type: ${type || 'unknown'})`);
    err.notImage = true;
    throw err;
  }
  return { buffer: Buffer.from(res.data), type };
}

// ---- Keyword matching engine ----
const SERVICE_KEYWORDS = {
  'Umrah Badal': ['umrah', 'omra', 'umra'],
  'Hajj Badal': ['hajj', 'haj', 'badal'],
  'Donation': ['donation', 'donat', 'sadqa', 'zakat', 'khairat', 'charity']
};
const RECEIPT_KEYWORDS = [
  'receipt', 'paid', 'payment', 'transfer', 'amount', 'pkr', 'rupees',
  'bank', 'jazzcash', 'easypaisa', 'hbl', 'ubl', 'mcb', 'alfalah',
  'meezan', 'transaction', 'trx', 'ref', 'deposited', 'success'
];

function analyzeText(rawText, serviceType, amount) {
  const text = (rawText || '').toLowerCase().replace(/\s+/g, ' ');
  const matched = [];
  let score = 0;

  // 1) Service type keywords (strong signal — x2)
  const svcWords = SERVICE_KEYWORDS[serviceType] || [];
  for (const w of svcWords) {
    if (text.includes(w)) {
      matched.push(w);
      score += 2;
      break; // ek kafi hai
    }
  }

  // 2) Receipt/bank keywords (har match +1, max 5)
  let receiptHits = 0;
  for (const w of RECEIPT_KEYWORDS) {
    if (receiptHits >= 5) break;
    if (text.includes(w)) {
      matched.push(w);
      score += 1;
      receiptHits++;
    }
  }

  // 3) Amount match (strong signal +3) — sirf agar amount diya ho
  if (amount && Number(amount) > 0) {
    const amountStr = String(Math.round(Number(amount)));
    if (text.includes(amountStr)) {
      matched.push(`amount ${amountStr}`);
      score += 3;
    }
  }

  // Suggestion: score 4+ = verified, 1-3 = weak, 0 = manual
  let suggestion = 'manual-review';
  if (score >= 4) suggestion = 'verified';
  else if (score >= 1) suggestion = 'weak-match';

  return { matched, score, suggestion };
}

// ---- ROUTE: POST /api/proof/ocr-check ----
router.post('/ocr-check', requireAuth, async (req, res) => {
  const { proofUrl, serviceType, amount } = req.body || {};
  if (!proofUrl || typeof proofUrl !== 'string') {
    return res.status(400).json({ message: 'proofUrl zaroori hai.' });
  }
  const url = proofUrl.trim();

  try {
    // Video/page links — OCR sirf images par chalta hai
    const isImageExt = /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url);
    const isDataUri = url.startsWith('data:image');
    const isVideoLink = /youtube|youtu\.be|vimeo|dailymotion|facebook\.com|tiktok/i.test(url);

    if (!isImageExt && !isDataUri) {
      return res.json({
        success: true,
        skippable: true,
        message: isVideoLink
          ? 'Video link par OCR nahi chalta — AI check skip hua (Admin manually dekhega).'
          : 'Yeh link direct image nahi lagta (Drive page/PDF?) — OCR skip hua.',
        ocr: { suggestion: 'manual-review', matched: [], score: 0, confidence: 0, text: '', checkedAt: new Date() }
      });
    }

    // Image fetch karo
    let image;
    try {
      image = await fetchImage(url);
    } catch (fetchErr) {
      if (fetchErr.notImage) {
        return res.json({
          success: true,
          skippable: true,
          message: 'Link se image download nahi hui (Drive preview page?) — direct image link use karein.',
          ocr: { suggestion: 'manual-review', matched: [], score: 0, confidence: 0, text: '', checkedAt: new Date() }
        });
      }
      return res.status(400).json({ message: 'Image fetch nahi ho saki: ' + fetchErr.message });
    }

    // OCR chalao (30s guard)
    const worker = await getWorker();
    const result = await Promise.race([
      worker.recognize(image.buffer),
      new Promise((_, rej) => setTimeout(() => rej(new Error('OCR timeout (30s)')), 30000))
    ]);
    const data = result.data;

    // Keywords match karo
    const { matched, score, suggestion } = analyzeText(data.text, serviceType, amount);

    const ocr = {
      text: (data.text || '').trim().slice(0, 1000), // DB bharne se bacho
      confidence: Math.round((data.confidence || 0) * 10) / 10,
      matched,
      score,
      suggestion,
      checkedAt: new Date()
    };

    const msgMap = {
      'verified': `AI Verification: Receipt verified ✓ (score ${score})`,
      'weak-match': `AI Verification: Weak match (score ${score}) — Admin review hoga.`,
      'manual-review': 'AI Verification: Koi receipt keyword nahi mila — Admin review karega.'
    };

    res.json({ success: true, skippable: false, ocr, message: msgMap[suggestion] });

  } catch (error) {
    console.error('OCR ERROR:', error.message);
    res.status(500).json({ message: 'OCR check fail hua: ' + error.message });
  }
});

module.exports = router;