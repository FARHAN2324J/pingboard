import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a8d43]">404 · Lost doodle</p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">This page wandered off.</h1>
      <p className="mt-4 max-w-md leading-7 text-[#74766d]">That board may not exist, or the link may be incomplete.</p>
      <Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-2xl bg-[#252820] px-5 font-semibold text-white transition hover:bg-[#414537]">
        Back to Pingboard
      </Link>
    </main>
  );
}
