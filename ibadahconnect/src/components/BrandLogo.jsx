/* BrandLogo — THE single logo for the whole app (navbar, auth pages, footer).
   Design: original IbadahConnect golden star + mosque mark.
   Props:
     variant: 'dark'  -> for white/light backgrounds (navbar)
     variant: 'light' -> for dark green backgrounds (auth pages, footer)
     size: 'sm' | 'md' | 'lg'
*/

const SIZES = {
  sm: { mark: 'w-9 h-9', text: 'text-lg', gap: 'gap-2' },
  md: { mark: 'w-11 h-11', text: 'text-xl', gap: 'gap-2.5' },
  lg: { mark: 'w-14 h-14', text: 'text-2xl sm:text-3xl', gap: 'gap-3' },
};

const StarMark = ({ light }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
    <polygon
      points="50,5 61,35 95,35 68,55 79,90 50,70 21,90 32,55 5,35 39,35"
      fill={light ? '#F7F4EC' : '#1B5E20'}
      stroke="#D4AF37"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <path d="M35 70 Q50 35 65 70 Z" fill="#D4AF37" />
    <rect x="35" y="65" width="30" height="10" fill="#D4AF37" />
    <rect x="25" y="50" width="6" height="25" fill="#D4AF37" />
    <circle cx="28" cy="48" r="4" fill="#D4AF37" />
    <rect x="69" y="50" width="6" height="25" fill="#D4AF37" />
    <circle cx="72" cy="48" r="4" fill="#D4AF37" />
  </svg>
);

export default function BrandLogo({ variant = 'dark', size = 'md' }) {
  const s = SIZES[size] || SIZES.md;
  const light = variant === 'light';
  return (
    <span className={`inline-flex items-center ${s.gap} select-none`}>
      <span className={`${s.mark} shrink-0`}>
        <StarMark light={light} />
      </span>
      <span
        className={`${s.text} font-bold tracking-wide leading-none`}
        style={{ fontFamily: "'Amiri', Georgia, serif" }}
      >
        <span className={light ? 'text-white' : 'text-[#1B5E20]'}>Ibadah</span>
        <span className="text-[#D4AF37]">Connect</span>
      </span>
    </span>
  );
}