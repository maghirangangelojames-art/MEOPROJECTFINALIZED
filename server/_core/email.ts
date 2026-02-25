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
