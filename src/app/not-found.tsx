export default function NotFound() {
  return (
    <div className="iv-shell py-12">
      <h1 style={{ fontFamily: "var(--font-poppins), sans-serif" }} className="text-3xl font-bold text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 text-slate-600">The requested page does not exist.</p>
    </div>
  );
}