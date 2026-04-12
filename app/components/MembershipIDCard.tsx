'use client'

import { useRef } from 'react'

interface MembershipIDCardProps {
  memberName: string
  membershipNumber: string
  province?: string
  dateJoined: string
  expiryDate: string
  photoURL?: string
  memberEmail?: string
}

export default function MembershipIDCard({
  memberName,
  membershipNumber,
  province,
  dateJoined,
  expiryDate,
  photoURL,
  memberEmail,
}: MembershipIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = cardRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print your membership card.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Diaspora Vote Membership Card - ${memberName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .card-wrapper {
            display: flex;
            flex-direction: column;
            gap: 24px;
            align-items: center;
          }
          .card {
            width: 400px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          }
          /* Front */
          .card-front {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: white;
            padding: 24px;
            position: relative;
          }
          .card-front::before {
            content: '';
            position: absolute;
            top: -40px;
            right: -40px;
            width: 160px;
            height: 160px;
            border-radius: 50%;
            background: rgba(255,255,255,0.04);
          }
          .card-front::after {
            content: '';
            position: absolute;
            bottom: -60px;
            left: -40px;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: rgba(255,255,255,0.03);
          }
          .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          .card-logo {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            object-fit: contain;
          }
          .card-org-name {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .card-org-sub {
            font-size: 10px;
            color: #94a3b8;
            letter-spacing: 0.5px;
          }
          .card-body {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            position: relative;
            z-index: 1;
          }
          .card-photo {
            width: 72px;
            height: 88px;
            border-radius: 8px;
            background: #475569;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
          }
          .card-photo-placeholder {
            width: 72px;
            height: 88px;
            border-radius: 8px;
            background: #475569;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
            color: #ffffff;
            font-weight: 700;
            font-size: 28px;
          }
          .card-info { flex: 1; }
          .card-name {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 4px;
            line-height: 1.2;
          }
          .card-number {
            font-size: 11px;
            color: #94a3b8;
            margin-bottom: 12px;
            font-family: monospace;
            letter-spacing: 1px;
          }
          .card-detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .card-detail-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
          }
          .card-detail-value {
            font-size: 11px;
            font-weight: 600;
          }
          .card-footer {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
          }
          .card-badge {
            font-size: 10px;
            font-weight: 700;
            background: rgba(16,185,129,0.2);
            color: #6ee7b7;
            padding: 3px 10px;
            border-radius: 99px;
            letter-spacing: 0.5px;
          }
          .card-id-text {
            font-size: 9px;
            color: #64748b;
          }

          /* Back */
          .card-back {
            background: #f8fafc;
            padding: 24px;
            color: #1e293b;
          }
          .card-back-header {
            text-align: center;
            margin-bottom: 16px;
          }
          .card-back-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #0f172a;
          }
          .card-back-subtitle {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .card-terms {
            font-size: 9px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 16px;
          }
          .card-terms li {
            margin-bottom: 4px;
            padding-left: 4px;
          }
          .card-back-footer {
            text-align: center;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
          }
          .card-back-footer p {
            font-size: 9px;
            color: #94a3b8;
          }
          .card-back-footer a {
            color: #0f172a;
            font-weight: 600;
            text-decoration: none;
          }

          @media print {
            body { background: white; }
            .card { box-shadow: none; border: 1px solid #e2e8f0; }
          }
        </style>
      </head>
      <body>
        <div class="card-wrapper">
          <!-- Front -->
          <div class="card">
            <div class="card-front">
              <div class="card-header">
                <img src="${window.location.origin}/images/logo.png" class="card-logo" alt="Diaspora Vote" />
                <div>
                  <div class="card-org-name">Diaspora Vote</div>
                  <div class="card-org-sub">Official Membership Card</div>
                </div>
              </div>
              <div class="card-body">
                <div class="card-photo-placeholder">${memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div class="card-info">
                  <div class="card-name">${memberName}</div>
                  <div class="card-number">${membershipNumber}</div>
                  <div class="card-detail-row">
                    <div>
                      <div class="card-detail-label">Member Since</div>
                      <div class="card-detail-value">${dateJoined}</div>
                    </div>
                    <div style="text-align:right">
                      <div class="card-detail-label">Valid Until</div>
                      <div class="card-detail-value">${expiryDate}</div>
                    </div>
                  </div>
                  ${province ? `
                  <div style="margin-top:4px">
                    <div class="card-detail-label">Province</div>
                    <div class="card-detail-value">${province}</div>
                  </div>` : ''}
                </div>
              </div>
              <div class="card-footer">
                <div class="card-badge">✓ ACTIVE MEMBER</div>
                <div class="card-id-text">diasporavote.org</div>
              </div>
            </div>
          </div>

          <!-- Back -->
          <div class="card">
            <div class="card-back">
              <div class="card-back-header">
                <div class="card-back-title">Diaspora Vote</div>
                <div class="card-back-subtitle">Membership Terms & Conditions</div>
              </div>
              <ol class="card-terms">
                <li>This card is the property of the Diaspora Vote (DV).</li>
                <li>The holder is a registered member committed to defending constitutional supremacy.</li>
                <li>This card is non-transferable and must be presented upon request at Diaspora Vote events.</li>
                <li>Membership is valid for one year from the date of issue and subject to renewal.</li>
                <li>Lost or damaged cards should be reported to Diaspora Vote administration immediately.</li>
              </ol>
              <div class="card-back-footer">
                <p>&ldquo;Think Local, go global!&rdquo;</p>
                <p style="margin-top:8px"><a href="https://diasporavote.org">diasporavote.org</a></p>
                <p style="margin-top:4px">&copy; ${new Date().getFullYear()} DV. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  return (
    <div>
      {/* Card Preview */}
      <div ref={cardRef} className="mx-auto max-w-[420px]">
        {/* Front of Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-xl">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/[0.03]" />

          {/* Header */}
          <div className="relative z-10 mb-5 flex items-center gap-3">
            <img src="/images/logo.png" alt="Diaspora Vote" className="h-11 w-11 rounded-xl object-contain" />
            <div>
              <p className="text-sm font-bold tracking-wide">Diaspora Vote</p>
              <p className="text-[10px] tracking-wider text-slate-400">Official Membership Card</p>
            </div>
          </div>

          {/* Body */}
          <div className="relative z-10 flex gap-4">
            {/* Photo */}
            <div className="flex h-[88px] w-[72px] shrink-0 items-center justify-center rounded-lg border-2 border-white/20 bg-slate-600 text-2xl font-bold text-white">
              {memberName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="text-lg font-bold leading-tight">{memberName}</h3>
              <p className="mb-3 font-mono text-[11px] tracking-widest text-slate-400">{membershipNumber}</p>

              <div className="flex justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Member Since</p>
                  <p className="text-[11px] font-semibold">{dateJoined}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Valid Until</p>
                  <p className="text-[11px] font-semibold">{expiryDate}</p>
                </div>
              </div>
              {province && (
                <div className="mt-1">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Province</p>
                  <p className="text-[11px] font-semibold">{province}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-300">
              ✓ ACTIVE MEMBER
            </span>
            <span className="text-[9px] text-slate-500">diasporavote.org</span>
          </div>
        </div>

        {/* Back of Card */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-xl">
          <div className="mb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-900">Diaspora Vote</p>
            <p className="text-[10px] text-slate-500">Membership Terms & Conditions</p>
          </div>

          <ol className="mb-4 list-decimal space-y-1 pl-4 text-[9px] leading-relaxed text-slate-600">
            <li>This card is the property of the Diaspora Vote (DV).</li>
            <li>The holder is a registered member committed to defending constitutional supremacy.</li>
            <li>This card is non-transferable and must be presented upon request at Diaspora Vote events.</li>
            <li>Membership is valid for one year from the date of issue and subject to renewal.</li>
            <li>Lost or damaged cards should be reported to Diaspora Vote administration immediately.</li>
          </ol>

          <div className="border-t border-slate-200 pt-3 text-center">
            <p className="text-[9px] italic text-slate-500">&ldquo;Think Local, go global!&rdquo;</p>
            <p className="mt-2 text-[9px] font-semibold text-slate-700">diasporavote.org</p>
            <p className="text-[9px] text-slate-400">&copy; {new Date().getFullYear()} DV. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-auto mt-6 flex max-w-[420px] gap-3">
        <button
          onClick={handlePrint}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Print Card
        </button>
        <button
          onClick={() => {
            if (!cardRef.current) return
            const el = cardRef.current
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
          className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          title="Scroll to card"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
