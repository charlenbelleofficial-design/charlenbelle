// app/components/HeroSection.tsx
import Image from "next/image";
import Link from "next/link";

export const HeroSection: React.FC = () => {
  return (
    <section className="hero">
      <div className="hero-inner">
        {/* Left content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Wujudkan Pesona Alami
            <br />
            dengan Perawatan
            <br />
            Estetika Terbaik
          </h1>

          <div className="hero-quote">
            <span className="hero-quote-mark">&ldquo;</span>
            <p className="hero-text">
              Klinik kecantikan modern dengan sentuhan elegan dan perawatan
              profesional untuk semua jenis kulit.
            </p>
          </div>

          <Link href="/user/treatments" className="btn btn-primary hero-btn">
            Book Now
          </Link>
        </div>

        {/* Right image */}
        <div className="hero-image-wrapper">
          <Image
            src="/hero-model.png"
            alt="Perawatan wajah di klinik kecantikan"
            fill
            priority
            className="hero-image"
          />
        </div>
      </div>
    </section>
  );
};
