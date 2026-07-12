import "server-only";
import nodemailer from "nodemailer";
import { type Member } from "./data";
import { getActiveArtistRecord } from "./db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ARTIST_NAME = process.env.ARTIST_NAME || "VIP";

function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1) + " VIP";
}

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

export async function sendWelcomeEmail(
  member: Member,
  temporaryPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping welcome email");
    return { success: false, error: "Gmail credentials not configured" };
  }

  let artistName = "";
  try {
    const activeArtist = await getActiveArtistRecord();
    if (activeArtist?.name) artistName = activeArtist.name;
  } catch {}
  if (!artistName) artistName = ARTIST_NAME;
  console.log("[email] Using artist name:", artistName);
  const memberName = member.personal.firstName
    ? `${member.personal.firstName} ${member.personal.lastName}`.trim()
    : member.personal.email;
  const membershipType = tierLabel(member.membership.tier);
  const loginUrl = `${APP_URL}/login`;

  const subject = `Welcome to the ${artistName} VIP Membership Program`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1400,#2d2200);padding:40px 40px 32px;text-align:center;border-bottom:1px solid #2a2000;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:4px;color:#b8860b;text-transform:uppercase;">${artistName}</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#d4af37;letter-spacing:1px;">VIP Membership Program</h1>
              <p style="margin:12px 0 0;font-size:13px;color:#888;letter-spacing:2px;text-transform:uppercase;">Welcome to the Inner Circle</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <!-- Greeting -->
              <p style="margin:0 0 20px;font-size:18px;color:#d4af37;font-weight:600;">Dear ${memberName},</p>

              <!-- Congratulations -->
              <p style="margin:0 0 16px;font-size:15px;color:#cccccc;line-height:1.7;">
                Congratulations and welcome to the <strong style="color:#d4af37;">${artistName} VIP Membership Program</strong>. We are delighted to welcome you to this exclusive community of dedicated fans and supporters.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#cccccc;line-height:1.7;">
                Your application for the <strong style="color:#d4af37;">${membershipType}</strong> membership has been received successfully, and we are excited to have you as part of this premium VIP experience.
              </p>

              <!-- Pending Status Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1200;border:1px solid #3a2a00;border-radius:8px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;color:#b8860b;text-transform:uppercase;">&#9888; Important — Membership Status</p>
                    <p style="margin:0 0 10px;font-size:14px;color:#dddddd;line-height:1.7;">
                      Your <strong style="color:#d4af37;">${membershipType}</strong> membership application is currently <strong style="color:#f0c040;">pending</strong> and will be activated once full payment has been received and confirmed.
                    </p>
                    <p style="margin:0;font-size:14px;color:#dddddd;line-height:1.7;">
                      After payment verification, your membership will become <strong style="color:#4ade80;">active</strong> and you will gain access to all benefits associated with your <strong style="color:#d4af37;">${membershipType}</strong> membership level.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Login Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;margin:0 0 28px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;font-size:11px;letter-spacing:3px;color:#b8860b;text-transform:uppercase;">Here Are Your Login Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 0;font-size:13px;color:#888;width:170px;vertical-align:top;">Email / Username</td>
                        <td style="padding:10px 0;font-size:14px;color:#ffffff;font-family:monospace;">${member.personal.email}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;font-size:13px;color:#888;vertical-align:top;">Temporary Password</td>
                        <td style="padding:10px 0;font-size:18px;color:#d4af37;font-family:monospace;font-weight:700;letter-spacing:3px;">${temporaryPassword}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;font-size:13px;color:#888;vertical-align:top;">Membership #</td>
                        <td style="padding:10px 0;font-size:14px;color:#ffffff;font-family:monospace;">${member.membership.number}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;font-size:13px;color:#888;vertical-align:top;">Membership Type</td>
                        <td style="padding:10px 0;font-size:14px;color:#d4af37;font-weight:600;">${membershipType}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <p style="margin:0 0 20px;font-size:14px;color:#aaaaaa;line-height:1.7;padding:14px 16px;background:#111;border-left:3px solid #d4af37;border-radius:0 6px 6px 0;">
                🔐 <strong style="color:#d4af37;">Security Notice:</strong> For your security, please log in and change your temporary password after your first successful login.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#b8860b,#d4af37);color:#000000;text-decoration:none;font-size:15px;font-weight:700;padding:14px 44px;border-radius:6px;letter-spacing:1px;">
                      Access Your Member Account →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- VIP Card Note -->
              <p style="margin:0 0 20px;font-size:14px;color:#cccccc;line-height:1.7;">
                Once your membership is activated, you will be able to access your member dashboard, view your <strong style="color:#d4af37;">electronic VIP membership card</strong>, and enjoy all the exclusive benefits available to your <strong style="color:#d4af37;">${membershipType}</strong> membership.
              </p>

              <!-- Closing -->
              <p style="margin:0 0 8px;font-size:15px;color:#cccccc;line-height:1.7;">
                Thank you for joining the <strong style="color:#d4af37;">${artistName} VIP Membership Program</strong>. We look forward to sharing this exclusive experience with you.
              </p>
              <p style="margin:20px 0 0;font-size:14px;color:#888;line-height:1.7;">
                Warm regards,<br />
                <strong style="color:#d4af37;">${artistName} VIP Membership Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0d0d;padding:24px 40px;border-top:1px solid #1a1a1a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#444;">${artistName} VIP Membership Platform</p>
              <p style="margin:6px 0 0;font-size:11px;color:#333;">This is an automated message — please do not reply directly to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const transporter = createTransport();
    console.log("[email] Verifying SMTP connection for:", process.env.GMAIL_USER);
    const verifyResult = await transporter.verify();
    console.log("[email] SMTP verify result:", verifyResult);

    const info = await transporter.sendMail({
      from: `"${artistName} VIP Membership" <${process.env.GMAIL_USER}>`,
      to: member.personal.email,
      subject,
      html,
    });
    console.log("[email] Welcome email sent:", info.messageId, info.response);
    return { success: true };
  } catch (err: any) {
    console.error("[email] Failed to send welcome email to:", member.personal.email);
    console.error("[email] Error code:", err?.code);
    console.error("[email] Error command:", err?.command);
    console.error("[email] Error response:", err?.response);
    console.error("[email] Full error:", err);
    return {
      success: false,
      error: err?.response || err?.message || "Unknown error",
    };
  }
}
