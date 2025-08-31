/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Riwayat() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationLogs, setReservationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

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
        service_types(name, base_price),
        user_locations(label, location)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setReservations(data);
    }
    setLoading(false);
  };

  const fetchReservationLogs = async (reservationId) => {
    const { data, error } = await supabase
      .from("reservation_logs")
      .select(
        `
        *,
        users(full_name)
      `
      )
      .eq("reservation_id", reservationId)
      .order("changed_at", { ascending: false });

    if (!error) {
      setReservationLogs(data);
    }
  };

  const handleDetailClick = (reservation) => {
    setSelectedReservation(reservation);
    fetchReservationLogs(reservation.id);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-warning-100 text-warning-800 border-warning-200",
      confirmed: "bg-primary-100 text-primary-800 border-primary-200",
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
      pending: "Menunggu",
      confirmed: "Dikonfirmasi",
      in_progress: "Berlangsung",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      confirmed: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      in_progress: "M13 10V3L4 14h7v7l9-11h-7z",
      completed: "M5 13l4 4L19 7",
      cancelled: "M6 18L18 6M6 6l12 12",
    };
    return icons[status] || "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Riwayat Reservasi
              </h1>
              <p className="text-secondary-600 mt-1">
                Pantau status dan kelola semua reservasi Anda
              </p>
            </div>

            {/* Filter */}
            <div className="mt-4 lg:mt-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-primary w-full lg:w-auto"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="in_progress">Berlangsung</option>
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
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className="card p-6 card-hover">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          getStatusBadge(reservation.status)
                            .replace("text-", "text-white bg-")
                            .split(" ")[2]
                        }`}
                      >
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={getStatusIcon(reservation.status)}
                          />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                          {reservation.service_types?.name}
                        </h3>

                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-secondary-600">
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                            </svg>
                            {reservation.user_locations?.label} -{" "}
                            {reservation.user_locations?.location}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                            {reservation.scheduled_datetime && (
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {new Date(
                                  reservation.scheduled_datetime
                                ).toLocaleDateString("id-ID")}
                              </div>
                            )}

                            {reservation.volume && (
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
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
                                {reservation.volume} m³
                              </div>
                            )}

                            {reservation.rit && (
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                  />
                                </svg>
                                {reservation.rit} rit
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-3">
                    <div className="flex flex-col items-start sm:items-end lg:items-start xl:items-end">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                          reservation.status
                        )}`}
                      >
                        {getStatusText(reservation.status)}
                      </span>

                      {reservation.total_cost && (
                        <span className="text-lg font-bold text-secondary-900 mt-1">
                          Rp {reservation.total_cost.toLocaleString()}
                        </span>
                      )}

                      <span className="text-xs text-secondary-500 mt-1">
                        {new Date(reservation.created_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDetailClick(reservation)}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                {/* Service Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Layanan
                    </label>
                    <p className="text-secondary-900 font-medium">
                      {selectedReservation.service_types?.name}
                    </p>
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

                {/* Location & Schedule */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Lokasi
                    </label>
                    <p className="text-secondary-900">
                      {selectedReservation.user_locations?.label}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {selectedReservation.user_locations?.location}
                    </p>
                  </div>

                  {selectedReservation.scheduled_datetime && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Jadwal
                      </label>
                      <p className="text-secondary-900">
                        {new Date(
                          selectedReservation.scheduled_datetime
                        ).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Volume & Cost */}
                <div className="grid md:grid-cols-3 gap-6">
                  {selectedReservation.volume && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Volume
                      </label>
                      <p className="text-secondary-900 font-medium">
                        {selectedReservation.volume} m³
                      </p>
                    </div>
                  )}

                  {selectedReservation.rit && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Rit
                      </label>
                      <p className="text-secondary-900 font-medium">
                        {selectedReservation.rit} rit
                      </p>
                    </div>
                  )}

                  {selectedReservation.total_cost && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Total Biaya
                      </label>
                      <p className="text-secondary-900 font-bold text-lg">
                        Rp {selectedReservation.total_cost.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedReservation.customer_notes && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Catatan Customer
                    </label>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-secondary-900">
                        {selectedReservation.customer_notes}
                      </p>
                    </div>
                  </div>
                )}

                {selectedReservation.admin_notes && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Catatan Admin
                    </label>
                    <div className="bg-primary-50 rounded-lg p-3">
                      <p className="text-primary-900">
                        {selectedReservation.admin_notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Activity Log */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-3">
                    Riwayat Aktivitas
                  </label>
                  <div className="space-y-3">
                    {reservationLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {log.status_from && (
                              <span className="text-sm text-secondary-500">
                                {getStatusText(log.status_from)}
                              </span>
                            )}
                            {log.status_from && (
                              <span className="text-secondary-400">→</span>
                            )}
                            <span className="text-sm font-medium text-secondary-900">
                              {getStatusText(log.status_to)}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-500">
                            {new Date(log.changed_at).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                            {log.users?.full_name &&
                              ` oleh ${log.users.full_name}`}
                          </p>
                          {log.notes && (
                            <p className="text-sm text-secondary-600 mt-1">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
