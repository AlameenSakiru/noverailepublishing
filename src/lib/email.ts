import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import prisma from "./prisma";
import { getSettingValue } from "./settings";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    cid?: string;
    contentType?: string;
  }>;
}

function getEnvSetting(key: string, defaultValue: string = ""): string {
  if (process.env[key] && process.env[key]!.trim() !== "") {
    return process.env[key]!.trim();
  }
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const regex = new RegExp(`^${key}=["']?([^"'\\r\\n]+)["']?`, "m");
      const match = content.match(regex);
      if (match && match[1]) {
        const val = match[1].trim();
        process.env[key] = val;
        return val;
      }
    }
  } catch (e) {
    // Read fallback silent
  }
  return defaultValue;
}

export async function getResolvedTransporter() {
  let smtpUser = "";
  let smtpPass = "";
  let smtpHost = "";
  let smtpPort = 465;
  let fromAddress = "";

  try {
    smtpUser = await getSettingValue("SMTP_USER", getEnvSetting("SMTP_USER", "noverailepublishing@gmail.com"));
    smtpPass = (await getSettingValue("SMTP_PASS", getEnvSetting("SMTP_PASS", "mgmjwrldkpfnyagg"))).replace(/\s+/g, "");
    smtpHost = await getSettingValue("SMTP_HOST", getEnvSetting("SMTP_HOST", "smtp.gmail.com"));
    smtpPort = Number(await getSettingValue("SMTP_PORT", getEnvSetting("SMTP_PORT", "465"))) || 465;
    fromAddress = await getSettingValue("EMAIL_FROM", getEnvSetting("EMAIL_FROM", `"Noveraile Publishing" <${smtpUser}>`));
  } catch {
    smtpUser = getEnvSetting("SMTP_USER", "noverailepublishing@gmail.com");
    smtpPass = getEnvSetting("SMTP_PASS", "mgmjwrldkpfnyagg").replace(/\s+/g, "");
    smtpHost = getEnvSetting("SMTP_HOST", "smtp.gmail.com");
    smtpPort = Number(getEnvSetting("SMTP_PORT", "465")) || 465;
    fromAddress = getEnvSetting("EMAIL_FROM", `"Noveraile Publishing" <${smtpUser}>`);
  }

  const isSecure = smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  return { transporter, fromAddress, smtpUser };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { transporter, fromAddress, smtpUser } = await getResolvedTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: smtpUser,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, "").trim(),
      attachments,
      headers: {
        "X-Mailer": "Noveraile Platform Mailer",
        "X-Priority": "1 (Highest)",
        "Importance": "high",
        "List-Unsubscribe": `<mailto:${smtpUser}?subject=unsubscribe>`,
      },
    });

    console.log(`✅ [GMAIL SMTP SENT] From: ${fromAddress} -> To: ${to} (MessageId: ${info.messageId})`);
    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error("❌ [GMAIL SMTP ERROR]:", err);
    return {
      success: false,
      error: err.message || "Failed to deliver email through Gmail SMTP. Please check credentials.",
    };
  }
}

