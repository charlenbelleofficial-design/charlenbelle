// app/components/ui/AboutSection.tsx
export const AboutSection: React.FC = () => {
  return (
    <section
      id="tentang-kami"
      className="relative overflow-hidden border-t border-[#d4b896]/30 bg-gradient-to-br from-white via-[#fdf7f2] to-[#f5ede4] py-20 sm:py-24"
    >
      {/* Decorative glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/4 h-96 w-96 rounded-full bg-[#d4b896]/20 blur-[120px]" />
        <div className="absolute right-0 bottom-1/4 h-80 w-80 rounded-full bg-[#c9b591]/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9b591]/30 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.20em] text-[#c9b591] shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9b591]" />
            Tentang Kami
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#3d2e1f] sm:text-4xl">
            Klinik kecantikan dengan pendekatan
            <span className="block bg-gradient-to-r from-[#c9b591] via-[#d4b896] to-[#c9b591] bg-clip-text text-transparent">
              personal & hasil natural
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#6b5d4f] sm:text-base">
            Charlene Belle Aesthetic menghadirkan rangkaian perawatan wajah dan
            tubuh berbasis medis dengan standar keamanan tinggi, didampingi tim
            profesional yang siap membantu menemukan versi terbaik dari diri
            Anda.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#c9b591]/20 bg-gradient-to-br from-white via-[#fdf7f2]/50 to-white p-6 shadow-lg shadow-[#c9b591]/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#c9b591]/15">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#d4b896]/20 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150" />
            <div className="relative">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9b591] to-[#b8a582] shadow-lg shadow-[#c9b591]/30">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-bold text-[#3d2e1f]">
                Tim Profesional
              </h3>
              <p className="text-xs leading-relaxed text-[#6b5d4f] sm:text-sm">
                Dokter estetika dan terapis tersertifikasi yang berpengalaman di
                bidangnya
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#c9b591]/20 bg-gradient-to-br from-white via-[#f5ede4]/30 to-white p-6 shadow-lg shadow-[#c9b591]/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#c9b591]/15">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#c9b591]/30 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150" />
            <div className="relative">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b8a582] to-[#c9b591] shadow-lg shadow-[#c9b591]/30">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-bold text-[#3d2e1f]">
                Teknologi Terkini
              </h3>
              <p className="text-xs leading-relaxed text-[#6b5d4f] sm:text-sm">
                Menggunakan peralatan modern untuk hasil lebih optimal dan nyaman
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#c9b591]/20 bg-gradient-to-br from-white via-[#fdf7f2]/40 to-white p-6 shadow-lg shadow-[#c9b591]/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#c9b591]/15">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#d4b896]/30 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150" />
            <div className="relative">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9b591] to-[#b8a582] shadow-lg shadow-[#c9b591]/30">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-bold text-[#3d2e1f]">
                Lingkungan Nyaman
              </h3>
              <p className="text-xs leading-relaxed text-[#6b5d4f] sm:text-sm">
                Suasana klinik yang tenang, hangat, dan higienis untuk kenyamanan Anda
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#c9b591]/20 bg-gradient-to-br from-white via-[#f5ede4]/50 to-white p-6 shadow-lg shadow-[#c9b591]/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#c9b591]/15">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#c9b591]/20 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150" />
            <div className="relative">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b8a582] to-[#c9b591] shadow-lg shadow-[#c9b591]/30">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-bold text-[#3d2e1f]">
                Konsultasi Personal
              </h3>
              <p className="text-xs leading-relaxed text-[#6b5d4f] sm:text-sm">
                Rencana perawatan disesuaikan dengan kebutuhan kulit Anda
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <a
            href="#layanan"
            className="inline-flex items-center gap-2 rounded-full border border-[#c9b591]/30 bg-white/80 px-6 py-3 text-sm font-semibold text-[#3d2e1f] shadow-lg shadow-[#c9b591]/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#c9b591]/20"
          >
            Jelajahi Layanan Kami
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};