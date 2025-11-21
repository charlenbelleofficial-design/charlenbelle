// app/components/ui/ServicesSection.tsx
"use client";

import { useEffect, useState } from "react";

type Category = {
  _id: string;
  name: string;
  description?: string;
};

export const ServicesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Category | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/treatment-categories", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal memuat layanan");
        const data = await res.json();
        setCategories(data.categories ?? []);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat layanan. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setError(null);
      const res = await fetch(`/api/treatment-categories/${id}`);
      if (!res.ok) throw new Error("Gagal memuat detail layanan");
      const data = await res.json();
      setSelected(data.category);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat detail layanan.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section
      id="layanan"
      className="relative overflow-hidden border-t border-[#d4b896]/30 bg-gradient-to-br from-[#f5ede4] via-white to-[#fdf7f2] py-20 sm:py-24"
    >
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-20 h-[500px] w-[500px] rounded-full bg-[#d4b896]/20 blur-[150px]" />
        <div className="absolute left-0 bottom-20 h-96 w-96 rounded-full bg-[#c9b591]/25 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9b591]/30 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.20em] text-[#c9b591] shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9b591]" />
            Layanan Kami
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#3d2e1f] sm:text-4xl">
            Pilih perawatan sesuai
            <span className="block bg-gradient-to-r from-[#c9b591] via-[#d4b896] to-[#c9b591] bg-clip-text text-transparent">
              kebutuhan kulit Anda
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#6b5d4f] sm:text-base">
            Berbagai kategori treatment yang dirancang untuk membantu mengatasi
            masalah kulit dan meningkatkan kepercayaan diri Anda
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-3xl bg-gradient-to-br from-[#d4b896]/20 to-[#f5ede4]/30 animate-pulse"
              />
            ))}

          {!loading && error && (
            <div className="col-span-full rounded-3xl border border-red-200/50 bg-red-50/80 px-6 py-4 text-center text-sm text-red-600 shadow-lg backdrop-blur-sm">
              <svg className="mx-auto mb-2 h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            categories.map((cat, idx) => (
              <button
                key={cat._id}
                onClick={() => handleOpenDetail(cat._id)}
                className="group relative overflow-hidden rounded-3xl border border-[#c9b591]/20 bg-gradient-to-br from-white via-[#fdf7f2]/30 to-white p-6 text-left shadow-xl shadow-[#c9b591]/5 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#c9b591]/20"
                style={{
                  animationDelay: `${idx * 100}ms`,
                }}
              >
                {/* Glow effect on hover */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[#d4b896]/30 to-transparent opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-100" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9b591] to-[#b8a582] shadow-lg shadow-[#c9b591]/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>

                  {/* Badge */}
                  <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[#c9b591]">
                    <span className="h-1 w-1 rounded-full bg-[#c9b591]" />
                    Kategori Treatment
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-lg font-bold text-[#3d2e1f] transition-colors group-hover:text-[#c9b591]">
                    {cat.name}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-[#6b5d4f] sm:text-sm">
                    {cat.description || "Deskripsi singkat kategori treatment"}
                  </p>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[#c9b591] transition-transform group-hover:translate-x-1">
                    Lihat Detail
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>

                {/* Corner decoration */}
                <div className="absolute bottom-0 right-0 h-20 w-20 translate-x-8 translate-y-8 rounded-full bg-gradient-to-br from-[#c9b591]/10 to-transparent opacity-50 blur-2xl transition-all duration-500 group-hover:scale-150" />
              </button>
            ))}

          {!loading && !error && categories.length === 0 && (
            <div className="col-span-full rounded-3xl border border-[#d4b896]/30 bg-white/80 px-6 py-8 text-center shadow-lg backdrop-blur-sm">
              <svg className="mx-auto mb-3 h-12 w-12 text-[#d4b896]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm text-[#6b5d4f]">
                Belum ada kategori treatment yang tersedia saat ini
              </p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="mt-12 animate-fadeIn rounded-3xl border border-[#c9b591]/20 bg-gradient-to-br from-white via-[#fdf7f2]/50 to-white p-8 shadow-2xl shadow-[#c9b591]/10 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#c9b591]/30 bg-[#fdf7f2]/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c9b591]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9b591]" />
                  Detail Layanan
                </div>
                <h3 className="mb-4 text-2xl font-bold text-[#3d2e1f] sm:text-3xl">
                  {selected.name}
                </h3>
                <p className="leading-relaxed text-[#6b5d4f]">
                  {detailLoading
                    ? "Memuat detail layanan..."
                    : selected.description ||
                      "Deskripsi detail treatment akan ditampilkan di sini. Hubungi klinik untuk informasi lebih lanjut mengenai treatment ini."}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4b896]/30 bg-white/80 text-[#6b5d4f] shadow-md transition-all hover:bg-[#f5ede4]/50 hover:text-[#3d2e1f]"
                aria-label="Tutup detail"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};