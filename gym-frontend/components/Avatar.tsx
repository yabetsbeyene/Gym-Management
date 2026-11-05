export default function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const box = { width: size, height: size };

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} style={box} className="shrink-0 rounded-full object-cover" />
  ) : (
    <div style={{ ...box, fontSize: size / 2.6 }} className="flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
      {initials || "?"}
    </div>
  );
}