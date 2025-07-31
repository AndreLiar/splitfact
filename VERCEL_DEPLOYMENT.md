# Vercel Deployment Guide

## 🚀 Automatic URSSAF Report Generation

Your Splitfact app includes automatic URSSAF report generation using Vercel Cron Jobs. This runs monthly on the 1st of each month at 9 AM UTC.

### 📋 Setup Requirements

#### 1. **Vercel Configuration** 
✅ Already configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-urssaf-reports",
      "schedule": "0 9 1 * *"
    }
  ]
}
```

#### 2. **Environment Variables**
✅ Already configured in your `.env` file. **You MUST add these to Vercel:**

**Required for Cron Jobs:**
- `CRON_SECRET` = `8d0dbc919ad85315d947ddeec51901d12527dde605c9c4af617d01a5a7c8d938`

**Database & Auth:**
- `DATABASE_URL` = Your Neon PostgreSQL URL
- `NEXTAUTH_SECRET` = Your auth secret
- `NEXTAUTH_URL` = `https://your-app.vercel.app` (update in production)

**Stripe:**
- `STRIPE_SECRET_KEY` = Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` = Your Stripe webhook secret

**Email:**
- `RESEND_API_KEY` = Your Resend API key
- `EMAIL_FROM` = `kanmegneandre@gmail.com`

**AI (Optional):**
- `GEMINI_API_KEY` = Your Google Gemini API key
- `AI_MODE` = `gemini` (for production)

#### 3. **Deployment Steps**

1. **Push to GitHub** with `vercel.json` file
2. **Connect to Vercel** 
3. **Add Environment Variables** in Vercel Dashboard
4. **Deploy**

### 🔄 How It Works

1. **Monthly Trigger**: Runs on 1st of each month at 9 AM UTC
2. **User Filter**: Only processes users with:
   - `declarationFrequency` set to `monthly` or `quarterly`
   - `fiscalRegime` = `MicroBIC` or `BNC` 
   - `microEntrepreneurType` filled
3. **Report Generation**: Creates URSSAF reports for appropriate periods
4. **Notifications**: Sends in-app notifications to users

### 📅 Schedule Details

- **Monthly Users**: Get reports for previous month (e.g., July report on August 1st)
- **Quarterly Users**: Get reports for previous quarter (e.g., Q2 report on July 1st)

### 🔧 Testing

Test the cron endpoint manually:
```bash
curl -X GET "https://your-app.vercel.app/api/cron/generate-urssaf-reports" \
     -H "Authorization: Bearer 8d0dbc919ad85315d947ddeec51901d12527dde605c9c4af617d01a5a7c8d938"
```

### 📊 Monitoring

- Check Vercel Function logs for cron execution
- Monitor user notifications in `/dashboard/notifications`
- View generated reports in `/dashboard/reports`

### ⚠️ Important Notes

- **Free Plan Limits**: 100GB-hrs/month function execution
- **Timeout**: Cron function has 60-second timeout (configured)
- **Security**: Cron endpoint requires `CRON_SECRET` for access
- **Timezone**: All schedules are in UTC

## 🎯 Next Steps After Deployment

1. ✅ Test cron endpoint manually
2. ✅ Verify users can set `declarationFrequency` in profile
3. ✅ Check first automatic report generation on next month
4. ✅ Monitor function execution in Vercel dashboard