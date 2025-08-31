/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function BuatReservasi() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    service_type_id: "",
    location_id: "",
    scheduled_datetime: "",
    volume: "",
    contact_phone: "",
    customer_notes: "",
    payment_method: "",
    next_scheduled_datetime: "",
  });

  const [serviceTypes, setServiceTypes] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calculatedRit, setCalculatedRit] = useState(0);
  const [calculatedCost, setCalculatedCost] = useState(0);

  useEffect(() => {
    fetchServiceTypes();
    fetchUserLocations();
    fetchEmployees();
  }, []);

  useEffect(() => {
    calculateRitAndCost();
  }, [formData.volume, formData.service_type_id]);

  const fetchServiceTypes = async () => {
    const { data, error } = await supabase
      .from("service_types")
      .select("*")
      .eq("status", "active");

    if (!error) {
      setServiceTypes(data);
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

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        employee_id,
        position,
        users!inner(full_name)
      `
      )
      .eq("status", "active");

    if (!error) {
      setEmployees(data);
    }
  };

  const calculateRitAndCost = () => {
    if (formData.volume && formData.service_type_id) {
      const volume = parseFloat(formData.volume);
      const selectedService = serviceTypes.find(
        (s) => s.id === formData.service_type_id
      );

      if (selectedService && volume > 0) {
        const perRitVolume = 3; // 3 m³ per rit
        const rit = Math.ceil(volume / perRitVolume);
        const totalCost = selectedService.base_price * rit;

        setCalculatedRit(rit);
        setCalculatedCost(totalCost);
      } else {
        setCalculatedRit(0);
        setCalculatedCost(0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc("create_reservation", {
        p_user_id: user.id,
        p_service_type_id: formData.service_type_id,
        p_scheduled_datetime: formData.scheduled_datetime || null,
        p_location_id: formData.location_id,
        p_volume: formData.volume ? parseFloat(formData.volume) : null,
        p_contact_phone: formData.contact_phone || null,
        p_customer_notes: formData.customer_notes || null,
        p_payment_method: formData.payment_method || null,
        p_next_scheduled_datetime: formData.next_scheduled_datetime || null,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate("/riwayat");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat membuat reservasi");
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Jenis Layanan *
                  </label>
                  <select
                    name="service_type_id"
                    required
                    className="input-primary"
                    value={formData.service_type_id}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Jenis Layanan</option>
                    {serviceTypes.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - Rp{" "}
                        {service.base_price?.toLocaleString()} per rit
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Lokasi *
                  </label>
                  <select
                    name="location_id"
                    required
                    className="input-primary"
                    value={formData.location_id}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Lokasi</option>
                    {userLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.label} - {location.location}
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

                {/* Volume */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Volume Air Limbah (m³)
                  </label>
                  <input
                    name="volume"
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-primary"
                    placeholder="Masukkan volume dalam meter kubik"
                    value={formData.volume}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-secondary-500">
                    Setiap 3 m³ = 1 rit perjalanan.{" "}
                    {calculatedRit > 0 && `Estimasi: ${calculatedRit} rit`}
                  </p>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nomor Kontak
                  </label>
                  <input
                    name="contact_phone"
                    type="tel"
                    className="input-primary"
                    placeholder="Nomor telepon yang dapat dihubungi"
                    value={formData.contact_phone}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-secondary-500">
                    Kosongkan jika menggunakan nomor yang terdaftar
                  </p>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Tanggal Layanan
                  </label>
                  <input
                    name="scheduled_datetime"
                    type="date"
                    className="input-primary"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.scheduled_datetime}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-secondary-500">
                    Kosongkan jika ingin dijadwalkan oleh admin
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Metode Pembayaran
                  </label>
                  <select
                    name="payment_method"
                    className="input-primary"
                    value={formData.payment_method}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Metode Pembayaran</option>
                    <option value="cash">Tunai</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="e_wallet">E-Wallet</option>
                  </select>
                </div>

                {/* Next Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Jadwal Layanan Berikutnya
                  </label>
                  <input
                    name="next_scheduled_datetime"
                    type="date"
                    className="input-primary"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.next_scheduled_datetime}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-secondary-500">
                    Opsional: untuk layanan berulang
                  </p>
                </div>

                {/* Customer Notes */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    name="customer_notes"
                    rows={4}
                    className="input-primary resize-none"
                    placeholder="Catatan khusus untuk reservasi ini (kondisi lokasi, akses jalan, dll)"
                    value={formData.customer_notes}
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
                    disabled={loading || userLocations.length === 0}
                    className="btn-primary flex-1 sm:flex-none order-1 sm:order-2"
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
                    ) : (
                      "Buat Reservasi"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div
              className="card p-6 sticky top-8"
              style={{ minWidth: 320, maxWidth: 400 }}
            >
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Ringkasan Reservasi
              </h3>

              <div className="space-y-4">
                {formData.service_type_id && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Layanan:</span>
                    <span className="font-medium text-secondary-900">
                      {
                        serviceTypes.find(
                          (s) => s.id === formData.service_type_id
                        )?.name
                      }
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

                {calculatedRit > 0 && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Estimasi Rit:</span>
                    <span className="font-medium text-secondary-900">
                      {calculatedRit} rit
                    </span>
                  </div>
                )}

                {calculatedCost > 0 && (
                  <div className="border-t border-secondary-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-secondary-900">
                        Total Estimasi:
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        Rp {calculatedCost.toLocaleString()}
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
                      <p className="font-medium mb-1">Informasi Penting:</p>
                      <ul className="space-y-1 text-primary-700">
                        <li>• Biaya dapat berubah sesuai kondisi lapangan</li>
                        <li>• Konfirmasi akan diberikan dalam 1x24 jam</li>
                        <li>• Pastikan akses lokasi dapat dilalui kendaraan</li>
                      </ul>
                    </div>
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
