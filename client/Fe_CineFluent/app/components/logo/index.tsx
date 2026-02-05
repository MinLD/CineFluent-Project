import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2">
      <span className="font-pacifico text-2xl sm:text-4xl text-blue-500 drop-shadow-[0_2px_2px_rgba(59,130,246,0.6)] transition-all group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
        Cinefluent
      </span>
    </Link>
  );
}
