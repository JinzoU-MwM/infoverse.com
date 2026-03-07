export function Hero({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return (
    <section className="iv-gradient-hero rounded-2xl p-6 md:p-8">
      {eyebrow ? <p className="mb-3 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">{eyebrow}</p> : null}
      <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-3xl font-bold leading-tight md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-100 md:text-base">{description}</p>
    </section>
  );
}
