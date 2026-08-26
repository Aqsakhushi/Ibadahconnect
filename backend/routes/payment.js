const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// JazzCash Sandbox Credentials (Testing ke liye)
const JC_MERCHANT_ID = "MC12345"; // Yahan apni Sandbox ID aayegi
const JC_PASSWORD = "12345678"; // Yahan apna Sandbox Password aayega
const JC_INTEGRITY_SALT = "1234567890"; // Yahan apna Salt aayega
const JC_RETURN_URL = "http://localhost:5173/payment-response"; // Frontend URL jahan wapas aayenge

// Route: Payment Request Generate karna
router.post('/request', async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        const txnDate = new Date();
        const formatDate = (date) => {
            const yy = date.getFullYear().toString().slice(-2);
            const mm = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            const hh = date.getHours().toString().padStart(2, '0');
            const min = date.getMinutes().toString().padStart(2, '0');
            const ss = date.getSeconds().toString().padStart(2, '0');
            return `${yy}${mm}${dd}${hh}${min}${ss}`;
        };

        const pp_Amount = (Number(amount) * 100).toString(); // JazzCash amount in paisa
        const pp_BillReference = "billRef" + orderId;
        const pp_Description = "IbadahConnect Service Booking";
        const pp_TxnCurrency = "PKR";
        const pp_TxnDateTime = formatDate(txnDate);
        const pp_TxnExpiryDateTime = formatDate(new Date(txnDate.getTime() + (60 * 60 * 1000))); // 1 hour expiry
        const pp_TxnRefNo = "T" + Date.now();
        const pp_Version = "1.1";
        const pp_TxnType = "MWALLET"; // Ya CARD/CARDLESS

        // Post Data Object
        let postData = {
            pp_Version,
            pp_TxnType,
            pp_Language: "EN",
            pp_MerchantID: JC_MERCHANT_ID,
            pp_Password: JC_PASSWORD,
            pp_TxnRefNo,
            pp_Amount,
            pp_TxnCurrency,
            pp_TxnDateTime,
            pp_TxnExpiryDateTime,
            pp_BillReference,
            pp_Description,
            pp_ReturnURL: JC_RETURN_URL,
            pp_MerchantName: "IbadahConnect",
            pp_CNIC: "0000000000000",
            pp_MobileNumber: "03331234567",
            pp_Email: "test@ibadah.com"
        };

        // Secure Hash Generate karna (Alphabetical order mein)
        let sortedKeys = Object.keys(postData).sort();
        let hashString = JC_INTEGRITY_SALT + '&';
        sortedKeys.forEach(key => {
            if (postData[key] !== '') {
                hashString += postData[key] + '&';
            }
        });
        hashString = hashString.slice(0, -1); // Last '&' remove karna

        const pp_SecureHash = crypto.createHmac('sha256', JC_INTEGRITY_SALT).update(hashString).digest('hex').toUpperCase();
        postData.pp_SecureHash = pp_SecureHash;

        res.status(200).json({
            message: "Payment request generated",
            checkoutUrl: "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanager/merchantview/",
            postData: postData
        });

    } catch (error) {
        console.error("Payment Request Error:", error);
        res.status(500).json({ message: "Error generating payment request" });
    }
});

module.exports = router;