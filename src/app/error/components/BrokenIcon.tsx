/** Simple cracked-circle mark — “something broke,” not a Heroicon clone. */
export function BrokenIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeDasharray="4 3.5"
        strokeLinecap="round"
      />
      <path
        d="M8.5 9.5 12 12l-2 4.5M15.5 9 12 12l3.5 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
