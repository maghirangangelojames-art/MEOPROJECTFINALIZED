import { Resend } from "resend";
import { ENV } from "./env";

// v2 - Using Resend API for email sending (fixed cache issue)
// Create Resend client for sending emails
const createResendClient = () => {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured. Email sending is disabled.");
    return null;
  }

  return new Resend(ENV.resendApiKey);
};

const resend = createResendClient();

export type LoginNotificationData = {
  email: string;
  name: string;
  loginTime: Date;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Send a login notification email to the user
 */
export async function sendLoginNotification(data: LoginNotificationData): Promise<boolean> {
  console.log("[Email] sendLoginNotification called for:", data.email);
  
  if (!resend) {
    console.log("[Email] Skipping login notification - Resend not configured");
    return false;
  }
  
  console.log("[Email] Resend client is available, preparing email...");

  const formattedTime = data.loginTime.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "full",
    timeStyle: "long",
  });

  const emailOptions = {
    from: `Sariaya Building Permit System <${ENV.emailFrom}>`,
    to: data.email,
    subject: "New Login to Building Permit System",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🏛️ Sariaya Building Permit System</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Municipality of Sariaya - Engineering Office</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hello ${data.name || "User"}! 👋</h2>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      We noticed a new login to your account on the Sariaya Building Permit System.
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📋 Login Details:</h3>
                      <table style="width: 100%; font-size: 14px; color: #4b5563;">
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">📧 Email:</td>
                          <td style="padding: 8px 0;">${data.email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">🕐 Time:</td>
                          <td style="padding: 8px 0;">${formattedTime}</td>
                        </tr>
                        ${data.ipAddress ? `
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">🌐 IP Address:</td>
                          <td style="padding: 8px 0;">${data.ipAddress}</td>
                        </tr>
                        ` : ""}
                      </table>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                      <p style="color: #92400e; margin: 0; font-size: 14px;">
                        <strong>⚠️ Security Notice:</strong> If you did not perform this login, please contact our office immediately.
                      </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      Thank you for using the Sariaya Building Permit System!
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      This is an automated message from the Sariaya Building Permit System.<br>
                      Please do not reply to this email.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                      © ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Hello ${data.name || "User"}!

We noticed a new login to your account on the Sariaya Building Permit System.

Login Details:
- Email: ${data.email}
- Time: ${formattedTime}
${data.ipAddress ? `- IP Address: ${data.ipAddress}` : ""}

Security Notice: If you did not perform this login, please contact our office immediately.

Thank you for using the Sariaya Building Permit System!

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
    `,
  };

  try {
    const { error } = await resend.emails.send(emailOptions);
    if (error) {
      console.error("[Email] Failed to send login notification:", error);
      return false;
    }
    console.log(`[Email] Login notification sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send login notification:", error);
    return false;
  }
}

export type ApplicationApprovedNotificationData = {
  applicantEmail: string;
  applicantName: string;
  referenceNumber: string;
};

/**
 * Send application approval notification email
 */
