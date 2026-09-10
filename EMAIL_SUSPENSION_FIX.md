# Email Suspension Fix & SendGrid Integration

## Problem
Hostinger email account was suspended due to "suspicious activity" (rate limiting triggered by test emails).

## Solution Implemented

### 1. **Rate Limiting** ✅
Added email rate limiting to prevent spam-like behavior:
- Maximum **5 emails per recipient per hour**
- Prevents rapid email bombing that triggers Hostinger suspension
- Tracked in-memory (for production, use Redis)

### 2. **Dual Email Service Support** ✅
Your email system now supports:
- **Primary**: Hostinger SMTP (your current setup)
- **Backup**: SendGrid (recommended for reliability)

### 3. **Better Error Handling** ✅
Detects and logs:
- Email suspensions
- Rate limit violations
- SMTP failures
- Configuration issues

---

## How to Use

### Option A: Keep Using Hostinger (Current Setup)
1. Make sure the email account is reactivated in Hostinger
2. Your code will automatically use Hostinger SMTP
3. Rate limiting prevents future suspensions

**Test email sending:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test123!","first_name":"Test"}'
```

Wait **at least 1 hour** between sending emails to the same address to stay within rate limits.

---

### Option B: Use SendGrid (Recommended) 🚀

#### Step 1: Create Free SendGrid Account
1. Go to https://sendgrid.com
2. Sign up (free account gives 100 emails/day)
3. Go to **Settings** → **API Keys**
4. Create a new API key with "Mail Send" permission
5. Copy the API key

#### Step 2: Configure in `.env`
Edit `backend/.env` and uncomment:
```env
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

#### Step 3: Restart Backend
```bash
npm run dev
```

#### Step 4: Test
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test123!","first_name":"Test"}'
```

**Benefits:**
- ✅ No rate limiting (SendGrid handles it)
- ✅ Better deliverability
- ✅ Prevents Hostinger suspension
- ✅ Free tier available
- ✅ Professional email service

---

## Email Rate Limits

Current limits (can be adjusted in `email.js`):
| Recipient | Per Hour |
|-----------|----------|
| Any email | 5 emails |

To change: Edit `email.js` and modify `isRateLimited(to, 5)` → `isRateLimited(to, 10)`

---

## Troubleshooting

### "Email suspended" error
**Solution**: Reactivate in Hostinger hPanel, wait 5 minutes, try again

### "Too many emails" error
**Solution**: This is rate limiting. Wait 1 hour, or use SendGrid

### "No email service configured" error
**Solution**: Configure either:
- Hostinger: `EMAIL_USER` + `EMAIL_PASSWORD`
- SendGrid: `SENDGRID_API_KEY`

### Emails not arriving
1. Check spam folder
2. Verify sender reputation (use SendGrid)
3. Set up SPF/DKIM records (see Hostinger docs)

---

## Code Changes

### Files Modified:
1. **`backend/src/config/email.js`**
   - Added `getEmailTransporter()` - switches between SendGrid/Hostinger
   - Added `isRateLimited()` - rate limiting logic
   - Updated `sendEmail()` - uses new transporter

2. **`backend/.env`**
   - Added `SENDGRID_API_KEY` configuration option
   - Updated comments

### Backward Compatibility:
✅ Existing code works without changes  
✅ Falls back to Hostinger automatically  
✅ No database changes needed

---

## Next Steps

1. **Option A**: Test with current Hostinger setup (wait 1+ hour between tests)
2. **Option B**: Set up SendGrid for unlimited testing
3. Monitor email logs for any issues
4. If issues persist, contact Hostinger support

---

## Questions?

- **Hostinger help**: https://support.hostinger.com/en/articles/6667383-how-to-unblock-outbound-smtp-email-sending
- **SendGrid help**: https://docs.sendgrid.com/
- **Rate limiting**: Adjust in `backend/src/config/email.js`, line with `isRateLimited(to, 5)`
