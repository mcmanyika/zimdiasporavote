import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'DCP <onboarding@resend.dev>'
const APP_NAME = 'Defend the Constitution Platform'
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dcpzim.com'

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
}: {
  to: string
  name: string
  subject: string
  body: string
  htmlBody?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: buildCustomEmailHtml({ name, subject, body, htmlBody }),
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
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <img src="${APP_URL}/images/logo.png" alt="DCP Logo" width="60" height="60" style="border-radius:8px;" />
              <h1 style="color:#ffffff;font-size:22px;margin:16px 0 0;font-weight:700;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Dear <strong style="color:#0f172a;">${name}</strong>,
              </p>
              <div style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
                ${renderedBody}
              </div>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 4px;">
                Warm regards,
              </p>
              <p style="color:#0f172a;font-size:15px;line-height:1.5;margin:0 0 2px;">
                <strong>P. Manyika</strong>
              </p>
              <p style="color:#0f172a;font-size:15px;line-height:1.5;margin:0 0 2px;">
                <strong>Defend the Constitution Platform</strong>
              </p>
              <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
                <a href="${APP_URL}" style="color:#0f172a;text-decoration:underline;">www.dcpzim.com</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
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
  <title>Welcome to DCP</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <img src="${APP_URL}/images/logo.png" alt="DCP Logo" width="60" height="60" style="border-radius:8px;" />
              <h1 style="color:#ffffff;font-size:22px;margin:16px 0 0;font-weight:700;">
                Defend the Constitution Platform
              </h1>
              <p style="color:#94a3b8;font-size:13px;margin:6px 0 0;">
                "Defending the Constitution is Defending Our Future"
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
                Thank you for joining the <strong>Defend the Constitution Platform (DCP)</strong>.
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                By choosing to become part of this Platform, you have joined a community of citizens committed to a simple but profound principle: <strong style="color:#0f172a;">Zimbabwe must be governed according to its Constitution.</strong>
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                The DCP is a non-partisan, citizen-anchored constitutional movement. We do not exist to compete for political office, but to protect the rules that make democratic politics possible. Our work is guided by the People&rsquo;s Resolution &mdash; the shared commitment that constitutional legitimacy, popular sovereignty, and the rule of law must remain the foundation of our national life.
              </p>

              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px;">
                Your membership strengthens a collective effort to:
              </p>

              <!-- Bullet Points -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Defend constitutional term limits and democratic safeguards</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Promote full implementation of the Constitution</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Support lawful civic participation and public accountability</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;color:#10b981;font-size:16px;">&#8226;</td>
                        <td style="color:#334155;font-size:14px;line-height:1.6;">Build a culture of constitutionalism across society</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                We encourage you to stay engaged, participate in programmes and dialogues in your community, and share accurate information from our official platforms. The strength of this movement lies not in personalities, but in citizens acting together in defence of a common national covenant.
              </p>

              <!-- Highlight Quote -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-left:4px solid #10b981;padding:16px 20px;background-color:#f0fdf4;border-radius:0 8px 8px 0;">
                    <p style="color:#0f172a;font-size:16px;font-weight:600;font-style:italic;margin:0;">
                      Defending the Constitution is defending our future.
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
                Defend the Constitution Platform (DCP)
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f5f9;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 8px;">
                You're receiving this email because you signed up at
                <a href="${APP_URL}" style="color:#0f172a;text-decoration:underline;">${APP_URL.replace('https://', '')}</a>
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