export async function sendVerificationEmail(
  toEmail: string,
  recipientName: string,
  code: string,
  purpose: "REGISTRATION" | "SIGN_IN" = "REGISTRATION"
) {
  const isSignIn = purpose === "SIGN_IN";
  const title = isSignIn ? "Verify Your Sign-In Attempt" : "Verify Your Reader Email Address";
  const actionText = isSignIn
    ? `We detected a sign-in attempt to your Noveraile Publishing reader account. Please enter the 6-digit security code below to complete your sign-in:`
    : `Thank you for joining Noveraile Publishing. Please enter the 6-digit security verification code below to activate your personal cloud library:`;
  const subject = isSignIn
    ? `${code} is your Noveraile Publishing sign-in code`
    : `${code} is your Noveraile Publishing verification code`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
                ${title}
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Hello <strong>${recipientName || "Reader"}</strong>,<br><br>
                ${actionText}
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
                For your security, never share this code with anyone. Noveraile staff will never ask for your verification code.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              Noveraile Publishing Platform • Protected Cloud Library<br>
              If you did not initiate this request, you can safely disregard this email.
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
    subject,
    html,
    text: `Your Noveraile Publishing security code is: ${code}. It expires in 15 minutes.`,
  });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  recipientName: string,
  code: string
) {
  const title = "Reset Your Password";
  const subject = `${code} is your Noveraile Publishing password reset code`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
                Password Reset Request
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Hello <strong>${recipientName || "Reader"}</strong>,<br><br>
                We received a request to reset the password for your Noveraile Publishing account. Please enter the 6-digit security PIN below to choose a new password:
              </p>

              <!-- 6-Digit Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #fdfaf6; border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #b45309; display: block; margin-bottom: 8px;">
                      Your Password Reset PIN
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
                If you did not request this password reset, you can safely disregard this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              Noveraile Publishing Security • Protected Cloud Library<br>
              Support: noverailepublishing@gmail.com
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
    subject,
    html,
    text: `Your Noveraile Publishing password reset code is: ${code}. It expires in 15 minutes.`,
  });
}

export async function sendWelcomeEmail(toEmail: string, recipientName: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.noverailepublishing.com").replace(/\/$/, "");
  const subject = `Welcome to Noveraile Publishing — Your Personal Cloud Library is Ready`;
  const name = recipientName ? recipientName.trim() : "Reader";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Noveraile Publishing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fbfaf8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fbfaf8; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e7e2d9; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          <!-- Top Accent Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%); padding: 36px 32px; text-align: center;">
              <div style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; letter-spacing: 0.18em; color: #ffffff;">
                NOVERAILE
              </div>
              <div style="font-size: 10px; letter-spacing: 0.35em; color: #d6d3d1; text-transform: uppercase; margin-top: 4px;">
                PUBLISHING
              </div>
              <div style="margin-top: 14px; display: inline-block; padding: 4px 14px; border-radius: 9999px; background-color: rgba(245,158,11,0.18); border: 1px solid rgba(245,158,11,0.4); color: #fbbf24; font-size: 11px; font-weight: 600; letter-spacing: 0.05em;">
                Official Reader Account Activated
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.3;">
                Welcome, ${name}
              </h1>
              <p style="font-size: 15px; line-height: 1.65; color: #475569; margin: 0 0 24px 0;">
                Thank you for creating your account with <strong>Noveraile Publishing</strong>. Your personal digital library is now active, connecting you directly to professionally curated publications across healthcare licensure, professional certifications, and literary works.
              </p>

              <!-- Feature Pillars Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 18px; background-color: #fdfbf7; border: 1px solid #f1ece4; border-radius: 16px;">
                    <div style="font-family: Georgia, serif; font-size: 15px; font-weight: 700; color: #78350f; margin-bottom: 4px;">
                      📖 Protected Cloud Reader
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #57534e;">
                      Enjoy our seamless reading experience with realistic 3D page flip animation, warm sepia, midnight dark mode, and customizable typography.
                    </div>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px 18px; background-color: #fdfbf7; border: 1px solid #f1ece4; border-radius: 16px;">
                    <div style="font-family: Georgia, serif; font-size: 15px; font-weight: 700; color: #78350f; margin-bottom: 4px;">
                      ✍️ Dedicated Study Scratchpad
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #57534e;">
                      Jot down revision formulas, diagnostic notes, and mnemonics while reading. Your notes save automatically per publication.
                    </div>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px 18px; background-color: #fdfbf7; border: 1px solid #f1ece4; border-radius: 16px;">
                    <div style="font-family: Georgia, serif; font-size: 15px; font-weight: 700; color: #78350f; margin-bottom: 4px;">
                      🔄 Seamless Cross-Device Sync
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #57534e;">
                      Start on your desktop, pick up on your tablet, or review key takeaways on your phone. Your progress and bookmarks sync effortlessly.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Primary Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/books" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(15,23,42,0.18); letter-spacing: 0.02em; margin-right: 10px; margin-bottom: 10px;">
                      Explore Books &nbsp;&rarr;
                    </a>
                    <a href="${appUrl}/my-library" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #0c0a09; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(245,158,11,0.25); letter-spacing: 0.02em; margin-bottom: 10px;">
                      Go to My Library
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Reader Satisfaction Pledge -->
              <div style="background-color: #f8fafc; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin-top: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 3px;">
                  The Noveraile Publishing Standard
                </div>
                <div style="font-size: 12px; line-height: 1.5; color: #64748b;">
                  Every title is developed with strict factual verification, clinical rigor, and direct candidate blueprint alignment. You have lifetime access to your library.
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.7;">
              <div style="font-weight: 700; color: #475569; margin-bottom: 4px; font-size: 12px;">
                Noveraile Publishing Platform
              </div>
              <div>
                Have questions or need assistance? Reach out to our editorial desk anytime at <a href="mailto:noverailepublishing@gmail.com" style="color: #64748b; text-decoration: underline;">noverailepublishing@gmail.com</a>.
              </div>
              <div style="margin-top: 8px;">
                <a href="${appUrl}" style="color: #64748b; text-decoration: underline; margin: 0 6px;">Home</a> •
                <a href="${appUrl}/books" style="color: #64748b; text-decoration: underline; margin: 0 6px;">Catalog</a> •
                <a href="${appUrl}/my-library" style="color: #64748b; text-decoration: underline; margin: 0 6px;">My Library</a>
              </div>
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
    subject,
    html,
    text: `Welcome to Noveraile Publishing, ${name}!\n\nYour personal cloud reading account is now active. Explore our complete publication catalog at: ${appUrl}/books or access your personal library at: ${appUrl}/my-library.\n\nNeed assistance? Contact us at: noverailepublishing@gmail.com\n\nNoveraile Publishing Platform`,
  });
}

