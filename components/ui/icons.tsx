type IconProps = { className?: string; filled?: boolean };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} width="24" height="24">
      <rect x="3" y="5" width="18" height="16" rx="4" />
      <path d="M3 9.5h18" />
      <path d="M8 3v3M16 3v3" />
      <circle cx="8.5" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FriendsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} width="24" height="24">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.9" />
      <path d="M17 14.2c2.3.4 4 2.3 4 4.8" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} width="24" height="24">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="M8 12.2l2.6 2.6L16.2 9" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} width="24" height="24">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}
