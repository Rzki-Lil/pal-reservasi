/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { kabupatenBogor } from "../utils/kabupatenBogor";

export default function BuatReservasi() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    service_id: "",
    location_id: "",
    service_date: "",
    notes: "",
    volume: 1,
    schedule_slot: "", 
  });
  const [services, setServices] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState({}); 
  const [loadingSlots, setLoadingSlots] = useState(false); 

  function detectKabupatenFromAddress(address) {
    if (!address) return false;
    const lowerAddr = address.toLowerCase();
    return kabupatenBogor.some((kec) => lowerAddr.includes(kec.toLowerCase()));
  }

  useEffect(() => {
    fetchServices();
    fetchUserLocations();
    fetchScheduleSlots();
  }, []);

  useEffect(() => {
    if (formData.service_date) {
      fetchSlotsAvailability(formData.service_date);
    }
  }, [formData.service_date]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true);

    if (!error) {
      setServices(data);
    }
  };

  const fetchUserLocations = async () => {
    const { data, error } = await supabase
      .from("user_locations")
      .select("*")
      .eq("user_id", user.id);

    if (!error) {
      setUserLocations(data);
    }
  };

  const fetchScheduleSlots = async () => {
    const { data, error } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });
    if (!error && data) {
      setScheduleSlots(data.map((s) => s.slot));
    }
  };

  const fetchSlotsAvailability = async (date) => {
    setLoadingSlots(true); 
    const status = {};
    await Promise.all(
      scheduleSlots.map(async (slot) => {
        try {
          const res = await fetch(
            `https://settled-modern-stinkbug.ngrok-free.app/api/reservations/availability?service_date=${encodeURIComponent(
              date
            )}&schedule_slot=${encodeURIComponent(slot)}`,
            {
              headers: {
                "ngrok-skip-browser-warning": "true",
              },
            }
          );
          const data = await res.json();
          status[slot] = data.available;
        } catch {
          status[slot] = true;
        }
      })
    );
    setSlotsStatus(status);
    if (formData.schedule_slot && status[formData.schedule_slot] === false) {
      setFormData((prev) => ({ ...prev, schedule_slot: "" }));
    }
    setLoadingSlots(false); 
  };

  const getTotalPrice = () => {
    if (!selectedService) return 0;
    const vol = parseInt(formData.volume, 10) || 1;
    const multiplier = Math.ceil(vol / 3);
    return selectedService.price * multiplier;
  };

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "location_id") {
      const selectedLoc = userLocations.find((loc) => loc.id === value);
      if (selectedLoc) {
        const isKabupaten = detectKabupatenFromAddress(selectedLoc.address);
        let autoService = null;
        if (isKabupaten) {
          autoService = services.find((s) =>
            s.name.toLowerCase().includes("kabu")
          );
        } else {
          autoService = services.find((s) =>
            s.name.toLowerCase().includes("kota")
          );
        }
        setFormData((prev) => ({
          ...prev,
          location_id: value,
          service_id: autoService ? autoService.id : prev.service_id,
        }));
        return;
      }
    }

    if (name === "service_date") {
      setFormData({
        ...formData,
        [name]: value,
        schedule_slot: "", 
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            user_id: user.id,
            service_id: formData.service_id,
            location_id: formData.location_id,
            service_date: formData.service_date,
            notes: formData.notes,
            volume: formData.volume,
            schedule_slot: formData.schedule_slot, 
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {

        const urlParts = data.redirect_url.split("/");
        const snapToken = urlParts[urlParts.length - 1];
        if (window.snap && snapToken) {
          window.snap.pay(snapToken, {
            onSuccess: function (result) {
              navigate("/riwayat");
            },
            onPending: function (result) {
              navigate("/riwayat");
            },
            onError: function (result) {
              setError("Pembayaran gagal. Silakan coba lagi.");
            },
            onClose: function () {
              navigate("/riwayat");
            },
          });
        } else {
          window.location.href = data.redirect_url;
        }
      } else {
        setError(data.error || "Gagal membuat reservasi");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat membuat reservasi");
    }

    setLoading(false);
  };

  const selectedService = services.find((s) => s.id === formData.service_id);

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Buat Reservasi Baru
          </h1>
          <p className="text-secondary-600 mt-1">
            Buat reservasi layanan pengolahan air limbah dengan mudah
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 animate-slide-down">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-danger-600 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-danger-800">
                          Gagal Membuat Reservasi
                        </h3>
                        <p className="text-sm text-danger-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location - Paling atas */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Lokasi *
                  </label>
                  <select
                    name="location_id"
                    required
                    className="input-primary pr-10 appearance-none"
                    value={formData.location_id}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Lokasi</option>
                    {userLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.label} - {location.address}
                      </option>
                    ))}
                  </select>
                  {userLocations.length === 0 && (
                    <p className="mt-1 text-sm text-danger-600">
                      Anda belum memiliki lokasi tersimpan.{" "}
                      <Link
                        to="/profile"
                        className="text-primary-600 underline hover:text-primary-800"
                      >
                        Tambah lokasi terlebih dahulu.
                      </Link>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Jenis Layanan
                  </label>
                  <div className="bg-secondary-100 rounded-lg px-4 py-3 border border-secondary-200">
                    <div className="font-semibold text-secondary-900">
                      {selectedService
                        ? selectedService.name
                        : "Pilih lokasi terlebih dahulu"}
                    </div>
                    {selectedService && (
                      <div className="text-sm text-secondary-600">
                        Rp {selectedService.price?.toLocaleString()}{" "}
                        {selectedService.unit}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-secondary-500 mt-2">
                    Jenis layanan dipilih otomatis berdasarkan alamat lokasi
                    Anda.
                  </div>
                  <input
                    type="hidden"
                    name="service_id"
                    value={formData.service_id}
                  />
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Volume (m³) *
                  </label>
                  <input
                    name="volume"
                    type="number"
                    min={1}
                    required
                    className="input-primary"
                    value={formData.volume}
                    onChange={handleChange}
                  />
                </div>

                {/* Service Date */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Tanggal Layanan *
                  </label>
                  <input
                    name="service_date"
                    type="date"
                    required
                    className="input-primary"
                    value={formData.service_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {/* Schedule Slot */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Pilih Slot Waktu *
                  </label>

                  {/* Loading indicator */}
                  {loadingSlots && formData.service_date && (
                    <div className="flex items-center justify-center py-8 mb-4">
                      <span className="text-sm text-primary-600">
                        Mengecek ketersediaan slot...
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {scheduleSlots.map((slot) => {
                      const isBooked = slotsStatus[slot] === false;
                      const isDisabled =
                        isBooked || !formData.service_date || loadingSlots;
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`px-3 py-2 rounded-lg border font-medium transition-all duration-200 ${
                            formData.schedule_slot === slot
                              ? "bg-primary-600 text-white border-primary-600"
                              : isDisabled
                              ? "bg-secondary-200 text-secondary-400 border-secondary-300 cursor-not-allowed"
                              : "bg-white text-secondary-900 border-secondary-200 hover:bg-primary-50 hover:border-primary-300"
                          }`}
                          disabled={isDisabled}
                          onClick={() =>
                            !isDisabled &&
                            setFormData((prev) => ({
                              ...prev,
                              schedule_slot: slot,
                            }))
                          }
                          title={
                            loadingSlots
                              ? "Sedang mengecek ketersediaan..."
                              : !formData.service_date
                              ? "Isi tanggal layanan terlebih dahulu"
                              : isBooked
                              ? "Sudah di-booking"
                              : "Klik untuk memilih slot ini"
                          }
                        >
                          {/* Hapus animasi spinner, tampilkan slot biasa */}
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  {!loadingSlots && !formData.schedule_slot && (
                    <p className="text-xs text-secondary-500 mt-2">
                      {!formData.service_date
                        ? "Pilih tanggal layanan terlebih dahulu untuk melihat slot yang tersedia."
                        : formData.service_date &&
                          scheduleSlots.length > 0 &&
                          scheduleSlots.every(
                            (slot) => slotsStatus[slot] === false
                          )
                        ? `Maaf, semua slot sudah terisi pada tanggal ${new Date(
                            formData.service_date
                          ).toLocaleDateString(
                            "id-ID"
                          )}. Silakan pilih tanggal lain.`
                        : "Pilih slot waktu yang tersedia."}
                    </p>
                  )}

                  {loadingSlots && formData.service_date && (
                    <p className="text-xs text-primary-600 mt-2">
                      Mohon tunggu, sedang mengecek ketersediaan slot untuk
                      tanggal{" "}
                      {new Date(formData.service_date).toLocaleDateString(
                        "id-ID"
                      )}
                      ...
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    className="input-primary resize-none"
                    placeholder="Catatan khusus untuk reservasi ini (kondisi lokasi, akses jalan, dll)"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="btn-secondary flex-1 sm:flex-none order-2 sm:order-1"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      loadingSlots ||
                      userLocations.length === 0 ||
                      !formData.service_id ||
                      !formData.location_id ||
                      !formData.service_date ||
                      !formData.volume ||
                      !formData.schedule_slot
                    }
                    className={`btn-primary flex-1 sm:flex-none order-1 sm:order-2 ${
                      loading ||
                      loadingSlots ||
                      userLocations.length === 0 ||
                      !formData.service_id ||
                      !formData.location_id ||
                      !formData.service_date ||
                      !formData.volume ||
                      !formData.schedule_slot
                        ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed hover:bg-gray-300"
                        : ""
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Membuat Reservasi...
                      </div>
                    ) : loadingSlots ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Mengecek Slot...
                      </div>
                    ) : (
                      "Buat Reservasi & Bayar"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="card p-8 w-full lg:w-96 mx-auto sticky top-8">
              {" "}
              {/* Perlebar card dan padding */}
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Ringkasan Reservasi
              </h3>
              <div className="space-y-4">
                {formData.service_id && selectedService && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Layanan:</span>
                    <span className="font-medium text-secondary-900">
                      {selectedService.name}
                    </span>
                  </div>
                )}
                {formData.volume && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Volume:</span>
                    <span className="font-medium text-secondary-900">
                      {formData.volume} m³
                    </span>
                  </div>
                )}
                {formData.service_date && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Tanggal:</span>
                    <span className="font-medium text-secondary-900">
                      {new Date(formData.service_date).toLocaleDateString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                )}
                {formData.schedule_slot && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Slot Waktu:</span>
                    <span className="font-medium text-secondary-900">
                      {formData.schedule_slot}
                    </span>
                  </div>
                )}

                {selectedService && (
                  <div className="border-t border-secondary-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-secondary-900">
                        Total Biaya:
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        Rp {getTotalPrice().toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-primary-50 rounded-lg p-4 mt-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-primary-800">
                      <p className="font-medium mb-1">Informasi Pembayaran:</p>
                      <ul className="space-y-1 text-primary-700">
                        <li>• Pembayaran melalui Midtrans</li>
                        <li>• Mendukung berbagai metode pembayaran</li>
                        <li>• Konfirmasi otomatis setelah pembayaran</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Tambahkan info kartu Midtrans sandbox */}
                <div className="bg-secondary-50 rounded-lg p-4 mt-4 border border-secondary-200">
                  <div className="mb-2 font-semibold text-secondary-900">
                    <span>💳 Kartu Percobaan Midtrans (Sandbox)</span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <div>
                      <span className="font-medium">Card Number:</span>{" "}
                      <span
                        style={{ userSelect: "all", cursor: "pointer" }}
                        onClick={() =>
                          navigator.clipboard.writeText("4811 1111 1111 1114")
                        }
                        className="bg-white px-2 py-1 rounded border border-secondary-200 cursor-pointer hover:bg-primary-50"
                        title="Klik untuk copy"
                      >
                        4811 1111 1111 1114
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Expiry Date:</span>{" "}
                      <span className="bg-white px-2 py-1 rounded border border-secondary-200">
                        Bebas (misal: 12/25)
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">CVV:</span>{" "}
                      <span
                        style={{ userSelect: "all", cursor: "pointer" }}
                        onClick={() => navigator.clipboard.writeText("123")}
                        className="bg-white px-2 py-1 rounded border border-secondary-200 cursor-pointer hover:bg-primary-50"
                        title="Klik untuk copy"
                      >
                        123
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-secondary-500 mt-2">
                    Klik pada nomor kartu atau CVV untuk copy ke clipboard.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
