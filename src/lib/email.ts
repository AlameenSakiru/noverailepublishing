import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.EMAIL_FROM || "Noveraile Publishing <orders@noverailepublishing.com>";

  // Provider 1: Resend HTTP API
  if (resendApiKey && resendApiKey.length > 0) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Resend API error:", data);
        return { success: false, error: data.message || "Failed to send email via Resend" };
      }

      console.log(`✅ [EMAIL SENT via Resend] To: ${to} (ID: ${data.id})`);
      return { success: true, id: data.id };
    } catch (err: any) {
      console.error("Resend send exception:", err);
      return { success: false, error: err.message || "Network error" };
    }
  }

  // Provider 2: Universal SMTP (Gmail, Brevo, SendGrid, Hostinger, cPanel)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const isSecure = process.env.SMTP_SECURE === "true" || port === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: fromEmail.includes("<") ? fromEmail : `"${process.env.NEXT_PUBLIC_SITE_NAME || 'Noveraile Publishing'}" <${smtpUser}>`,
        to,
        subject,
        html,
        text,
      });

      console.log(`✅ [EMAIL SENT via SMTP] To: ${to} (MessageId: ${info.messageId})`);
      return { success: true, id: info.messageId };
    } catch (smtpErr: any) {
      console.error("SMTP send error:", smtpErr);
      return { success: false, error: smtpErr.message || "SMTP error" };
    }
  }

  // Provider 3: Local / Development Dry Run Logger
  console.log("=================================================");
  console.log("📬 [EMAIL DISPATCH - LOCAL LOG]");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("=================================================");
  return { success: true, id: `local_${Date.now()}` };
}

export async function sendVerificationEmail(toEmail: string, recipientName: string, code: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Noveraile Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;">
              <div style="font-family: Georgia, serif; font-size: 20px; font-weight: 700; letter-spacing: 0.15em; color: #0f172a;">
                NOVERAILE
              </div>
              <div style="font-size: 9px; letter-spacing: 0.35em; color: #64748b; text-transform: uppercase; margin-top: 2px;">
                PUBLISHING
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding-top: 28px; padding-bottom: 24px;">
              <h2 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
                Verify Your Reader Email Address
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Hello <strong>${recipientName || "Reader"}</strong>,<br><br>
                Thank you for joining Noveraile Publishing. Please enter the 6-digit security verification code below to activate your personal cloud library:
              </p>

              <!-- 6-Digit Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #fdfaf6; border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #b45309; display: block; margin-bottom: 8px;">
                      Your Security Verification Code
                    </span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #0f172a; display: block;">
                      ${code}
                    </span>
                    <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 8px;">
                      Expires in 15 minutes • Single-Use
                    </span>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0;">
                For your security, never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              Noveraile Publishing Platform • Protected Cloud Library<br>
              If you did not create this account, you can safely disregard this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({
    to: toEmail,
    subject: `${code} is your Noveraile Publishing verification code`,
    html,
    text: `Your Noveraile Publishing verification code is: ${code}. It expires in 15 minutes.`,
  });
}
