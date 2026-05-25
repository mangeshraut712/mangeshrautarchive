# Coinbase Commerce Crypto Payment Setup Guide

## Overview

This guide explains how to properly set up Coinbase Commerce to receive crypto payments in your portfolio.

---

## Step 1: Create Coinbase Commerce Account

1. Go to [commerce.coinbase.com](https://commerce.coinbase.com)
2. Click "Get Started" or "Sign Up"
3. Create an account with your email
4. Verify your email address
5. Complete the onboarding process

---

## Step 2: Set Up Your Store/Profile

1. Add your business name (e.g., "Mangesh Raut Portfolio")
2. Add a description
3. Upload a logo (your profile picture)
4. Set your preferred settlement currency (USD recommended)

---

## Step 3: Create a Checkout

### Option A: Simple Checkout (Recommended for Tips)

1. Go to "Checkouts" in the sidebar
2. Click "Create Checkout"
3. Fill in:
   - **Name**: "Support My Work"
   - **Description**: "Thank you for supporting my portfolio!"
   - **Amount**: Leave empty for custom amount (recommended)
   - **Currency**: USD
4. Click "Create"

### Option B: Product-based Checkout

1. Go to "Products"
2. Click "Add Product"
3. Create a "Support/Tip" product
4. Set price (or leave open)

---

## Step 4: Get Your Checkout ID

1. After creating checkout, click on it
2. Look for "Embed" or "Share" option
3. Copy the Checkout ID (looks like: `abc123def-456g-789h-012i-345jklmnopqr`)
4. This is what you put in your HTML:
   ```html
   https://commerce.coinbase.com/checkout/YOUR_CHECKOUT_ID
   ```

---

## Step 5: Configure Webhooks (For Notifications)

### Why Webhooks?

- Get notified when someone pays
- Auto-confirm payments
- Send thank you emails

### Setup:

1. In Coinbase Commerce dashboard → "Settings" → "Webhooks"
2. Click "Add an endpoint"
3. URL: `https://yourdomain.com/api/webhooks/coinbase`
4. Select events:
   - `charge:created`
   - `charge:confirmed`
   - `charge:failed`

### Backend Code (Node.js/Express Example):

```javascript
// webhook-handler.js
const crypto = require('crypto');
const express = require('express');
const router = express.Router();

// Your webhook secret from Coinbase Commerce
const WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

router.post('/webhooks/coinbase', express.raw({ type: 'application/json' }), (req, res) => {
  const payload = req.body;
  const signature = req.headers['x-cc-webhook-signature'];

  // Verify webhook signature
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  const computedSig = hmac.digest('hex');

  if (signature !== computedSig) {
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  switch (event.event.type) {
    case 'charge:confirmed':
      // Payment confirmed! Send thank you email
      console.log('Payment received:', event.data);
      // TODO: Save to database, send email, etc.
      break;

    case 'charge:created':
      console.log('Payment pending:', event.data);
      break;

    case 'charge:failed':
      console.log('Payment failed:', event.data);
      break;
  }

  res.status(200).send('OK');
});

module.exports = router;
```

---

## Step 6: Alternative - Simple API Charges

### Create Charge via API (for dynamic amounts):

```javascript
// crypto-payment.js
const axios = require('axios');

const COINBASE_API_KEY = process.env.COINBASE_API_KEY;

async function createCharge(amount, currency = 'USD') {
  try {
    const response = await axios.post(
      'https://api.commerce.coinbase.com/charges',
      {
        name: 'Support My Work',
        description: 'Thank you for supporting my portfolio!',
        pricing_type: 'fixed_price',
        local_price: {
          amount: amount,
          currency: currency,
        },
        metadata: {
          customer_name: 'Portfolio Visitor',
          customer_email: 'optional@email.com',
        },
      },
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.data.id,
      url: response.data.data.hosted_url,
      qr: response.data.data.qr_code,
    };
  } catch (error) {
    console.error('Error creating charge:', error);
    throw error;
  }
}

// Usage in your API route
app.post('/api/create-crypto-charge', async (req, res) => {
  const { amount } = req.body;

  try {
    const charge = await createCharge(amount);
    res.json({
      success: true,
      paymentUrl: charge.url,
      qrCode: charge.qr,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Step 7: Environment Variables

Create a `.env` file (never commit this!):

```bash
# Coinbase Commerce
COINBASE_API_KEY=your_api_key_here
COINBASE_WEBHOOK_SECRET=your_webhook_secret_here

# Your crypto wallet addresses (for direct copy-paste option)
BTC_ADDRESS=your_btc_address
ETH_ADDRESS=your_eth_address
USDC_ADDRESS=your_usdc_address
```

---

## Step 8: Update Frontend with Real Data

### Replace placeholder addresses:

```javascript
// In your HTML, replace:
// onclick="copyToClipboard('bc1q...your_btc_address')"

// With actual addresses from environment:
const CRYPTO_ADDRESSES = {
  btc: process.env.BTC_ADDRESS,
  eth: process.env.ETH_ADDRESS,
  usdc: process.env.USDC_ADDRESS,
};
```

Or if using static HTML, manually update:

```html
<button onclick="copyToClipboard('bc1qXXXXXXXXXXXXXXXXXXXX')"></button>
```

---

## Step 9: Testing

### Test Mode:

1. In Coinbase Commerce, use test API key
2. Payments go to testnet (not real money)
3. Test all flows before going live

### Live Testing:

1. Make a small $1 payment to yourself
2. Verify you receive the notification
3. Check your Coinbase Commerce dashboard

---

## Step 10: Security Best Practices

### ✅ DO:

- [ ] Store API keys in environment variables
- [ ] Use HTTPS for webhooks
- [ ] Verify webhook signatures
- [ ] Log all transactions
- [ ] Set up email notifications
- [ ] Use testnet for development

### ❌ DON'T:

- [ ] Hardcode API keys in frontend
- [ ] Commit .env files to git
- [ ] Expose webhook secrets
- [ ] Ignore failed payments

---

## Quick Start - Minimal Setup (No Backend)

If you just want to receive crypto without webhooks:

1. **Create Coinbase Commerce account**
2. **Create a checkout** (Step 3)
3. **Copy the checkout URL** (Step 4)
4. **Update your HTML:**
   ```html
   <a href="https://commerce.coinbase.com/checkout/YOUR_REAL_ID" target="_blank">
     Pay with Crypto
   </a>
   ```
5. **You'll receive email notifications for each payment**

That's it! Coinbase handles everything else.

---

## Architecture Diagram

```
┌─────────────────┐
│   Portfolio     │
│   (Frontend)    │
└────────┬────────┘
         │
         │ Click
         ▼
┌─────────────────┐
│ Coinbase        │
│ Commerce        │
│ (Hosted Page)   │
└────────┬────────┘
         │
         │ Payment
         ▼
┌─────────────────┐
│ Your Crypto     │
│ Wallet          │
└─────────────────┘
         │
         │ Webhook (optional)
         ▼
┌─────────────────┐
│ Your Backend    │
│ (Notifications) │
└─────────────────┘
```

---

## Need Help?

- **Coinbase Commerce Docs**: [docs.cloud.coinbase.com/commerce](https://docs.cloud.coinbase.com/commerce)
- **API Reference**: [docs.cloud.coinbase.com/commerce/reference](https://docs.cloud.coinbase.com/commerce/reference)
- **Support**: commerce.coinbase.com/support

---

## Next Steps for You

1. ✅ Create Coinbase Commerce account (5 mins)
2. ✅ Get your Checkout ID (2 mins)
3. ✅ Update HTML with real ID (1 min)
4. ⬜ Set up webhook endpoint (optional, 30 mins)
5. ⬜ Test with small amount (10 mins)

**Total time: ~1 hour to fully functional crypto payments!**
