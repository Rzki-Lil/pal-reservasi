/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import Alert from "../components/Alert";

export default function Riwayat() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [alert, setAlert] = useState({ message: "", type: "success" });

  useEffect(() => {
    fetchReservations();
  }, [user]);

  const fetchReservations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        services!reservationss_service_type_id_fkey(name_service, price),
        user_locations!reservationss_location_id_fkey(label, location),
        payments!payments_reservation_id_fkey(*),
        assignments(
          id,
          assigned_at,
          assignment_staffs(
            users:staff_id(id, name, phone)
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReservations(data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-success-100 text-success-800 border-success-200",
      cancelled: "bg-danger-100 text-danger-800 border-danger-200",
    };
    return (
      badges[status] ||
      "bg-secondary-100 text-secondary-800 border-secondary-200"
    );
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Menunggu Survei",
      confirmed: "Menunggu Pembayaran",
      in_progress: "Sedang Dikerjakan",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return texts[status] || status;
  };

  const getTotalPrice = (reservation) => {
    if (!reservation.services?.price) return 0;
    // Harga berdasarkan rit, bukan volume
    const rit = parseInt(reservation.rit, 10) || 0;
    if (rit <= 0) return 0;
    return reservation.services.price * rit;
  };

  // Cek apakah ada payment pending untuk reservasi ini
  const hasPendingPayment = (reservation) => {
    if (!reservation.payments) return false;
    
    // Handle jika payments adalah array
    if (Array.isArray(reservation.payments)) {
      return reservation.payments.some((p) => p.transaction_status === "pending");
    }
    
    // Handle jika payments adalah single object
    return reservation.payments.transaction_status === "pending";
  };

  const handlePayNow = async (reservationId) => {
    try {
      const { data: payment, error } = await supabase
        .from("payments")
        .select("redirect_url, transaction_status")
        .eq("reservation_id", reservationId)
        .single();

      if (error || !payment?.redirect_url) {
        setAlert({ message: "Tautan pembayaran tidak ditemukan!", type: "error" });
        return;
      }

      if (payment.transaction_status !== "pending") {
        setAlert({ message: "Pembayaran sudah diproses atau kadaluarsa", type: "error" });
        return;
      }

      const urlParts = payment.redirect_url.split("/");
      const snapToken = urlParts[urlParts.length - 1];

      if (window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: function () {
            setAlert({ message: "Pembayaran Anda berhasil diproses!", type: "success" });
            fetchReservations();
          },
          onPending: function () {
            setAlert({ message: "Pembayaran Anda sedang diproses...", type: "success" });
            fetchReservations();
          },
          onError: function () {
            setAlert({ message: "Pembayaran gagal! Silakan coba lagi.", type: "error" });
          },
          onClose: function () {
            fetchReservations();
          },
        });
      } else {
        window.open(payment.redirect_url, "_blank");
      }
    } catch (error) {
      console.error("Error:", error);
      setAlert({ message: "Gagal membuka halaman pembayaran!", type: "error" });
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    if (filterStatus === "all") return true;
    return reservation.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: "", type: "success" })}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Riwayat Reservasi
              </h1>
              <p className="text-secondary-600 mt-1">
                Pantau status dan kelola semua reservasi Anda
              </p>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-primary w-full md:w-auto"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Survei</option>
                <option value="confirmed">Menunggu Pembayaran</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-secondary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {filterStatus === "all"
                ? "Belum ada reservasi"
                : `Tidak ada reservasi dengan status "${getStatusText(
                    filterStatus
                  )}"`}
            </h3>
            <p className="text-secondary-600">
              Mulai dengan membuat reservasi pertama Anda
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="card p-6 border border-secondary-200"
              >
                {/* Status and Basic Info */}
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                        reservation.status
                      )}`}
                    >
                      {getStatusText(reservation.status)}
                    </span>
                    {reservation.schedule_slot && (
                      <span className="text-sm text-secondary-600">
                        {reservation.schedule_slot}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-secondary-500">
                    {new Date(reservation.created_at).toLocaleDateString(
                      "id-ID"
                    )}
                  </div>
                </div>

                {/* Service Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {reservation.services?.name_service}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm text-secondary-600">
                      <div>
                        📍 {reservation.user_locations?.label} -{" "}
                        {reservation.user_locations?.location}
                      </div>
                      <div className="mt-1">
                        📅{" "}
                        {new Date(
                          reservation.scheduled_datetime
                        ).toLocaleDateString("id-ID")}{" "}
                        {reservation.septic_tank && `• 📦 ${reservation.septic_tank} m³`}
                        {reservation.rit && ` • 🚛 ${reservation.rit} rit`}
                      </div>
                    </div>
                    {reservation.rit && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">
                          Rp {getTotalPrice(reservation).toLocaleString()}
                        </div>
                        <div className="text-xs text-secondary-500">
                          {reservation.rit} rit × Rp {reservation.services?.price?.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info untuk status pending */}
                {reservation.status === "pending" && (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
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
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Menunggu Survei Petugas</p>
                        <p className="mt-1">
                          Reservasi Anda sedang menunggu admin untuk menugaskan
                          petugas. Petugas akan melakukan survei dan mengukur
                          volume tangki septik.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tombol Bayar untuk status confirmed dengan payment pending */}
                {reservation.status === "confirmed" && hasPendingPayment(reservation) && reservation.rit && (
                  <div className="mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
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
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Survei Selesai!</p>
                          <p className="mt-1">
                            Volume tangki septik:{" "}
                            <strong>{reservation.septic_tank} m³</strong>
                          </p>
                          <p>
                            Jumlah rit:{" "}
                            <strong>{reservation.rit} rit</strong>
                          </p>
                          <p>
                            Total biaya:{" "}
                            <strong>
                              Rp {getTotalPrice(reservation).toLocaleString()}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePayNow(reservation.id)}
                      className="w-full btn-primary text-sm py-2 flex items-center justify-center"
                    >
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
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Bayar Sekarang - Rp{" "}
                      {getTotalPrice(reservation).toLocaleString()}
                    </button>
                  </div>
                )}

                {/* Info untuk status in_progress */}
                {reservation.status === "in_progress" && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-purple-600 mt-0.5 mr-3"
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
                      <div className="text-sm text-purple-800">
                        <p className="font-medium">Pembayaran Berhasil!</p>
                        <p className="mt-1">
                          Petugas sedang mengerjakan layanan Anda. Mohon tunggu
                          hingga selesai.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment Details */}
                {reservation.assignments?.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Tim yang Ditugaskan
                    </h4>
                    {reservation.assignments.map((assignment) => (
                      <div key={assignment.id} className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-2">
                          {assignment.assignment_staffs?.map((staffAssignment, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-blue-900">
                                  {staffAssignment.users?.name}
                                </div>
                                <div className="text-xs text-blue-700">
                                  📞 {staffAssignment.users?.phone}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {reservation.customer_notes && (
                  <div className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                    <strong>Catatan:</strong> {reservation.customer_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-large w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-secondary-900">
                    Detail Reservasi
                  </h3>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Layanan
                    </label>
                    <div className="font-semibold text-secondary-900">
                      {selectedReservation.services?.name_service}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        selectedReservation.status
                      )}`}
                    >
                      {getStatusText(selectedReservation.status)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Lokasi
                    </label>
                    <div className="font-semibold text-secondary-900">
                      {selectedReservation.user_locations?.label}
                    </div>
                    <div className="text-sm text-secondary-600">
                      {selectedReservation.user_locations?.location}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Jadwal
                    </label>
                    <div className="font-semibold text-secondary-900">
                      {new Date(
                        selectedReservation.scheduled_datetime
                      ).toLocaleDateString("id-ID")}
                    </div>
                    {selectedReservation.schedule_slot && (
                      <div className="text-sm text-secondary-600">
                        Slot: {selectedReservation.schedule_slot}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Volume
                    </label>
                    <div className="font-semibold text-secondary-900">
                      {selectedReservation.septic_tank} m³
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Biaya Total
                    </label>
                    <div className="font-bold text-primary-700 text-lg">
                      Rp {getTotalPrice(selectedReservation).toLocaleString()}
                    </div>
                  </div>
                </div>
                {selectedReservation.payments?.[0] && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Metode Pembayaran
                    </label>
                    <div className="font-semibold text-secondary-900">
                      {selectedReservation.payments[0].payment_type ||
                        "Belum dipilih"}
                    </div>
                    {selectedReservation.payments[0].transaction_time && (
                      <div className="text-sm text-secondary-600">
                        {new Date(
                          selectedReservation.payments[0].transaction_time
                        ).toLocaleDateString("id-ID")}
                      </div>
                    )}
                  </div>
                )}
                {selectedReservation.customer_notes && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Catatan
                    </label>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-secondary-900">
                        {selectedReservation.customer_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
