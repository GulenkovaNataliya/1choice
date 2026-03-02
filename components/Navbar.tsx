export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 z-20 w-full px-6 py-4">
      <a href="/" className="flex items-center">
        <div className="rounded-xl bg-white/85 px-3 py-2 backdrop-blur">
          <img
            src="/logo/logo-main.png"
            alt="1Choice"
            className="h-8 w-auto"
          />
        </div>
      </a>
    </nav>
  );
}
