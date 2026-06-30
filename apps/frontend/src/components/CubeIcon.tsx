export default function CubeIcon({ className = 'w-12 h-12' }: { className?: string }) {
  // Isometric cube — hexagonal silhouette vertices:
  //   Top(60,16)  TR(98,38)  BR(98,82)  Bot(60,104)  BL(22,82)  TL(22,38)  Center(60,60)
  return (
    <svg viewBox="0 0 120 122" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="tb-top" x1="60" y1="16" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#f8f5ff" />
          <stop offset="38%"  stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="tb-left" x1="22" y1="38" x2="44" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#170535" />
        </linearGradient>
        <linearGradient id="tb-right" x1="98" y1="38" x2="78" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#2e1065" />
          <stop offset="100%" stopColor="#030006" />
        </linearGradient>
        <linearGradient id="tb-sheen" x1="60" y1="16" x2="60" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tb-aura" cx="50%" cy="46%" r="46%">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <filter id="tb-halo" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="tb-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="tb-shad-wide" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="tb-shad-tight" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      <ellipse cx="60" cy="56" rx="52" ry="48" fill="url(#tb-aura)" />
      <ellipse cx="60" cy="118" rx="42" ry="8"
        fill="#5b21b6" opacity="0.24" filter="url(#tb-shad-wide)" />
      <ellipse cx="60" cy="115" rx="25" ry="4.5"
        fill="#7c3aed" opacity="0.45" filter="url(#tb-shad-tight)" />

      <polygon points="60,60 98,38 98,82 60,104" fill="url(#tb-right)" />
      <polygon points="22,38 60,60 60,104 22,82" fill="url(#tb-left)" />
      <polygon points="60,16 98,38 60,60 22,38" fill="url(#tb-top)" />
      <polygon points="60,16 98,38 60,60 22,38" fill="url(#tb-sheen)" />

      <line x1="22" y1="38" x2="22" y2="82"  stroke="#5b21b6" strokeWidth="0.75" strokeOpacity="0.55" />
      <line x1="22" y1="82" x2="60" y2="104" stroke="#4c1d95" strokeWidth="0.75" strokeOpacity="0.55" />
      <line x1="98" y1="38" x2="98" y2="82"  stroke="#2e1065" strokeWidth="0.75" strokeOpacity="0.5"  />
      <line x1="98" y1="82" x2="60" y2="104" stroke="#1e0a38" strokeWidth="0.75" strokeOpacity="0.5"  />
      <line x1="60" y1="60" x2="60" y2="104" stroke="#5b21b6" strokeWidth="0.6"  strokeOpacity="0.4"  />
      <line x1="22" y1="38" x2="60" y2="60"  stroke="#6d28d9" strokeWidth="0.6"  strokeOpacity="0.35" />
      <line x1="98" y1="38" x2="60" y2="60"  stroke="#3b0764" strokeWidth="0.6"  strokeOpacity="0.3"  />

      <line x1="60" y1="16" x2="22" y2="38"
        stroke="#a78bfa" strokeWidth="5" strokeOpacity="0.5" filter="url(#tb-halo)" />
      <line x1="60" y1="16" x2="22" y2="38"
        stroke="#ede9fe" strokeWidth="1.4" filter="url(#tb-glow)" />
      <line x1="60" y1="16" x2="98" y2="38"
        stroke="#7c3aed" strokeWidth="4" strokeOpacity="0.4" filter="url(#tb-halo)" />
      <line x1="60" y1="16" x2="98" y2="38"
        stroke="#ddd6fe" strokeWidth="1.1" filter="url(#tb-glow)" />

      <circle cx="60" cy="16" r="4.5" fill="#c4b5fd" filter="url(#tb-halo)" />
      <circle cx="60" cy="16" r="2"   fill="#ffffff"  filter="url(#tb-glow)" />
    </svg>
  )
}
