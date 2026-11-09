export default function Logo() {
  return (
    <div className="group relative cursor-pointer">
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-75 blur transition duration-300 group-hover:opacity-100" />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/40 bg-slate-950 p-1.5 shadow-xl">
        <svg viewBox="0 0 64 64" fill="none" className="h-full w-full text-cyan-400" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="16" width="5" height="16" rx="2" fill="currentColor" />
          <rect x="12" y="19" width="3" height="10" rx="1" fill="currentColor" />
          <rect x="53" y="16" width="5" height="16" rx="2" fill="currentColor" />
          <rect x="49" y="19" width="3" height="10" rx="1" fill="currentColor" />
          <line x1="4" y1="24" x2="60" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="18" r="4.5" fill="currentColor" />
          <path d="M22 24 L27 19 L32 24 M42 24 L37 19 L32 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M25 28 C25 25, 39 25, 39 28 L37 36 L27 36 Z" fill="currentColor" />
          <rect x="20" y="36" width="24" height="4" rx="1" fill="#38bdf8" />
          <path d="M24 40 L24 48 M40 40 L40 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 48 L46 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}