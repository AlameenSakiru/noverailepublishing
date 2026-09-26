import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
  const defaultCtaUrl = ctaUrl || appUrl;
  const defaultCtaText = ctaText || "Explore on Noveraile";

  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const paragraphsHtml = paragraphs
    .map((p) => `<p style="font-size: 14px; line-height: 1.7; color: #334155; margin: 0 0 16px 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  // Optional book showcase card
  let bookHtml = "";
  if (bookTitle) {
    bookHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; padding: 20px;">
        <tr>
          ${
            bookCoverUrl
              ? `<td width="100" align="center" valign="top" style="padding-right: 18px;">
                  <img src="${bookCoverUrl.startsWith("http") ? bookCoverUrl : `${appUrl}${bookCoverUrl}`}" alt="${bookTitle}" width="90" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); display: block;" />
                </td>`
              : ""
          }
          <td valign="middle">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #b45309; display: block; margin-bottom: 4px;">
              Featured Publication
            </span>
            <h3 style="font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
              ${bookTitle}
            </h3>
            ${bookAuthor ? `<div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">By ${bookAuthor}</div>` : ""}
            ${bookPrice !== undefined ? `<div style="font-size: 15px; font-weight: 700; color: #0f172a;">$${bookPrice.toFixed(2)} USD</div>` : ""}
          </td>
        </tr>
      </table>
    `;
  }

  // Optional coupon card
  let couponHtml = "";
  if (couponCode) {
    couponHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
          <td align="center" style="background-color: #fefce8; border: 2px dashed #ca8a04; border-radius: 16px; padding: 20px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #854d0e; display: block; margin-bottom: 6px;">
              ${couponDiscount ? `Exclusive Discount Voucher • ${couponDiscount}` : "Exclusive Promotional Voucher"}
            </span>
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 800; letter-spacing: 0.2em; color: #0f172a; display: block;">
              ${couponCode}
            </span>
            <span style="font-size: 11px; color: #a16207; display: block; margin-top: 6px;">
              Apply this voucher code at checkout to claim your savings.
            </span>
          </td>
        </tr>
      </table>
    `;
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
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 40px 36px; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
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
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.35;">
                ${headline}
              </h1>

              <div style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 20px;">
                Dear <strong>${recipientName}</strong>,
              </div>

              ${paragraphsHtml}
              ${bookHtml}
              ${couponHtml}

              <!-- Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${defaultCtaUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
                      ${defaultCtaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              Sent by Noveraile Publishing Platform<br>
              You received this official announcement because you are a registered reader with Noveraile.<br>
              <a href="${appUrl}" style="color: #64748b; text-decoration: underline;">Visit Storefront</a> • <a href="${appUrl}/account" style="color: #64748b; text-decoration: underline;">Manage Account</a>
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
  });
}
