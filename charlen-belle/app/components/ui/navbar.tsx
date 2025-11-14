// app/components/Navbar.tsx
import Link from "next/link";

export const Navbar: React.FC = () => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo">
          <div className="logo-circle">S</div>
          <span className="logo-text">Sharlene Aesthetic</span>
        </div>

        {/* Menu */}
        <nav className="navbar-menu">
          <Link href="#tentang-kami">Tentang Kami</Link>
          <Link href="#produk">Produk</Link>
          <Link href="#kontak">Kontak</Link>
        </nav>

        {/* CTA */}
        <div>
          <Link href="/booking" className="btn btn-primary">
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
};
