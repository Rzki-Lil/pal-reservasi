import { Link } from "react-router-dom";
import TestimoniList from "../components/TestimoniList";
import { useAuth } from "../contexts/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-soft border-b border-secondary-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.781 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900">
                  UPTD PAL
                </h1>
                <p className="text-xs text-secondary-600">Kota Bogor</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary text-sm">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-secondary-600 hover:text-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Masuk
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Layanan Pengelolaan Air Limbah Terdepan
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-secondary-900 mb-6 leading-tight">
                Sistem Reservasi{" "}
                <span className="text-gradient">Pengelolaan Air Limbah</span>{" "}
                Kota Bogor
              </h1>

              <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
                Layanan reservasi pengolahan air limbah yang profesional,
                modern, dan terpercaya untuk menjaga kebersihan lingkungan Kota
                Bogor yang berkelanjutan.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="btn-primary text-base px-8 py-3 inline-flex items-center justify-center group"
                >
                  Buat Reservasi
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>

                <Link
                  to="/login"
                  className="btn-secondary text-base px-8 py-3 inline-flex items-center justify-center"
                >
                  Masuk ke Akun
                </Link>
              </div>
            </div>

            <div className="relative animate-slide-up">
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 shadow-large">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-warning-400 rounded-full opacity-20" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-success-400 rounded-full opacity-20" />

                <div className="relative text-white">
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold">1000+</div>
                      <div className="text-primary-100 text-sm">
                        Pelanggan Aktif
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">100%</div>
                      <div className="text-primary-100 text-sm">Kepuasan</div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Sistem Terintegrasi</div>
                        <div className="text-primary-100 text-sm">
                          Monitoring real-time
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Keunggulan Layanan
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              Mengapa Memilih UPTD PAL?
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Kami menyediakan layanan pengolahan air limbah yang profesional
              dengan teknologi modern dan sistem reservasi yang mudah digunakan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Layanan 24/7
              </h3>
              <p className="text-secondary-600">
                Sistem reservasi tersedia 24 jam dengan respons cepat untuk
                kebutuhan mendesak.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Teknologi Modern
              </h3>
              <p className="text-secondary-600">
                Menggunakan teknologi pengolahan air limbah terdepan dengan
                standar lingkungan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Jangkauan Luas
              </h3>
              <p className="text-secondary-600">
                Melayani seluruh wilayah Kota Bogor maupun Kabupaten Bogor
                dengan tim profesional berpengalaman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimoni Section */}
      <TestimoniList />

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">15+</div>
              <div className="text-primary-100">Tahun Pengalaman</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">20K+</div>
              <div className="text-primary-100">Liter per Hari</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-primary-100">Pelanggan</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-primary-100">Uptime Sistem</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-6">
            Siap Untuk Layanan Terbaik?
          </h2>
          <p className="text-lg text-secondary-600 mb-8">
            Bergabunglah dengan ribuan pelanggan yang telah mempercayai layanan
            pengolahan air limbah UPTD PAL Kota Bogor.
          </p>
          <Link
            to="/register"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center group"
          >
            Mulai Sekarang
            <svg
              className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.781 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-secondary-400 text-lg font-semibold">
                    UPTD PAL
                  </h3>
                  <p className="text-secondary-400 text-sm">Kota Bogor</p>
                </div>
              </div>
              <p className="text-secondary-400">
                Unit Pelaksana Teknis Daerah Pengelolaan Air Limbah Kota Bogor,
                melayani dengan profesional dan teknologi modern.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <div className="space-y-2 text-secondary-400">
                <p>
                  Jl. Achmad Adnawijaya Blk B1 No. 11, Bantarjati, Bogor
                  Utara,Kota Bogor , Jawa Barat
                </p>
                <p>Telepon: (0251) 8373454</p>
                <p>Email: uptdpal@gmail.com</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Jam Operasional</h4>
              <div className="space-y-2 text-secondary-400">
                <p>Senin - Kamis: 08:00 - 16:00</p>
                <p>Jum'at: 08:00 - 16:30</p>
                <p>Sabtu - Minggu: Tutup</p>
              </div>
            </div>
          </div>

          <div className="border-t border-secondary-800 mt-8 pt-8 text-center">
            <p className="text-secondary-400">
              © 2024 UPTD PAL Kota Bogor. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