/**
 * Triggers the official Welcome Email for a user, with idempotent deduplication via AuditLog.
 */
export async function triggerWelcomeEmailOnce(userId: string, email: string, name: string) {
  try {
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: "WELCOME_EMAIL_SENT",
      },
    });

    if (existingLog) return { success: true, alreadySent: true };

    const result = await sendWelcomeEmail(email, name);

    if (result.success) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "WELCOME_EMAIL_SENT",
          entityType: "User",
          entityId: userId,
          details: JSON.stringify({ email, sentAt: new Date().toISOString() }),
        },
      });
    }

    return result;
  } catch (err: any) {
    console.error("triggerWelcomeEmailOnce error:", err);
    return { success: false, error: err?.message };
  }
}

export interface GiftDeliveryEmailOptions {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  senderEmail: string;
  giftMessage?: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
  bookSlug?: string;
  orderNumber?: string;
}

export async function sendGiftDeliveryEmail(opts: GiftDeliveryEmailOptions) {
  const {
    recipientEmail,
    recipientName = "Reader",
    senderName,
    senderEmail,
    giftMessage,
    bookTitle,
    bookAuthor,
    bookCoverUrl,
  } = opts;

  const appUrl =
    (await getSettingValue("NEXT_PUBLIC_APP_URL", "")) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://noverailepublishing.com";
  const libraryUrl = `${appUrl}/my-library`;
  const subject = `🎁 ${senderName} sent you a book gift on Noveraile Publishing: "${bookTitle}"`;

  const emailAttachments: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    cid?: string;
    contentType?: string;
  }> = [];

  let coverImageSrc = "";
  if (bookCoverUrl) {
    const cleanCover = bookCoverUrl.replace(/^\//, "");
    const localFilePath = path.join(process.cwd(), "public", cleanCover);

    if (fs.existsSync(localFilePath)) {
      const ext = path.extname(localFilePath).toLowerCase().slice(1) || "jpeg";
      const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
      const cidName = `cover_${Date.now()}@noveraile`;

      emailAttachments.push({
        filename: path.basename(localFilePath),
        path: localFilePath,
        cid: cidName,
        contentType: mimeType,
      });

      coverImageSrc = `cid:${cidName}`;
    } else if (bookCoverUrl.startsWith("http")) {
      coverImageSrc = bookCoverUrl;
    } else {
      coverImageSrc = `${appUrl}/${cleanCover}`;
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06);">
          
          <!-- Top Gold Accent Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #b45309 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
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
            <td style="padding: 32px 32px 28px 32px;">
              <!-- Gift Badge -->
              <div style="margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #b45309; background: #fffbeb; border: 1px solid #fef3c7; padding: 5px 14px; border-radius: 20px; display: inline-block;">
                  🎁 Special Book Gift
                </span>
              </div>

              <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
                ${senderName} has sent you a book!
              </h1>

              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Dear <strong>${recipientName}</strong>,<br><br>
                Great news! <strong>${senderName}</strong> (${senderEmail}) has gifted you complete digital access to <strong>${bookTitle}</strong> on Noveraile Publishing.
              </p>

              <!-- Stylized Personal Gift Card Note -->
              ${
                giftMessage
                  ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0 28px 0;">
                <tr>
                  <td style="background-color: #fdfaf6; border: 2px dashed #f59e0b; border-radius: 18px; padding: 22px 24px;">
                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; color: #b45309; display: block; margin-bottom: 8px;">
                      Personal Message from ${senderName}
                    </span>
                    <p style="font-family: Georgia, serif; font-size: 15px; font-style: italic; color: #334155; line-height: 1.6; margin: 0;">
                      &ldquo;${giftMessage}&rdquo;
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Book Preview Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                <tr>
                  <td style="padding: 20px; background: linear-gradient(180deg, #fbfcfd 0%, #f8fafc 100%);">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        ${
                          coverImageSrc
                            ? `<td width="105" align="center" valign="top" style="padding-right: 20px;">
                                <img src="${coverImageSrc}" alt="${bookTitle}" width="100" style="border-radius: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.08); display: block; max-width: 100px;" />
                              </td>`
                            : ""
                        }
                        <td valign="middle">
                          <h3 style="font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.35;">
                            ${bookTitle}
                          </h3>
                          ${
                            bookAuthor
                              ? `<div style="font-size: 13px; color: #64748b; margin-bottom: 12px; font-style: italic;">By ${bookAuthor}</div>`
                              : ""
                          }
                          <div style="display: inline-block; font-size: 11px; font-weight: 700; color: #166534; background: #dcfce7; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 6px;">
                            ✓ Cloud Library Access Granted
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${libraryUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 12px; box-shadow: 0 6px 18px rgba(15,23,42,0.2); letter-spacing: 0.02em;">
                      Claim & Read in My Library &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; text-align: center; margin: 12px 0 0 0;">
                Sign in with <strong>${recipientEmail}</strong> to read from your cloud library on any desktop, tablet, or phone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              Noveraile Publishing Platform • Protected Cloud Library<br>
              Support: noverailepublishing@gmail.com
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
    to: recipientEmail,
    subject,
    html,
    text: `${senderName} sent you "${bookTitle}" on Noveraile Publishing! Read it here: ${libraryUrl}`,
    attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
  });
}

export interface OrderItemSummary {
  title: string;
  author?: string;
  price: number;
  coverImage?: string;
  slug?: string;
}

export interface OrderConfirmationEmailOptions {
  customerEmail: string;
  customerName?: string;
  orderNumber: string;
  orderDate?: Date | string;
  items: OrderItemSummary[];
  subtotal: number;
  discountAmount?: number;
  totalAmount: number;
  currency?: string;
  paymentProvider?: string; // "NOWPAYMENTS" | "PAYSTACK" | "STRIPE" | "FREE_CLAIM" | "SANDBOX"
  cryptoCurrency?: string;
  cryptoAmount?: number;
  isGift?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  giftMessage?: string;
}

export async function sendOrderConfirmationEmail(opts: OrderConfirmationEmailOptions) {
  const {
    customerEmail,
    customerName,
    orderNumber,
    orderDate = new Date(),
    items = [],
    subtotal = 0,
    discountAmount = 0,
    totalAmount = 0,
    currency = "USD",
    paymentProvider = "ONLINE",
    cryptoCurrency,
    cryptoAmount,
    isGift = false,
    recipientName,
    recipientEmail,
    giftMessage,
  } = opts;

  const appUrl =
    (await getSettingValue("NEXT_PUBLIC_APP_URL", "")) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://noverailepublishing.com";
  const libraryUrl = `${appUrl}/my-library`;

  const isFree = totalAmount <= 0.001;
  const greetingName = customerName || customerEmail.split("@")[0];
  const formattedDate =
    typeof orderDate === "string"
      ? orderDate
      : new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(orderDate);

  // Determine provider label
  let paymentMethodLabel = "Credit / Debit Card";
  if (isFree) {
    paymentMethodLabel = "Complimentary Free Claim ($0.00)";
  } else if (paymentProvider === "NOWPAYMENTS" || paymentProvider === "CRYPTO") {
    paymentMethodLabel = cryptoCurrency
      ? `Cryptocurrency (${cryptoCurrency.toUpperCase()}${cryptoAmount ? ` - ${cryptoAmount}` : ""})`
      : "Cryptocurrency (NOWPayments)";
  } else if (paymentProvider === "PAYSTACK") {
    paymentMethodLabel = "Paystack Secure Payment";
  } else if (paymentProvider === "STRIPE") {
    paymentMethodLabel = "Stripe Secure Card";
  }

  const subject = isFree
    ? `🎉 Your Free Books Are Ready! (Order #${orderNumber})`
    : isGift
    ? `🎁 Order Confirmed: Your Book Gift is on its way! (#${orderNumber})`
    : `📖 Order Confirmed: Your Noveraile Library is Ready! (#${orderNumber})`;

  const emailAttachments: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    cid?: string;
    contentType?: string;
  }> = [];

  // Generate HTML for book items
  const itemsHtml = items
    .map((item, idx) => {
      let coverSrc = "";
      if (item.coverImage) {
        const cleanCover = item.coverImage.replace(/^\//, "");
        const localFilePath = path.join(process.cwd(), "public", cleanCover);

        if (fs.existsSync(localFilePath)) {
          const ext = path.extname(localFilePath).toLowerCase().slice(1) || "jpeg";
          const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
          const cidName = `book_cover_${idx}_${Date.now()}@noveraile`;

          emailAttachments.push({
            filename: path.basename(localFilePath),
            path: localFilePath,
            cid: cidName,
            contentType: mimeType,
          });

          coverSrc = `cid:${cidName}`;
        } else if (item.coverImage.startsWith("http")) {
          coverSrc = item.coverImage;
        } else {
          coverSrc = `${appUrl}/${cleanCover}`;
        }
      }

      const itemPriceText = item.price <= 0 ? "FREE" : `$${item.price.toFixed(2)} ${currency}`;
      const itemReadUrl = item.slug ? `${appUrl}/reader/${item.slug}` : libraryUrl;

      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                ${
                  coverSrc
                    ? `<td width="70" valign="top" style="padding-right: 16px;">
                        <img src="${coverSrc}" alt="${item.title}" width="65" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.06); display: block; max-width: 65px;" />
                      </td>`
                    : ""
                }
                <td valign="middle">
                  <div style="font-family: Georgia, serif; font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                    ${item.title}
                  </div>
                  ${
                    item.author
                      ? `<div style="font-size: 13px; color: #64748b; margin-bottom: 6px; font-style: italic;">By ${item.author}</div>`
                      : ""
                  }
                  <a href="${itemReadUrl}" target="_blank" style="display: inline-block; font-size: 12px; font-weight: 700; color: #b45309; text-decoration: none;">
                    Read in Web Reader &rarr;
                  </a>
                </td>
                <td width="90" align="right" valign="middle" style="font-size: 14px; font-weight: 800; color: #0f172a;">
                  ${itemPriceText}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Top Gold Accent Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #b45309 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 36px 36px 24px 36px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <div style="font-family: Georgia, serif; font-size: 22px; font-weight: 800; letter-spacing: 0.15em; color: #0f172a;">
                NOVERAILE
              </div>
              <div style="font-size: 9px; letter-spacing: 0.35em; color: #64748b; text-transform: uppercase; margin-top: 2px;">
                PUBLISHING
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <!-- Status Badge -->
              <div style="margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #166534; background: #dcfce7; border: 1px solid #bbf7d0; padding: 5px 14px; border-radius: 20px; display: inline-block;">
                  ✓ ${isFree ? "Free Claim Confirmed" : "Order Confirmed & Paid"}
                </span>
              </div>

              <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.3;">
                ${isGift ? "Your gift order is on its way!" : "Your digital library has been unlocked!"}
              </h1>

              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Dear <strong>${greetingName}</strong>,<br><br>
                ${
                  isGift
                    ? `Thank you for your generous gift order! We have dispatched a separate digital delivery email to <strong>${recipientName || recipientEmail}</strong> (${recipientEmail}) with immediate access to read their new books.`
                    : `Thank you for choosing Noveraile Publishing. Your publications are permanently unlocked in your personal cloud library and ready to read across any desktop, tablet, or mobile device.`
                }
              </p>

              <!-- Order Summary Meta Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0 28px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 20px;">
                <tr>
                  <td width="50%" valign="top" style="padding-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; letter-spacing: 0.05em;">Order Number</span>
                    <span style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: 800; color: #0f172a;">${orderNumber}</span>
                  </td>
                  <td width="50%" valign="top" style="padding-bottom: 8px;" align="right">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; letter-spacing: 0.05em;">Order Date</span>
                    <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${formattedDate}</span>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style="padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; letter-spacing: 0.05em;">Payment Method</span>
                    <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${paymentMethodLabel}</span>
                  </td>
                  <td width="50%" valign="top" style="padding-top: 8px; border-top: 1px dashed #e2e8f0;" align="right">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; letter-spacing: 0.05em;">Account</span>
                    <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${customerEmail}</span>
                  </td>
                </tr>
              </table>

              <!-- Gift Card Info (if gift) -->
              ${
                isGift && recipientEmail
                  ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td style="background-color: #fdfaf6; border: 2px dashed #f59e0b; border-radius: 16px; padding: 18px 20px;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #b45309; display: block; margin-bottom: 4px;">
                      🎁 Gift Details
                    </span>
                    <div style="font-size: 13px; color: #334155; line-height: 1.5;">
                      Sent To: <strong>${recipientName || recipientEmail}</strong> (${recipientEmail})<br>
                      ${giftMessage ? `Note: <em>&ldquo;${giftMessage}&rdquo;</em>` : ""}
                    </div>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Items Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <thead>
                  <tr>
                    <th align="left" style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                      Purchased Publication(s)
                    </th>
                    <th align="right" style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0 28px 0;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Subtotal:</td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
                    ${subtotal <= 0 ? "FREE" : `$${subtotal.toFixed(2)} ${currency}`}
                  </td>
                </tr>
                ${
                  discountAmount > 0
                    ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #16a34a;">Voucher Discount:</td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #16a34a;">
                    -$${discountAmount.toFixed(2)} ${currency}
                  </td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0;">
                    Total Paid:
                  </td>
                  <td align="right" style="padding: 12px 0 0 0; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0;">
                    ${totalAmount <= 0 ? "FREE ($0.00)" : `$${totalAmount.toFixed(2)} ${currency}`}
                  </td>
                </tr>
              </table>

              <!-- Main CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${libraryUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 6px 20px rgba(15,23,42,0.2); letter-spacing: 0.02em;">
                      Open My Cloud Library &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; text-align: center; margin: 12px 0 0 0;">
                You can access your books anytime by logging into <strong>${appUrl}</strong> with <strong>${customerEmail}</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              Noveraile Publishing Platform • Official Order Receipt<br>
              Need help with your order? Reach us at <a href="mailto:noverailepublishing@gmail.com" style="color: #64748b; text-decoration: underline;">noverailepublishing@gmail.com</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
 </body>
</html>
  `.trim();

  const plainTextItems = items.map((i) => `- ${i.title} (${i.price <= 0 ? "FREE" : `$${i.price}`})`).join("\n");
  const plainText = `
NOVERAILE PUBLISHING - ORDER CONFIRMATION
Order Number: ${orderNumber}
Date: ${formattedDate}
Total: ${totalAmount <= 0 ? "FREE ($0.00)" : `$${totalAmount.toFixed(2)} ${currency}`}

Purchased Books:
${plainTextItems}

Access your cloud library now:
${libraryUrl}

Support: noverailepublishing@gmail.com
  `.trim();

  return sendEmail({
    to: customerEmail,
    subject,
    html,
    text: plainText,
    attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
  });
}

export interface BroadcastEmailOptions {
  toEmail: string;
  recipientName?: string;
  subject: string;
  headline: string;
  content: string;
  campaignType?: "BOOK_RELEASE" | "PROMOTION" | "SEASONAL" | "ANNOUNCEMENT";
  ctaText?: string;
  ctaUrl?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookPrice?: number;
  bookCoverUrl?: string;
  couponCode?: string;
  couponDiscount?: string;
}

export async function sendBroadcastEmail(opts: BroadcastEmailOptions) {
  const {
    toEmail,
    recipientName = "Reader",
    subject,
    headline,
    content,
    campaignType = "ANNOUNCEMENT",
    ctaText,
    ctaUrl,
    bookTitle,
    bookAuthor,
    bookPrice,
    bookCoverUrl,
    couponCode,
    couponDiscount,
  } = opts;

  const appUrl =
    (await getSettingValue("NEXT_PUBLIC_APP_URL", "")) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://noverailepublishing.com";
  const defaultCtaUrl = ctaUrl?.startsWith("http")
    ? ctaUrl
    : `${appUrl}${ctaUrl ? (ctaUrl.startsWith("/") ? ctaUrl : `/${ctaUrl}`) : ""}`;
  const defaultCtaText = ctaText || "Explore on Noveraile";

  const emailAttachments: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    cid?: string;
    contentType?: string;
  }> = [];

  let coverImageSrc = "";

  if (bookCoverUrl) {
    const cleanCover = bookCoverUrl.replace(/^\//, "");
    const localFilePath = path.join(process.cwd(), "public", cleanCover);

    if (fs.existsSync(localFilePath)) {
      const ext = path.extname(localFilePath).toLowerCase().slice(1) || "jpeg";
      const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
      const cidName = `cover_${Date.now()}@noveraile`;

      emailAttachments.push({
        filename: path.basename(localFilePath),
        path: localFilePath,
        cid: cidName,
        contentType: mimeType,
      });

      coverImageSrc = `cid:${cidName}`;
    } else if (bookCoverUrl.startsWith("http")) {
      coverImageSrc = bookCoverUrl;
    } else {
      coverImageSrc = `${appUrl}/${cleanCover}`;
    }
  }

  const kickerMap: Record<string, string> = {
    BOOK_RELEASE: "✨ New Publication Release",
    PROMOTION: "🎁 Exclusive Reader Invitation",
    SEASONAL: "🌟 Season's Greetings",
    ANNOUNCEMENT: "📢 Official Announcement",
  };
  const kickerText = kickerMap[campaignType] || "📢 Official Announcement";

  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="font-size: 15px; line-height: 1.8; color: #334155; margin: 0 0 18px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${p.replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("");

  let bookHtml = "";
  if (bookTitle) {
    bookHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 24px; background: linear-gradient(180deg, #fbfcfd 0%, #f8fafc 100%);">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                ${
                  coverImageSrc
                    ? `<td width="115" align="center" valign="top" style="padding-right: 22px;">
                        <img src="${coverImageSrc}" alt="${bookTitle}" width="110" style="border-radius: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.18); border: 1px solid rgba(0,0,0,0.08); display: block; max-width: 110px;" />
                      </td>`
                    : ""
                }
                <td valign="middle">
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 6px; margin-bottom: 8px;">
                    Featured Book
                  </span>
                  <h3 style="font-family: Georgia, Cambria, serif; font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.35;">
                    ${bookTitle}
                  </h3>
                  ${
                    bookAuthor
                      ? `<div style="font-size: 13px; color: #64748b; margin-bottom: 10px; font-style: italic;">By ${bookAuthor}</div>`
                      : ""
                  }
                  ${
                    bookPrice !== undefined
                      ? `<div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">$${bookPrice.toFixed(
                          2
                        )} USD</div>`
                      : ""
                  }
                  <a href="${defaultCtaUrl}" target="_blank" style="display: inline-block; font-size: 12px; font-weight: 700; color: #ffffff; background: #0f172a; text-decoration: none; padding: 7px 16px; border-radius: 8px;">
                    Read & Unlock &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  let couponHtml = "";
  if (couponCode) {
    couponHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
        <tr>
          <td align="center" style="background-color: #fefce8; border: 2px dashed #ca8a04; border-radius: 18px; padding: 26px 20px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #854d0e; display: block; margin-bottom: 8px;">
              ${couponDiscount ? `★ ${couponDiscount} Promotional Voucher ★` : "★ Exclusive Reader Voucher ★"}
            </span>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 800; letter-spacing: 0.25em; color: #0f172a; background: #ffffff; padding: 10px 24px; border-radius: 10px; display: inline-block; border: 1px solid #fde047; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              ${couponCode}
            </div>
            <span style="font-size: 12px; color: #a16207; display: block; margin-top: 10px;">
              Apply this voucher code during checkout to claim your savings.
            </span>
          </td>
        </tr>
      </table>
    `;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Top Gold Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #b45309 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 36px 36px 24px 36px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <div style="font-family: Georgia, Cambria, serif; font-size: 22px; font-weight: 800; letter-spacing: 0.2em; color: #0f172a;">
                NOVERAILE
              </div>
              <div style="font-size: 9px; letter-spacing: 0.4em; color: #64748b; text-transform: uppercase; margin-top: 4px; font-weight: 600;">
                PUBLISHING
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <!-- Kicker Badge -->
              <div style="margin-bottom: 14px;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #b45309; background: #fffbeb; border: 1px solid #fef3c7; padding: 4px 12px; border-radius: 20px; display: inline-block;">
                  ${kickerText}
                </span>
              </div>

              <!-- Main Title -->
              <h1 style="font-family: Georgia, Cambria, serif; font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 18px 0; line-height: 1.35; letter-spacing: -0.01em;">
                ${headline}
              </h1>

              <!-- Greeting -->
              <div style="font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 22px; font-weight: 500;">
                Dear <strong style="color: #0f172a;">${recipientName}</strong>,
              </div>

              <!-- Paragraphs -->
              ${paragraphsHtml}

              <!-- Book Card (if attached) -->
              ${bookHtml}

              <!-- Coupon Voucher (if attached) -->
              ${couponHtml}

              <!-- Primary CTA Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 36px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${defaultCtaUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 12px; box-shadow: 0 6px 18px rgba(15,23,42,0.2); letter-spacing: 0.02em;">
                      ${defaultCtaText} &nbsp;&rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.7;">
              <div style="font-weight: 700; color: #475569; margin-bottom: 6px; font-size: 12px;">
                Noveraile Publishing Platform
              </div>
              <div>
                You are receiving this official announcement as a registered member of Noveraile Publishing.<br>
                For support, contact us at <a href="mailto:noverailepublishing@gmail.com" style="color: #64748b; text-decoration: underline;">noverailepublishing@gmail.com</a>.
              </div>
              <div style="margin-top: 10px;">
                <a href="${appUrl}" style="color: #475569; text-decoration: underline; font-weight: 600; margin: 0 6px;">Storefront</a> •
                <a href="${appUrl}/my-library" style="color: #475569; text-decoration: underline; font-weight: 600; margin: 0 6px;">My Library</a> •
                <a href="${appUrl}/account" style="color: #475569; text-decoration: underline; font-weight: 600; margin: 0 6px;">Account Settings</a>
              </div>
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
    subject,
    html,
    text: `${headline}\n\nDear ${recipientName},\n\n${content}\n\n${ctaText || "Visit"}: ${defaultCtaUrl}\n\nNoveraile Publishing Platform`,
    attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
  });
}
