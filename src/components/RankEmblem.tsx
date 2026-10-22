import React from 'react';
import { RankDefinition } from '../data/ranks';

interface RankEmblemProps {
  rank: RankDefinition;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export const RankEmblem: React.FC<RankEmblemProps> = ({
  rank,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg'
  };

  const pxMap = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  const dim = pxMap[size];

  // Original geometric SVG emblem based on rank tier and roman numeral
  const renderEmblemSvg = () => {
    switch (rank.tier) {
      case 'bronze':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-md">
            <defs>
              <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>
            {/* Bronze Shield */}
            <polygon points="50,6 88,24 76,82 50,96 24,82 12,24" fill="url(#bronzeGrad)" stroke="#f59e0b" strokeWidth="2.5" />
            <polygon points="50,15 80,30 70,74 50,86 30,74 20,30" fill="#78350f" opacity="0.6" />
            {/* Islamic 8-point star accent */}
            <rect x="42" y="42" width="16" height="16" fill="#fde68a" transform="rotate(45 50 50)" />
            <rect x="42" y="42" width="16" height="16" fill="#f59e0b" />
            <text x="50" y="55" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="13" fontFamily="sans-serif">
              {rank.roman}
            </text>
          </svg>
        );

      case 'silver':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-md">
            <defs>
              <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>
            {/* Silver Wings Shield */}
            <path d="M50,4 L90,20 L80,50 L50,96 L20,50 L10,20 Z" fill="url(#silverGrad)" stroke="#cbd5e1" strokeWidth="2.5" />
            <polygon points="50,16 78,30 70,52 50,84 30,52 22,30" fill="#1e293b" opacity="0.5" />
            <circle cx="50" cy="48" r="14" fill="#38bdf8" opacity="0.3" />
            <circle cx="50" cy="48" r="11" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="50" y="53" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="12" fontFamily="sans-serif">
              {rank.roman}
            </text>
          </svg>
        );

      case 'gold':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-lg glow-gold">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            {/* Golden Star Emblem */}
            <polygon points="50,2 62,28 92,28 68,48 78,76 50,60 22,76 32,48 8,28 38,28" fill="url(#goldGrad)" stroke="#fef9c3" strokeWidth="2" />
            <polygon points="50,14 59,34 81,34 63,48 70,68 50,54 30,68 37,48 19,34 41,34" fill="#713f12" opacity="0.75" />
            <circle cx="50" cy="44" r="13" fill="#facc15" stroke="#fef08a" strokeWidth="1.5" />
            <text x="50" y="49" textAnchor="middle" fill="#422006" fontWeight="900" fontSize="12" fontFamily="sans-serif">
              {rank.roman}
            </text>
          </svg>
        );

      case 'platinum':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-lg">
            <defs>
              <linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="50%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#164e63" />
              </linearGradient>
            </defs>
            {/* Platinum Hexagon */}
            <polygon points="50,3 93,26 93,74 50,97 7,74 7,26" fill="url(#platGrad)" stroke="#cffafe" strokeWidth="2.5" />
            <polygon points="50,14 83,32 83,68 50,86 17,68 17,32" fill="#0e7490" opacity="0.5" />
            <polygon points="50,26 73,38 73,62 50,74 27,62 27,38" fill="#155e75" stroke="#a5f3fc" strokeWidth="1.5" />
            <text x="50" y="55" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="13" fontFamily="sans-serif">
              {rank.roman}
            </text>
          </svg>
        );

      case 'diamond':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-xl glow-diamond">
            <defs>
              <linearGradient id="diaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="35%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
            </defs>
            {/* Crystal Diamond Facets */}
            <polygon points="50,2 88,34 50,98 12,34" fill="url(#diaGrad)" stroke="#bae6fd" strokeWidth="2.5" />
            <polygon points="50,2 72,34 50,56 28,34" fill="#bae6fd" opacity="0.6" />
            <polygon points="50,56 88,34 50,98" fill="#0369a1" opacity="0.7" />
            <polygon points="50,56 12,34 50,98" fill="#0284c7" opacity="0.5" />
            <circle cx="50" cy="46" r="12" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
            <text x="50" y="51" textAnchor="middle" fill="#e0f2fe" fontWeight="900" fontSize="11" fontFamily="sans-serif">
              {rank.roman}
            </text>
          </svg>
        );

      case 'heroic':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-xl glow-heroic">
            <defs>
              <linearGradient id="heroicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="30%" stopColor="#ef4444" />
                <stop offset="70%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>
            {/* Heroic Crest Flames */}
            <path d="M50,2 L70,22 L94,22 L82,54 L92,86 L50,98 L8,86 L18,54 L6,22 L30,22 Z" fill="url(#heroicGrad)" stroke="#fecaca" strokeWidth="2.5" />
            <polygon points="50,15 72,35 64,78 50,88 36,78 28,35" fill="#450a0a" opacity="0.6" />
            <path d="M50,28 L58,45 L76,45 L62,56 L67,73 L50,62 L33,73 L38,56 L24,45 L42,45 Z" fill="#fbbf24" stroke="#fef08a" strokeWidth="1" />
            <text x="50" y="56" textAnchor="middle" fill="#7f1d1d" fontWeight="900" fontSize="10" fontFamily="sans-serif">
              {rank.roman}
            </text>
          </svg>
        );

      case 'master':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-2xl glow-master">
            <defs>
              <linearGradient id="masterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f0abfc" />
                <stop offset="40%" stopColor="#a855f7" />
                <stop offset="75%" stopColor="#6b21a8" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
            </defs>
            {/* Islamic 8-Point Cosmic Star Master Crest */}
            <rect x="22" y="22" width="56" height="56" rx="6" fill="url(#masterGrad)" stroke="#e879f9" strokeWidth="2.5" transform="rotate(45 50 50)" />
            <rect x="22" y="22" width="56" height="56" rx="6" fill="url(#masterGrad)" stroke="#e879f9" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="18" fill="#2e1065" stroke="#f0abfc" strokeWidth="2" />
            <polygon points="50,38 53,46 62,47 55,53 58,61 50,56 42,61 45,53 38,47 47,46" fill="#facc15" />
            <text x="50" y="69" textAnchor="middle" fill="#f5d0fe" fontWeight="900" fontSize="9" fontFamily="sans-serif">
              {rank.roman}
            </text>
          </svg>
        );

      case 'grandmaster':
        return (
          <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-2xl glow-gold animate-pulse">
            <defs>
              <linearGradient id="gmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <radialGradient id="gmCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#78350f" />
              </radialGradient>
            </defs>
            {/* Grandmaster Imperial Crown + Quranic Star */}
            <path d="M50,0 L64,18 L88,10 L84,36 L100,50 L84,64 L88,90 L64,82 L50,100 L36,82 L12,90 L16,64 L0,50 L16,36 L12,10 L36,18 Z" fill="url(#gmGrad)" stroke="#fef08a" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="24" fill="url(#gmCore)" stroke="#ffffff" strokeWidth="2" />
            <path d="M40,43 L45,35 L50,42 L55,35 L60,43 L50,55 Z" fill="#451a03" />
            <circle cx="50" cy="51" r="5" fill="#fef08a" />
            <text x="50" y="64" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="10" fontFamily="sans-serif">
              GM
            </text>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div className={`relative flex items-center justify-center transition-transform hover:scale-110 duration-200`}>
        {renderEmblemSvg()}
      </div>
      {showLabel && (
        <span className={`mt-1 font-bold tracking-wide text-center ${rank.color} ${size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {rank.name}
        </span>
      )}
    </div>
  );
};
