export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 z-20 w-full">
      <div className="mx-auto flex h-28 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center">
          <img
            src="/logo/logo-main.png"
            alt="1Choice"
            className="w-[240px] h-auto"
          />
        </a>
      </div>
    </nav>
  );
}
