// app/components/ui/HeroSection.tsx
import Image from "next/image";
import Link from "next/link";

export const HeroSection: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#f5ede4] pb-16 pt-24 sm:pb-24 sm:pt-32"
    >
      {/* Decorative Glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-[500px] w-[500px] rounded-full bg-[#d4b896]/20 blur-[140px]" />
        <div className="absolute right-[-120px] top-32 h-[600px] w-[600px] rounded-full bg-[#c9b591]/20 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Main Heading */}
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-[#3d2e1f] sm:text-5xl lg:text-6xl">
              Wujudkan Pesona Alami dengan Perawatan Estetika Terbaik
            </h1>

            {/* Quote/Description */}
            <div className="border-l-4 border-[#c9b591] pl-6">
              <p className="text-lg leading-relaxed text-[#6b5d4f] sm:text-xl">
                Klinik kecantikan modern dengan sentuhan elegan dan perawatan profesional untuk semua jenis kulit.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/user/login"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#c9b591] px-10 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#b8a582] hover:shadow-2xl"
              >
                <span>Book Now</span>
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative mx-auto lg:mx-0">
            {/* Main Image Card */}
            <div className="group relative z-10 mx-auto h-[500px] w-full max-w-[450px] overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-500 hover:shadow-3xl">
              <Image
                src="/images/masker.jpg"
                alt="Perawatan wajah di klinik kecantikan"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#3d2e1f]/20 via-transparent to-transparent" />
            </div>

            {/* Decorative Element */}
            <div className="absolute -right-8 -top-8 -z-10 h-64 w-64 rounded-full bg-[#c9b591]/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 -z-10 h-64 w-64 rounded-full bg-[#d4b896]/20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};