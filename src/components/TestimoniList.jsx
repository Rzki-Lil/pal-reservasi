import React from "react";

const testimonies = [
  {
    name: "Budi Santoso",
    role: "Warga Bogor Barat",
    text: "Pelayanan UPTD PAL sangat cepat dan profesional. Proses reservasi mudah dan petugas ramah.",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Siti Aminah",
    role: "Ibu Rumah Tangga",
    text: "Saya sangat puas dengan layanan pengolahan air limbah. Hasilnya bersih dan tidak bau.",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Andi Wijaya",
    role: "Pengusaha Kuliner",
    text: "Reservasi online sangat membantu usaha saya. Jadwal fleksibel dan harga terjangkau.",
    photo: "https://randomuser.me/api/portraits/men/65.jpg",
  },
    {
    name: "Budi Santoso",
    role: "Warga Bogor Barat",
    text: "Pelayanan UPTD PAL sangat cepat dan profesional. Proses reservasi mudah dan petugas ramah.",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Siti Aminah",
    role: "Ibu Rumah Tangga",
    text: "Saya sangat puas dengan layanan pengolahan air limbah. Hasilnya bersih dan tidak bau.",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Andi Wijaya",
    role: "Pengusaha Kuliner",
    text: "Reservasi online sangat membantu usaha saya. Jadwal fleksibel dan harga terjangkau.",
    photo: "https://randomuser.me/api/portraits/men/65.jpg",
  },
];

export default function TestimoniList() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Testimoni Pelanggan
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            Apa Kata Mereka?
          </h2>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Pengalaman pelanggan kami yang telah menggunakan layanan UPTD PAL
            Kota Bogor.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonies.map((t, idx) => (
            <div
              key={idx}
              className="card p-8 text-center card-hover flex flex-col items-center"
            >
              <img
                src={t.photo}
                alt={t.name}
                className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-primary-200"
                loading="lazy"
              />
              <p className="text-secondary-700 italic mb-4">
                &quot;{t.text}&quot;
              </p>
              <div>
                <div className="font-semibold text-secondary-900">{t.name}</div>
                <div className="text-sm text-secondary-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
