import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/90 px-6 py-4 text-white backdrop-blur-md md:px-8">
            <Link href="/" className="text-2xl font-semibold tracking-[0.25em] uppercase text-white">
                ClockHub
            </Link>

            <nav className="flex items-center gap-3 text-sm font-medium text-white/80">
                <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                    Inicio
                </Link>
                <Link href="/login" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                    Login
                </Link>
                <Link href="/register" className="rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-white/30 hover:bg-white/10">
                    Register
                </Link>
            </nav>
        </nav>
    );
}
