export function Marquee({ items }: { items: string[] }) {
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-border/70 bg-surface-1/60">
      <div className="marquee-track flex w-max items-center gap-8 py-3.5">
        {loop.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-8 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground"
          >
            {item}
            <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}
