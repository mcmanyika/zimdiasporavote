/** Small Zimbabwe flag (2:3) — stripes, hoist triangle, red star */
export default function ZimbabweFlagIcon({ className }: { className?: string }) {
  const sh = 16 / 7
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="0" width="24" height={sh} fill="#1E9648" />
      <rect x="0" y={sh} width="24" height={sh} fill="#FFD200" />
      <rect x="0" y={sh * 2} width="24" height={sh} fill="#DE0100" />
      <rect x="0" y={sh * 3} width="24" height={sh} fill="#000000" />
      <rect x="0" y={sh * 4} width="24" height={sh} fill="#DE0100" />
      <rect x="0" y={sh * 5} width="24" height={sh} fill="#FFD200" />
      <rect x="0" y={sh * 6} width="24" height={16 - sh * 6} fill="#1E9648" />
      <polygon points="0,0 0,16 8,8" fill="#FFFFFF" />
      <path
        fill="#DE0100"
        transform="translate(4.15, 8)"
        d="M0 -1.1L0.247 -0.34L1.046 -0.34L0.4 0.13L0.647 0.89L0 0.42L-0.647 0.89L-0.4 0.13L-1.046 -0.34L-0.247 -0.34Z"
      />
    </svg>
  )
}
