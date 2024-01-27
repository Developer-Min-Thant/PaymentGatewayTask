require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const upload = multer();
const app = express();
const db = require('./dbService');
const paymentService = require('./paymentService'); 

db.connect();
app.use(express.static('public'));

// Root route to serve the payment form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/payment-form.html'));
});

app.post('/submit-payment', upload.none(), async (req, res) => {
    const { cardNumber, amount, expirationMonth, expirationYear, cvv, fullName, cardName, currency } = req.body;

     // Check if the card is AMEX and the currency is not USD
     if (paymentService.isAmex(cardNumber) && currency !== 'USD') {
        return res.status(400).json({ message: 'AMEX is only supported with USD' });
    }
    
    try {
        let result;
        let isPayPal = false;
        
        if (shouldProcessWithPayPal(cardNumber, currency)) {
            // Process payment with PayPal
            result = await paymentService.processWithPayPal(amount, currency);
            isPayPal = true;
        } else {
            // Process payment with Braintree
            result = await paymentService.processWithBraintree(cardNumber, amount, expirationMonth, expirationYear, cvv);
            // Braintree return it own result object that handle here
            if(!result.transaction) {
                throw new Error(result.message);
            }
            result = result.transaction;
        }

        // Insert into database
        const transactionData = {
            amount,
            currency,
            fullName,
            transactionId: isPayPal ? result.id : result.id,
            paymentMethod: isPayPal ? 'PayPal' : 'Braintree',
            status: result.status
        };
        await db.client.db('sale').collection('transactions').insertOne(transactionData);
        res.json({ success: true, result, isPayPal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const shouldProcessWithPayPal = (cardNumber, currency) => {
    if (paymentService.isAmex(cardNumber) || ['USD', 'EUR', 'AUD'].includes(currency)) {
        return true; // Paypal
    } else {
        return false; // Braintree
    }
};

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
