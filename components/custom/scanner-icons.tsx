interface IconProps {
  size?: number
  className?: string
}

export function EinzugIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Paper sheet */}
      <rect x="6" y="1" width="12" height="11" rx="1" />
      {/* Text lines on paper */}
      <line x1="9" y1="4.5" x2="15" y2="4.5" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="9.5" x2="13" y2="9.5" />
      {/* Arrow from paper into feeder */}
      <path d="M12 12 L12 14.5" />
      <path d="M10 13.5 L12 15.5 L14 13.5" />
      {/* Feeder body */}
      <rect x="1" y="15.5" width="22" height="5" rx="1.5" />
      {/* Roller hints */}
      <circle cx="5" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function GlasIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Document sitting on top of the glass */}
      <rect x="4" y="1.5" width="16" height="8" rx="1" />
      {/* Text lines on document */}
      <line x1="7" y1="4.5" x2="17" y2="4.5" />
      <line x1="7" y1="6.5" x2="14" y2="6.5" />
      {/* Glass plate — thick dividing line */}
      <line x1="1.5" y1="10" x2="22.5" y2="10" strokeWidth={2.5} />
      {/* Scanner body */}
      <rect x="1.5" y="11" width="21" height="11.5" rx="1.5" />
      {/* Scan bar (filled rect, the light element) */}
      <rect x="6" y="12.5" width="2" height="8.5" rx="0.75" fill="currentColor" stroke="none" />
      {/* Scan light trail extending right */}
      <line x1="8" y1="16.75" x2="20" y2="16.75" strokeWidth={0.75} strokeDasharray="1.5 2" />
    </svg>
  )
}
