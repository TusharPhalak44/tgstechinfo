# SendGrid Setup - Quick Guide (2 Minutes)

## Why SendGrid?
- ✅ No account suspensions
- ✅ No outbound restrictions
- ✅ 100 free emails/day
- ✅ Professional delivery

## Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Click "Sign Up Free"
3. Fill in your details
4. Email confirmation will be sent
5. Verify and log in

## Step 2: Get API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `TGS Tech Info`
4. Select **Full Access** (or just "Mail Send")
5. Click **Create & Copy**
6. Copy the key (it won't show again!)

## Step 3: Add to Your Project
Edit `backend/.env` and uncomment/add:
```env
SENDGRID_API_KEY=SG.your_actual_key_here_without_quotes
```

**Example:**
```env
SENDGRID_API_KEY=SG.abc123def456ghi789jkl012
```

## Step 4: Restart Backend
```bash
npm run dev
```

## Step 5: Test
Try sending an email (register, password reset, newsletter signup, etc.)

---

## Troubleshooting

### "Invalid API key" error
- ✅ Make sure you copied the ENTIRE key from SendGrid
- ✅ Don't include quotes
- ✅ Restart backend after adding key

### Emails still not sending
- ✅ Check backend logs for errors
- ✅ Verify API key is correct
- ✅ Check spam folder

### Want to switch back to Hostinger?
1. Contact Hostinger support to enable outbound SMTP
2. Remove `SENDGRID_API_KEY` from `.env`
3. System will automatically use Hostinger

---

## Free Tier Limits
- 100 emails/day
- No credit card required
- Paid plans available if you need more

## Support
- SendGrid Docs: https://docs.sendgrid.com/
- Help: help@sendgrid.com
