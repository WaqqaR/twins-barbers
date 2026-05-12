import { useState } from 'react';

// An <img> that degrades to a styled placeholder when the file is missing.
// Lets the whole site look intentional before real photos are dropped into
// /public/images.
export default function Img({ src, alt = '', className = '', imgClassName = '', label, ...rest }) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-charcoal text-cream/40 ${className}`}
        role="img"
        aria-label={alt}
        {...rest}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(200,160,78,0.10) 0 14px, transparent 14px 28px)',
          }}
        />
        <div className="relative flex flex-col items-center gap-2 px-4 text-center">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold/60" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M21 17l-5-5L5 21" />
          </svg>
          <span className="text-[11px] uppercase tracking-widest">{label || alt || 'Photo'}</span>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} ${imgClassName}`.trim()}
      {...rest}
    />
  );
}
