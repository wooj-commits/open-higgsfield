export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className="ohf-brand-mark"
    >
      <rect width="32" height="32" rx="8" fill="#151719" />
      <g fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 6.5H8.9A2.4 2.4 0 0 0 6.5 8.9V17" stroke="#d1fe17" />
        <path d="M12.5 25.5H23.1a2.4 2.4 0 0 0 2.4-2.4V15" stroke="#c2c9c8" />
      </g>
    </svg>
  );
}
