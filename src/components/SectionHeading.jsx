export default function SectionHeading({ eyebrow, title, intro, center = false, light = false }) {
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} max-w-2xl`}>
      {eyebrow && (
        <p className={`eyebrow flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
          {!center && <span className="h-px w-8 bg-gold/60" />}
          {eyebrow}
          {center && <span className="h-px w-8 bg-gold/60" />}
        </p>
      )}
      <h2 className={`mt-3 text-4xl sm:text-5xl ${light ? 'text-cream' : 'text-ink'}`}>{title}</h2>
      {intro && <p className={`mt-4 text-lg ${light ? 'text-cream/70' : 'text-ink/65'}`}>{intro}</p>}
    </div>
  );
}