export async function sendApplicationApprovedNotification(data: ApplicationApprovedNotificationData): Promise<boolean> {
  console.log("[Email] sendApplicationApprovedNotification called for:", data.applicantEmail);
  
  if (!resend) {
    console.log("[Email] Skipping approval notification - Resend not configured");
    return false;
  }

  const emailOptions = {
    from: `Sariaya Building Permit System <${ENV.emailFrom}>`,
    to: data.applicantEmail,
    subject: `✅ Your Building Permit Application (${data.referenceNumber}) Has Been Approved!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Application Approved!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Sariaya Building Permit System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hello ${data.applicantName}! 👋</h2>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Congratulations! Your building permit application has been <strong style="color: #10b981;">approved</strong> by the Engineering Office.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
                      <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 16px;">📋 Application Details:</h3>
                      <table style="width: 100%; font-size: 14px; color: #1f2937;">
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Reference Number:</td>
                          <td style="padding: 8px 0; font-family: monospace; color: #047857;">${data.referenceNumber}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Status:</td>
                          <td style="padding: 8px 0;"><strong style="color: #10b981;">✓ APPROVED</strong></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Approval Date:</td>
                          <td style="padding: 8px 0;">${new Date().toLocaleDateString("en-PH")}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                      You may now proceed with the next steps of your building project. For any questions, please contact the Engineering Office.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${ENV.appUrl || "https://permit.sariaya.gov.ph"}/track" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        View Your Application
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      Thank you for using the Sariaya Building Permit System!
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      This is an automated message from the Sariaya Building Permit System.<br>
                      Please do not reply to this email.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                      © ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Hello ${data.applicantName}!

Congratulations! Your building permit application has been approved by the Engineering Office.

Application Details:
- Reference Number: ${data.referenceNumber}
- Status: ✓ APPROVED
- Approval Date: ${new Date().toLocaleDateString("en-PH")}

You may now proceed with the next steps of your building project. For any questions, please contact the Engineering Office.

View your application: ${ENV.appUrl || "https://permit.sariaya.gov.ph"}/track

Thank you for using the Sariaya Building Permit System!

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
    `,
  };

  try {
    const { error } = await resend.emails.send(emailOptions);
    if (error) {
      console.error("[Email] Failed to send approval notification:", error);
      return false;
    }
    console.log(`[Email] Approval notification sent to ${data.applicantEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send approval notification:", error);
    return false;
  }
}

export type ApplicationResubmissionNotificationData = {
  applicantEmail: string;
  applicantName: string;
  referenceNumber: string;
  staffRemarks?: string;
};

/**
 * Send application resubmission request notification email
 */
export async function sendApplicationResubmissionNotification(data: ApplicationResubmissionNotificationData): Promise<boolean> {
  console.log("[Email] sendApplicationResubmissionNotification called for:", data.applicantEmail);
  
  if (!resend) {
    console.log("[Email] Skipping resubmission notification - Resend not configured");
    return false;
  }

  const emailOptions = {
    from: `Sariaya Building Permit System <${ENV.emailFrom}>`,
    to: data.applicantEmail,
    subject: `📝 Your Building Permit Application (${data.referenceNumber}) Requires Modifications`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">📝 Modifications Required</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Sariaya Building Permit System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hello ${data.applicantName},</h2>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Thank you for submitting your building permit application. The Engineering Office has reviewed your application and requires some modifications before it can be approved.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #fed7aa, #fecaca); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                      <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">📋 Application Details:</h3>
                      <table style="width: 100%; font-size: 14px; color: #1f2937;">
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Reference Number:</td>
                          <td style="padding: 8px 0; font-family: monospace; color: #d97706;">${data.referenceNumber}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Status:</td>
                          <td style="padding: 8px 0;"><strong style="color: #f59e0b;">⚠️ REQUIRES RESUBMISSION</strong></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Request Date:</td>
                          <td style="padding: 8px 0;">${new Date().toLocaleDateString("en-PH")}</td>
                        </tr>
                      </table>
                    </div>
                    
                    ${data.staffRemarks ? `
                    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Staff Remarks:</h3>
                      <p style="color: #1e3a8a; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.staffRemarks}</p>
                    </div>
                    ` : ""}
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                      Please log in to your account and review the detailed remarks for each document. Make the necessary corrections and resubmit your application.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${ENV.appUrl || "https://permit.sariaya.gov.ph"}/track" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Review Application & Resubmit
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      If you have any questions, please contact the Engineering Office.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      This is an automated message from the Sariaya Building Permit System.<br>
                      Please do not reply to this email.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                      © ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Hello ${data.applicantName},

Thank you for submitting your building permit application. The Engineering Office has reviewed your application and requires some modifications before it can be approved.

Application Details:
- Reference Number: ${data.referenceNumber}
- Status: ⚠️ REQUIRES RESUBMISSION
- Request Date: ${new Date().toLocaleDateString("en-PH")}

${data.staffRemarks ? `
Staff Remarks:
${data.staffRemarks}
` : ""}

Please log in to your account and review the detailed remarks for each document. Make the necessary corrections and resubmit your application.

Review Application & Resubmit: ${ENV.appUrl || "https://permit.sariaya.gov.ph"}/track

If you have any questions, please contact the Engineering Office.

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
    `,
  };

  try {
    const { error } = await resend.emails.send(emailOptions);
    if (error) {
      console.error("[Email] Failed to send resubmission notification:", error);
      return false;
    }
    console.log(`[Email] Resubmission notification sent to ${data.applicantEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send resubmission notification:", error);
    return false;
  }
}

export type ApplicationSubmissionNotificationToStaffData = {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  referenceNumber: string;
  propertyAddress: string;
  projectType: string;
  buildingClassification: string;
  barangay: string;
};

/**
 * Send application submission notification email to staff
 */
export async function sendApplicationSubmissionNotificationToStaff(data: ApplicationSubmissionNotificationToStaffData): Promise<boolean> {
  console.log("[Email] sendApplicationSubmissionNotificationToStaff called");
  
  if (!resend) {
    console.log("[Email] Skipping staff submission notification - Resend not configured");
    return false;
  }

  if (!ENV.staffEmails || ENV.staffEmails.length === 0) {
    console.warn("[Email] No staff emails configured. STAFF_EMAILS environment variable is not set.");
    return false;
  }

  const staffEmailRecipients = ENV.staffEmails.join(",");
  const submissionTime = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "full",
    timeStyle: "long",
  });

  const emailOptions = {
    from: `Sariaya Building Permit System <${ENV.emailFrom}>`,
    to: staffEmailRecipients,
    subject: `🆕 New Building Permit Application Submitted (${data.referenceNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🆕 New Application Submission</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Sariaya Building Permit System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">New Building Permit Application</h2>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      A new building permit application has been submitted and requires your review.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📋 Applicant Information:</h3>
                      <table style="width: 100%; font-size: 14px; color: #1f2937;">
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600; width: 150px;">Name:</td>
                          <td style="padding: 8px 0;">${data.applicantName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Email:</td>
                          <td style="padding: 8px 0;">${data.applicantEmail}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Phone:</td>
                          <td style="padding: 8px 0;">${data.applicantPhone}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">🏗️ Project Details:</h3>
                      <table style="width: 100%; font-size: 14px; color: #1f2937;">
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600; width: 150px;">Reference Number:</td>
                          <td style="padding: 8px 0; font-family: monospace; color: #3b82f6; font-weight: bold;">${data.referenceNumber}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Project Type:</td>
                          <td style="padding: 8px 0;">${data.projectType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Building Classification:</td>
                          <td style="padding: 8px 0;">${data.buildingClassification}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Barangay:</td>
                          <td style="padding: 8px 0;">${data.barangay}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Property Address:</td>
                          <td style="padding: 8px 0;">${data.propertyAddress}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Submission Time:</td>
                          <td style="padding: 8px 0;">${submissionTime}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${ENV.appUrl || "https://permit.sariaya.gov.ph"}/staff/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Review Application
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      Please log in to the Staff Dashboard to review and process this application.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      This is an automated message from the Sariaya Building Permit System.<br>
                      Please do not reply to this email.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                      © ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
New Building Permit Application

A new building permit application has been submitted and requires your review.

Applicant Information:
- Name: ${data.applicantName}
- Email: ${data.applicantEmail}
- Phone: ${data.applicantPhone}

Project Details:
- Reference Number: ${data.referenceNumber}
- Project Type: ${data.projectType}
- Building Classification: ${data.buildingClassification}
- Barangay: ${data.barangay}
- Property Address: ${data.propertyAddress}
- Submission Time: ${submissionTime}

Please log in to the Staff Dashboard to review and process this application.

Review Application: ${ENV.appUrl || "https://permit.sariaya.gov.ph"}/staff/dashboard

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
    `,
  };

  try {
    const { error } = await resend.emails.send(emailOptions);
    if (error) {
      console.error("[Email] Failed to send submission notification to staff:", error);
      return false;
    }
    console.log(`[Email] Submission notification sent to staff: ${staffEmailRecipients}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send submission notification to staff:", error);
    return false;
  }
}

export type ApplicationResubmissionNotificationToStaffData = {
  applicantName: string;
  applicantEmail: string;
  referenceNumber: string;
  filesResubmitted: number;
  barangay: string;
  projectType: string;
};

/**
 * Send application resubmission notification email to staff
 */
export async function sendApplicationResubmissionNotificationToStaff(data: ApplicationResubmissionNotificationToStaffData): Promise<boolean> {
  console.log("[Email] sendApplicationResubmissionNotificationToStaff called");
  
  if (!resend) {
    console.log("[Email] Skipping staff resubmission notification - Resend not configured");
    return false;
  }

  if (!ENV.staffEmails || ENV.staffEmails.length === 0) {
    console.warn("[Email] No staff emails configured. STAFF_EMAILS environment variable is not set.");
    return false;
  }

  const staffEmailRecipients = ENV.staffEmails.join(",");
  const resubmissionTime = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "full",
    timeStyle: "long",
  });

  const emailOptions = {
    from: `Sariaya Building Permit System <${ENV.emailFrom}>`,
    to: staffEmailRecipients,
    subject: `📝 Application Resubmitted With Changes (${data.referenceNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">📝 Application Resubmitted</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Sariaya Building Permit System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Application Resubmitted With Changes</h2>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      An applicant has resubmitted their application with updated files based on your requested modifications.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #fed7aa, #fecaca); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                      <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">📋 Application Details:</h3>
                      <table style="width: 100%; font-size: 14px; color: #1f2937;">
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600; width: 180px;">Applicant Name:</td>
                          <td style="padding: 8px 0;">${data.applicantName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Applicant Email:</td>
                          <td style="padding: 8px 0;">${data.applicantEmail}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Reference Number:</td>
                          <td style="padding: 8px 0; font-family: monospace; color: #d97706; font-weight: bold;">${data.referenceNumber}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Project Type:</td>
                          <td style="padding: 8px 0;">${data.projectType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Barangay:</td>
                          <td style="padding: 8px 0;">${data.barangay}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Files Resubmitted:</td>
                          <td style="padding: 8px 0;"><strong>${data.filesResubmitted}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-weight: 600;">Resubmission Date:</td>
                          <td style="padding: 8px 0;">${resubmissionTime}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${ENV.appUrl || "https://permit.sariaya.gov.ph"}/staff/dashboard" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Review Updated Application
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                      Please review the updated files and determine if the application can now be approved or if further modifications are needed.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      This is an automated message from the Sariaya Building Permit System.<br>
                      Please do not reply to this email.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                      © ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Application Resubmitted With Changes

An applicant has resubmitted their application with updated files based on your requested modifications.

Application Details:
- Applicant Name: ${data.applicantName}
- Applicant Email: ${data.applicantEmail}
- Reference Number: ${data.referenceNumber}
- Project Type: ${data.projectType}
- Barangay: ${data.barangay}
- Files Resubmitted: ${data.filesResubmitted}
- Resubmission Date: ${resubmissionTime}

Please review the updated files and determine if the application can now be approved or if further modifications are needed.

Review Updated Application: ${ENV.appUrl || "https://permit.sariaya.gov.ph"}/staff/dashboard

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Municipality of Sariaya Engineering Office
    `,
  };

  try {
    const { error } = await resend.emails.send(emailOptions);
    if (error) {
      console.error("[Email] Failed to send resubmission notification to staff:", error);
      return false;
    }
    console.log(`[Email] Resubmission notification sent to staff: ${staffEmailRecipients}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send resubmission notification to staff:", error);
    return false;
  }
}
