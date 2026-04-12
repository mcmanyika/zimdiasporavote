import { Resend } from 'resend'
import {
  CONTACT_EMAIL,
  getSiteUrl,
  SITE_NAME,
  SITE_TAGLINE,
  SOCIAL_FACEBOOK_URL,
  SOCIAL_X_URL,
} from '@/lib/branding'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'Diaspora Vote <onboarding@resend.dev>'
const APP_NAME = SITE_NAME
const APP_URL = getSiteUrl()

// ─── Welcome Email ────────────────────────────────────────────────
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string
  name: string
}) {
  const firstName = name.split(' ')[0] || name

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Welcome to ${APP_NAME}!`,
      html: buildWelcomeEmailHtml({ firstName, name }),
    })

    if (error) {
      console.error('Resend error sending welcome email:', error)
      return { success: false, error }
    }

    console.log('Welcome email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Failed to send welcome email:', err)
    return { success: false, error: err.message }
  }
}

// ─── Generic / Custom Email ──────────────────────────────────────
export async function sendCustomEmail({
  to,
  name,
  subject,
  body,
  htmlBody,
  usePlatformTemplate = true,
}: {
  to: string
  name: string
  subject: string
  body: string
  htmlBody?: string
  usePlatformTemplate?: boolean
}) {
  try {
    const rawBody = htmlBody && htmlBody.trim() ? htmlBody : body.replace(/\n/g, '<br />')
    const personalizedRawBody = personalizeEmailBody(rawBody, name)
    const html = usePlatformTemplate
      ? buildCustomEmailHtml({
          name,
          subject,
          body: personalizeEmailBody(body, name),
          htmlBody: htmlBody ? personalizedRawBody : undefined,
        })
      : applyEmailImageCap(personalizedRawBody)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error sending custom email:', error)
      return { success: false, error }
    }

    console.log('Custom email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('Failed to send custom email:', err)
    return { success: false, error: err.message }
  }
}

function personalizeEmailBody(content: string, name: string): string {
  const safeName = (name || '').trim() || 'Recipient'
  return content
    .replace(/\[Name\]/gi, safeName)
    .replace(/\{\{name\}\}/gi, safeName)
}

function applyEmailImageCap(html: string): string {
  // Ensure all inline images stay readable in email clients.
  return html.replace(/<img\b([^>]*)>/gi, (_match: string, attrs: string) => {
    if (/style\s*=/i.test(attrs)) {
      return `<img${attrs.replace(/style\s*=\s*["']([^"']*)["']/i, (_m: string, style: string) => {
        const merged = `${style}; display:block; margin:0 auto; width:100%; max-width:620px; height:auto;`
        return `style="${merged}"`
      })}>`
    }
    return `<img${attrs} style="display:block; margin:0 auto; width:100%; max-width:620px; height:auto;" />`
  })
}

function buildCustomEmailHtml({ name, subject, body, htmlBody }: { name: string; subject: string; body: string; htmlBody?: string }) {
  // Convert newlines to <br> for plain-text body
  const rawBody = htmlBody && htmlBody.trim() ? htmlBody : body.replace(/\n/g, '<br />')
  const renderedBody = applyEmailImageCap(rawBody)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="780" cellpadding="0" cellspacing="0" style="max-width:780px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <img src="${APP_URL}/images/logo.png" alt="${APP_NAME}" width="60" height="60" style="border-radius:8px;" />
              <h1 style="color:#ffffff;font-size:22px;margin:16px 0 0;font-weight:700;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" style="padding:40px 30px 40px 40px;width:68%;">
                    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                      Dear <strong style="color:#0f172a;">${name}</strong>,
                    </p>
                    <div style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      ${renderedBody}
                    </div>
                    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 4px;">
                      Warm regards,
                    </p>
                    <p style="color:#0f172a;font-size:15px;line-height:1.5;margin:0;">
                      <strong>${APP_NAME}</strong>
                    </p>
                  </td>
                  <td valign="top" style="padding:28px 20px;background-color:#1e3a8a;width:32%;color:#ffffff;">
                    <p style="font-size:16px;line-height:1.3;font-weight:700;margin:0 0 10px;">
                      Contact
                    </p>
                    <p style="font-size:13px;line-height:1.7;margin:0 0 10px;">
                      6 Down road. Avondale, Harare, Zimbabwe
                    </p>
                    <p style="font-size:12px;line-height:1.6;margin:0 0 6px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px;margin-right:6px;"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h3A1.5 1.5 0 0 1 9 4.24l1.03 4.12a1.5 1.5 0 0 1-.4 1.43l-1.2 1.2a13 13 0 0 0 4.57 4.57l1.2-1.2a1.5 1.5 0 0 1 1.43-.4L19.76 15A1.5 1.5 0 0 1 21 16.5v3A2.5 2.5 0 0 1 18.5 22h-1C8.94 22 2 15.06 2 6.5v-1Z" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      +1 832 786 0457
                    </p>
                    <p style="font-size:12px;line-height:1.6;margin:0 0 6px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#ffffff" style="vertical-align:-2px;margin-right:6px;"><path d="M13.5 8.5h2V6h-2C11.6 6 10 7.6 10 9.5V12H8v2.5h2V20h2.5v-5.5h2.2l.3-2.5h-2.5V9.8c0-.7.3-1.3 1-1.3Z"/></svg>
                      <a href="${SOCIAL_FACEBOOK_URL}" style="color:#ffffff;text-decoration:underline;">${APP_NAME}</a>
                    </p>
                    <p style="font-size:12px;line-height:1.6;margin:0 0 6px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#ffffff" style="vertical-align:-2px;margin-right:6px;"><path d="M18.9 3H22l-6.8 7.8L23 21h-6l-4.7-6.1L6.8 21H3.7l7.3-8.4L1.4 3h6l4.3 5.7L18.9 3Zm-1 16h1.7L6.5 4.9H4.8L17.9 19Z"/></svg>
                      <a href="${SOCIAL_X_URL}" style="color:#ffffff;text-decoration:underline;">@DiasporaVote</a>
                    </p>
                    <p style="font-size:12px;line-height:1.6;margin:0 0 6px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px;margin-right:6px;"><path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke="#ffffff" stroke-width="1.8"/><path d="m3.8 7 8.2 6 8.2-6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      <a href="mailto:${CONTACT_EMAIL}" style="color:#ffffff;text-decoration:underline;">${CONTACT_EMAIL}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:6px 0 0;">
                <a href="${APP_URL}" style="color:#0f172a;text-decoration:underline;">${APP_URL.replace(/^https?:\/\//, '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ─── HTML Template Builder ────────────────────────────────────────
function buildWelcomeEmailHtml({
  firstName,
  name,
}: {
  firstName: string
  name: string
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <img src="${APP_URL}/images/logo.png" alt="${APP_NAME}" width="60" height="60" style="border-radius:8px;" />
              <h1 style="color:#ffffff;font-size:22px;margin:16px 0 0;font-weight:700;">
                ${APP_NAME}
              </h1>
              <p style="color:#94a3b8;font-size:13px;margin:6px 0 0;">
                &quot;${SITE_TAGLINE}&quot;
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Dear <strong style="color:#0f172a;">${name}</strong>,
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Thank you for joining <strong>${APP_NAME}</strong>.
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                You are now part of a non-partisan community focused on <strong style="color:#0f172a;">diaspora civic engagement and democratic participation</strong> for Zimbabwe &mdash; connecting citizens abroad with transparent, peaceful ways to stay informed and involved.
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                ${APP_NAME} exists to amplify diaspora voices, support accountable governance, and strengthen the link between Zimbabweans overseas and democratic processes at home.
              </p>

              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px;">
                Together we work to:
              </p>

              <!-- Bullet Points -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Expand diaspora access to information and participation</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Promote free, fair, and peaceful democratic processes</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Support lawful civic participation and accountability</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Build solidarity across the global Zimbabwean community</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Stay engaged through our programmes, share accurate information from our official channels, and invite others in the diaspora to take part. Our strength is citizens acting together.
              </p>

              <!-- Highlight Quote -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-left:4px solid #10b981;padding:16px 20px;background-color:#f0fdf4;border-radius:0 8px 8px 0;">
                    <p style="color:#0f172a;font-size:16px;font-weight:600;font-style:italic;margin:0;">
                      ${SITE_TAGLINE}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
                Your solidarity contribution of <strong style="color:#0f172a;">USD5 per month</strong> or <strong style="color:#0f172a;">USD60 per annum</strong> will help us reach as many of our compatriots at home.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${APP_URL}/membership-application" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
                      Apply for Membership &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 4px;">
                Warm regards,
              </p>
              <p style="color:#0f172a;font-size:15px;line-height:1.5;margin:0 0 2px;">
                <strong>Senator Jameson Zvidzai Timba</strong>
              </p>
              <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0 0 2px;">
                Convenor
              </p>
              <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
                ${APP_NAME}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 8px;">
                You're receiving this email because you signed up at
                <a href="${APP_URL}" style="color:#0f172a;text-decoration:underline;">${APP_URL.replace(/^https?:\/\//, '')}</a>
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
