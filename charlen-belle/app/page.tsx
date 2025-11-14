import Link from 'next/link';
import { Button } from './components/ui/buttons';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Kecantikan Alami,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                Perawatan Profesional
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Wujudkan impian kecantikan Anda bersama tim profesional kami. 
              Booking sekarang dan dapatkan konsultasi gratis!
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/booking">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600">
                  Booking Sekarang
                </Button>
              </Link>
              <Link href="/treatments">
                <Button size="lg" variant="outline">
                  Lihat Layanan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Mengapa Memilih Kami?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Dokter Berpengalaman"
              description="Tim dokter dan terapis bersertifikat dengan pengalaman lebih dari 10 tahun"
              icon="👨‍⚕️"
            />
            <FeatureCard 
              title="Teknologi Modern"
              description="Menggunakan peralatan dan teknologi terkini untuk hasil optimal"
              icon="✨"
            />
            <FeatureCard 
              title="Harga Terjangkau"
              description="Berbagai paket dan promo menarik untuk semua kalangan"
              icon="💰"
            />
          </div>
        </div>
      </section>

      {/* Treatments Preview */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Layanan Kami
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <TreatmentCard 
              title="Facial Treatment"
              image="/images/facial.jpg"
              price="Mulai dari Rp 150.000"
            />
            <TreatmentCard 
              title="Laser Treatment"
              image="/images/laser.jpg"
              price="Mulai dari Rp 500.000"
            />
            <TreatmentCard 
              title="Chemical Peeling"
              image="/images/peeling.jpg"
              price="Mulai dari Rp 300.000"
            />
            <TreatmentCard 
              title="Anti-Aging"
              image="/images/antiaging.jpg"
              price="Mulai dari Rp 800.000"
            />
          </div>
          <div className="text-center mt-8">
            <Link href="/treatments">
              <Button variant="outline" size="lg">
                Lihat Semua Layanan →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Testimoni Pelanggan
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Sarah Wijaya"
              rating={5}
              text="Pelayanan sangat profesional dan hasilnya memuaskan! Pasti akan kembali lagi."
            />
            <TestimonialCard 
              name="Rina Kusuma"
              rating={5}
              text="Dokter dan staffnya ramah sekali. Tempatnya juga bersih dan nyaman."
            />
            <TestimonialCard 
              name="Maya Putri"
              rating={5}
              text="Harga terjangkau dengan kualitas premium. Highly recommended!"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Siap Memulai Perjalanan Kecantikan Anda?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Dapatkan konsultasi gratis dan penawaran khusus untuk pelanggan baru
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              Daftar Sekarang - Gratis!
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper Components
function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TreatmentCard({ title, image, price }: { title: string; image: string; price: string }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-pointer">
      <div className="h-48 bg-gradient-to-br from-pink-200 to-purple-200 relative">
        {/* Placeholder - ganti dengan Image component */}
        <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">
          {title}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>
        <p className="text-pink-600 font-semibold">{price}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ name, rating, text }: { name: string; rating: number; text: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-pink-50 p-6 rounded-2xl shadow-sm">
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-xl">★</span>
        ))}
      </div>
      <p className="text-gray-700 mb-4 italic">"{text}"</p>
      <p className="font-semibold text-gray-900">{name}</p>
    </div>
  );
}