import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

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

function getTransporter() {
  const smtpUser = (process.env.SMTP_USER || "noverailepublishing@gmail.com").trim();
  const smtpPass = (process.env.SMTP_PASS || "gdvtxwkzsufqquef").trim().replace(/\s+/g, "");
  const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  const fromAddress =
    process.env.EMAIL_FROM?.trim() || `"Noveraile Publishing" <${smtpUser}>`;

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
    const { transporter, fromAddress, smtpUser } = getTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: smtpUser,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, "").trim(),
      attachments,
      headers: {
        "Auto-Submitted": "auto-generated",
        "X-Auto-Response-Suppress": "All",
        "X-Entity-Ref-ID": `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

export interface BroadcastEmailOptions {
  toEmail: string;
  recipientName?: string;
  subject: string;
  headline: string;
  content: string; // Markdown or plain text paragraphs
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noverailepublishing.com";
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

  // Handle Book Cover Embedding via CID (Works 100% in Gmail/Apple/Outlook without needing public proxy)
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

  // Determine Kicker Tag
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

  // Luxury Book Card HTML
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

  // Luxury Voucher Card HTML
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
        <!-- Main Email Container -->
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
