// paymentService.js
const braintree = require('braintree');
const paypal = require('@paypal/checkout-server-sdk');

// PayPal Client
function paypalClient() {
    return new paypal.core.PayPalHttpClient(
        new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    );
}

// Braintree Gateway
function braintreeGateway() {
    return new braintree.BraintreeGateway({
        environment: braintree.Environment.Sandbox,
        merchantId: process.env.BRAINTREE_MERCHANT_ID,
        publicKey: process.env.BRAINTREE_PUBLIC_KEY,
        privateKey: process.env.BRAINTREE_PRIVATE_KEY
    });
}

const isAmex = (cardNumber) => { 
    const firstTwoDigits = cardNumber.substring(0, 2);
    return firstTwoDigits === '34' || firstTwoDigits === '37';
};

const processWithPayPal = async (amount, currency) => { 
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: currency, // Currency
                value: amount // Amount to be charged
            }
        }]
    });
    
    const response = await paypalClient().execute(request);
    return response.result;
};

const processWithBraintree = async (cardNumber, amount, expMonth, expYear, cvv) => { 
     // Create a transaction with Braintree using the card number
     const saleRequest = {
        amount: amount,
        creditCard: {
            number: cardNumber,
            expirationMonth: expMonth,
            expirationYear: expYear,
            cvv: cvv
        },
        options: {
            submitForSettlement: true
        }
    };

    const result = await braintreeGateway().transaction.sale(saleRequest);
    return result;
};

module.exports = {
    isAmex,
    processWithPayPal,
    processWithBraintree
};
