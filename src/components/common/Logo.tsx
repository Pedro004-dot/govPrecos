/**
 * GovPreços logo components.
 *
 * LogoSymbol  — icon only (PNG). Use when collapsed.
 * LogoFull    — icon + wordmark. Use when expanded.
 *
 * Both accept a `className` for sizing and a `variant`:
 *   "sidebar"  — light palette for dark sidebar backgrounds (default)
 *   "light"    — dark palette for light content backgrounds
 */

interface LogoProps {
  className?: string;
  variant?: 'sidebar' | 'light';
}

/* ─── Symbol (icon only) ─────────────────────────────────────────── */
export function LogoSymbol({ className = 'h-10 w-10' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="GovPreços"
      className={className}
      style={{
        objectFit: 'contain',
        display: 'block',
        borderRadius: '10px',
      }}
    />
  );
}

/* ─── Full wordmark (icon + GOV + PREÇOS) ───────────────────────── */
export function LogoFull({ className = 'h-14', variant = 'sidebar' }: LogoProps) {
  const isLight = variant === 'light';

  const govColor    = isLight ? '#6EDB3F' : 'hsl(102 70% 55%)';
  const precosColor = isLight ? '#2F3640'  : 'hsl(220 18% 86%)';
  const tagColor    = isLight ? '#5A6A7A'  : 'hsl(220 15% 55%)';

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="GovPreços">
      {/* Icon badge */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="h-full w-auto object-contain shrink-0"
        style={{ borderRadius: '10px' }}
      />

      {/* Wordmark */}
      <div className="flex flex-col leading-tight">
        <span
          className="text-[17px] font-bold"
          style={{ color: govColor, letterSpacing: '-0.02em' }}
        >
          GOV
          <span style={{ color: precosColor, fontWeight: 400 }}>PREÇOS</span>
        </span>
        <span
          className="text-[7px] uppercase"
          style={{ color: tagColor, letterSpacing: '0.55em' }}
        >
          Pesquisa de Preços
        </span>
      </div>
    </div>
  );
}
