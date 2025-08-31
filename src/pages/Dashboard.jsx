/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [reservationStats, setReservationStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchReservationStats();
    fetchRecentReservations();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error) {
      setUserProfile(data);
    }
  };

  const fetchReservationStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("reservations")
      .select("status")
      .eq("user_id", user.id);

    if (!error) {
      const stats = data.reduce(
        (acc, reservation) => {
          acc.total += 1;
          acc[reservation.status] = (acc[reservation.status] || 0) + 1;
          return acc;
        },
        { total: 0, pending: 0, confirmed: 0, completed: 0 }
      );

      setReservationStats(stats);
    }
  };

  const fetchRecentReservations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        service_types(name),
        user_locations(label, location)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error) {
      setRecentReservations(data);
    }
    setLoading(false);
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
                Selamat datang, {userProfile?.full_name || "Pengguna"}! 👋
              </h1>
              <p className="text-secondary-600 mt-1">
                Kelola reservasi pengolahan air limbah Anda dengan mudah
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <Link
                to="/reservasi/buat"
                className="btn-primary inline-flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Buat Reservasi Baru
              </Link>
            </div>
          </div>
        </div>

        {/* Stats  */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Total Reservasi
                </p>
                <p className="text-3xl font-bold text-secondary-900">
                  {reservationStats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Menunggu
                </p>
                <p className="text-3xl font-bold text-warning-600">
                  {reservationStats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Dikonfirmasi
                </p>
                <p className="text-3xl font-bold text-primary-600">
                  {reservationStats.confirmed}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Selesai
                </p>
                <p className="text-3xl font-bold text-success-600">
                  {reservationStats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                Aksi Cepat
              </h2>
              <div className="space-y-3">
                <Link
                  to="/reservasi/buat"
                  className="flex items-center p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">
                      Buat Reservasi
                    </p>
                    <p className="text-sm text-secondary-600">
                      Tambah reservasi baru
                    </p>
                  </div>
                </Link>

                <Link
                  to="/riwayat"
                  className="flex items-center p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-primary-600"
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
                  <div>
                    <p className="font-medium text-secondary-900">
                      Lihat Riwayat
                    </p>
                    <p className="text-sm text-secondary-600">
                      Pantau status reservasi
                    </p>
                  </div>
                </Link>

                {/* Tambah Lokasi */}
                <Link
                  to="/profile"
                  className="flex items-center p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">
                      Tambah Lokasi
                    </p>
                    <p className="text-sm text-secondary-600">
                      Kelola lokasi Anda
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Reservasi baru */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">
                  Reservasi Terbaru
                </h2>
                <Link
                  to="/riwayat"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Lihat Semua
                </Link>
              </div>

              {recentReservations.length === 0 ? (
                <div className="text-center py-8">
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
                  <p className="text-secondary-500">Belum ada reservasi</p>
                  <Link
                    to="/reservasi/buat"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-2 inline-block"
                  >
                    Buat reservasi pertama Anda
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:border-secondary-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <div>
                            <p className="font-medium text-secondary-900">
                              {reservation.service_types?.name}
                            </p>
                            <p className="text-sm text-secondary-600">
                              {reservation.user_locations?.label} -{" "}
                              {reservation.user_locations?.location}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              {reservation.scheduled_datetime && (
                                <span className="text-xs text-secondary-500">
                                  📅{" "}
                                  {new Date(
                                    reservation.scheduled_datetime
                                  ).toLocaleDateString("id-ID")}
                                </span>
                              )}
                              {reservation.volume && (
                                <span className="text-xs text-secondary-500">
                                  💧 {reservation.volume} m³
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {reservation.total_cost && (
                          <span className="text-sm font-medium text-secondary-900">
                            Rp {reservation.total_cost.toLocaleString()}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                            reservation.status
                          )}`}
                        >
                          {getStatusText(reservation.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
