# Email Notifications System - Complete Setup

## ✅ Implementation Summary

Your building permit system now has **comprehensive email notifications** for all critical events. Here's what's been set up:

### Email Notifications Implemented

#### 1. **🔐 Login Notifications**
- **When**: Every time a user logs in (via Gmail OAuth or local dev login)
- **Who Receives**: The user's email
- **What Includes**:
  - Login time and date (in Manila timezone)
  - IP address (for security)
  - User agent information
  - Security notice if login wasn't them

**Locations Wired**:
- `server/_core/oauth.ts` - Google OAuth callback
- `server/_core/oauth.ts` - Local login route
- `server/_core/oauth.ts` - Generic OAuth callback

---

#### 2. **📋 Application Submission Confirmation**
- **When**: Immediately when an applicant submits their building permit application
- **Who Receives**: The applicant (at their registered email)
- **What Includes**:
  - Reference number (for tracking)
  - Project type and property location
  - Submission date
  - "What's Next" guidance
  - Link to track application status

**Location Wired**:
- `server/routers.ts` - `create` endpoint (application submission)

---

#### 3. **✅ Application Approved Notification**
- **When**: Staff approves the application
- **Who Receives**: The applicant
- **What Includes**:
  - Approval confirmation
  - Reference number
  - Next steps for permit pickup/collection

**Location Wired**:
- `server/routers.ts` - `updateStatus` endpoint (when status = "approved")

---

#### 4. **📝 Resubmission Request Notification**
- **When**: Staff marks application as "requires modifications"
- **Who Receives**: The applicant
- **What Includes**:
  - Which documents need changes
  - Staff remarks/comments explaining what's needed
  - Link to resubmit application
  - Instructions on how to proceed

**Location Wired**:
- `server/routers.ts` - `updateStatus` endpoint (when status = "for_resubmission")

---

#### 5. **⏸️ On-Hold Notification**
- **When**: Staff places application on hold for any reason
- **Who Receives**: The applicant
- **What Includes**:
  - Reason for hold (if staff provided remarks)
  - Status explanation
  - Assurance application will be resumed
  - Link to view application details

**Location Wired**:
- `server/routers.ts` - `updateStatus` endpoint (when status = "on_hold")

---

#### 6. **📬 Staff Submission Notifications**
- **When**: New application submitted or applicant resubmits files
- **Who Receives**: All staff members (via ENV.staffEmails)
- **What Includes**:
  - Applicant details
  - Reference number
  - Property address and project type
  - Number of files submitted
  - Action required

**Locations Wired**:
- `server/routers.ts` - `create` endpoint (new submission to staff)
- `server/routers.ts` - `resubmitApplication` endpoint (resubmission to staff)

---

### Database Tracking

All email notifications are **logged in the database** with:
- ✅ Recipient email
- ✅ Notification type
- ✅ Subject line
- ✅ Message body
- ✅ Delivery status (sent/failed)
- ✅ Timestamp
- ✅ Application reference

This enables:
- Audit trails for compliance
- Resend capabilities for failed emails
- Performance analysis
- User communication history

**New Function Added**:
- `logNotification()` in `server/db.ts`

---

### Email Service Configuration

The system uses **Resend API** for reliable email delivery:

**Required Environment Variables**:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com  # Verified sender email
APP_URL=https://permit.sariaya.gov.ph  # For email links
ADMIN_EMAILS=admin1@sariaya.gov.ph,admin2@sariaya.gov.ph
STAFF_EMAILS=staff1@sariaya.gov.ph,staff2@sariaya.gov.ph
```

**Note**: If `RESEND_API_KEY` is not configured, all notifications are gracefully skipped (emails won't be sent but the system continues to work).

---

### Email Templates

All emails feature:
- ✨ **Professional branded design** with Sariaya municipality branding
- 📱 **Fully responsive** for mobile/desktop
- 🎨 **Color-coded** by notification type:
  - 🔵 Blue: Login (blue gradient)
  - 🟢 Green: Approval (green gradient)
  - 🟠 Orange: Resubmission (orange/amber gradient)
  - 🟣 Indigo: On-Hold (indigo gradient)
- 📋 **Detailed information** with action links
- 🔐 **Security notices** where appropriate

---

### Notification Delivery Chain

1. **Event Occurs** (login, status change, submission)
2. **Email Generated** from template
3. **Resend API Called** to send email
4. **Database Logged** with delivery status
5. **No Email Failure** blocks the main action (graceful degradation)

---

### Key Features

✅ **Graceful Error Handling**
- If Resend isn't configured, notifications skip silently
- If email fails to send, the main action still succeeds
- Errors are logged for debugging

✅ **Timezone Support**
- Login notifications use Manila timezone
- All timestamps are consistent

✅ **Security Focused**
- Login emails include IP and user agent
- Reference numbers for tracking
- Staff remarks included where appropriate

✅ **User-Friendly**
- Clear action links in every email
- "What's Next" guidance
- Professional tone and design

---

### Testing Notifications

To test in **development**:

1. **Local Login with Email**:
   ```
   http://localhost:5173/api/auth/local-login?name=Test&email=your-email@gmail.com&role=user
   ```

2. **Gmail OAuth**:
   - Use the normal Google login flow

3. **Submit Application**:
   - Fill out and submit an application form

4. **Change Status**:
   - Staff can approve, request resubmission, or hold applications

5. **Check Emails**:
   - Verify in Gmail inbox (check spam folder)
   - Review database `notifications` table for logs

---

### What's Been Modified

**Files Changed**:
- ✏️ `server/_core/email.ts` - Added 2 new email functions
- ✏️ `server/_core/oauth.ts` - Wired login notifications
- ✏️ `server/routers.ts` - Wired all application notifications
- ✏️ `server/db.ts` - Added notification logging function

**No Database Migrations Needed** - notification table already exists

---

## Next Steps

### Optional Enhancements
1. **SMS Notifications** - Add Twilio integration for urgent updates
2. **Notification Preferences** - Let users choose which emails they receive
3. **Scheduled Reminders** - Auto-send reminders for pending applications
4. **Email Templates in CMS** - Allow staff to customize email content
5. **Notification Dashboard** - Admin view of all sent notifications
6. **Resend Status Webhook** - Track bounces and delivery issues

### Monitoring
- Check server logs for `[Email]` messages
- Review `notifications` table for delivery status
- Monitor Resend dashboard for sender reputation

---

## Summary

Your applicants will now receive **immediate confirmation** when they submit, **timely updates** on their application status, and **clear communication** from staff. Staff members receive **notifications of new submissions** and **resubmissions** to stay on top of their workload.

All notifications are **professional, branded, and fully tracked** in the database for compliance and support purposes.

🎉 **Email notifications are now fully operational!**
