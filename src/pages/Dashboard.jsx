/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    name: user?.name || "Pengguna",
  });
  const [reservationStats, setReservationStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    failed: 0,
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    notify_reservation: true,
    notify_information: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "success" });

  useEffect(() => {
    const checkRole = async () => {
      if (!token) return; 

      try {
        const res = await fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/auth/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        const data = await res.json();

        if (!res.ok || !data.role) {
          navigate("/login");
          return;
        }

        if (data.role === "admin") {
          navigate("/admin");
          return;
        }

        if (data.role === "employee") {
          navigate("/employee");
          return;
        }

        if (data.role !== "user") {
          navigate("/login");
          return;
        }

        fetchReservations();
        checkFirstLogin();
      } catch {
        navigate("/login");
      }
    };

    if (user && token) {
      checkRole();
    }
  }, [user, token]);

  const checkFirstLogin = async () => {
    if (!user?.id) return;

    const hasSeenNotifModal = localStorage.getItem(
      `notif_modal_seen_${user.id}`
    );

    if (!hasSeenNotifModal) {
      const { data } = await supabase
        .from("users")
        .select("notify_reservation, notify_information")
        .eq("id", user.id)
        .single();

      if (data) {
        setNotifPrefs({
          notify_reservation: data.notify_reservation ?? true,
          notify_information: data.notify_information ?? true,
        });
      }

      setShowNotifModal(true);
    }
  };

  const handleSaveNotifPrefs = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/auth/update-notification-preference",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(notifPrefs),
        }
      );

      if (res.ok) {
        localStorage.setItem(`notif_modal_seen_${user.id}`, "true");
        setShowNotifModal(false);
        setAlert({
          message: "Pengaturan notifikasi berhasil disimpan!",
          type: "success",
        });
      } else {
        setAlert({
          message: "Gagal menyimpan pengaturan notifikasi!",
          type: "error",
        });
      }
    } catch (error) {
      setAlert({
        message: "Terjadi kesalahan saat menyimpan pengaturan!",
        type: "error",
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSkipNotifModal = () => {
    localStorage.setItem(`notif_modal_seen_${user.id}`, "true");
    setShowNotifModal(false);
  };

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
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setRecentReservations(data);

      const stats = {
        total: data.length,
        pending: data.filter((r) => r.status === "pending").length,
        confirmed: data.filter((r) => r.status === "confirmed").length,
        in_progress: data.filter((r) => r.status === "in_progress").length,
      };
      setReservationStats(stats);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-warning-100 text-warning-800 border-warning-200",
      confirmed: "bg-success-100 text-success-800 border-success-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-success-50 text-success-800 border-success-100",
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
        .select("redirect_url")
        .eq("reservation_id", reservationId)
        .single();

      if (error || !payment?.redirect_url) {
        setAlert({ message: "Tautan pembayaran tidak ditemukan!", type: "error" });
        return;
      }

      const urlParts = payment.redirect_url.split("/");
      const snapToken = urlParts[urlParts.length - 1];

      if (window.snap && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: function (result) {
            setAlert({ message: "Pembayaran Anda berhasil diproses!", type: "success" });
            fetchReservations();
          },
          onPending: function (result) {
            setAlert({ message: "Pembayaran Anda sedang diproses...", type: "success" });
            fetchReservations();
          },
          onError: function (result) {
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

      {/* Notification Preferences Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                Notifikasi WhatsApp
              </h3>
              <p className="text-sm text-secondary-600">
                Dapatkan update terbaru tentang reservasi dan informasi penting
                langsung ke WhatsApp Anda
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-secondary-900 mb-1">
                    Notifikasi Reservasi
                  </p>
                  <p className="text-xs text-secondary-600">
                    Update status pembayaran, penugasan staff, dan jadwal
                    layanan
                  </p>
                </div>
                <button
                  onClick={() =>
                    setNotifPrefs((prev) => ({
                      ...prev,
                      notify_reservation: !prev.notify_reservation,
                    }))
                  }
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifPrefs.notify_reservation
                      ? "bg-primary-600"
                      : "bg-secondary-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs.notify_reservation
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-secondary-900 mb-1">
                    Notifikasi Informasi
                  </p>
                  <p className="text-xs text-secondary-600">
                    Berita, pengumuman, dan informasi penting lainnya
                  </p>
                </div>
                <button
                  onClick={() =>
                    setNotifPrefs((prev) => ({
                      ...prev,
                      notify_information: !prev.notify_information,
                    }))
                  }
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifPrefs.notify_information
                      ? "bg-primary-600"
                      : "bg-secondary-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs.notify_information
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSkipNotifModal}
                className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition font-medium"
                disabled={savingPrefs}
              >
                Lewati
              </button>
              <button
                onClick={handleSaveNotifPrefs}
                className="flex-1 btn-primary"
                disabled={savingPrefs}
              >
                {savingPrefs ? "Menyimpan..." : "Simpan Preferensi"}
              </button>
            </div>

            <p className="text-xs text-center text-secondary-500 mt-4">
              Anda bisa mengubah preferensi ini kapan saja di halaman profil
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Selamat datang, {userProfile?.name || "Pengguna"}! 👋
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
                  Menunggu Survei
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {reservationStats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
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
                  Menunggu Bayar
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {reservationStats.confirmed}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
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
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Sedang Dikerjakan
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {reservationStats.in_progress}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
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
                <div className="grid gap-4">
                  {recentReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="card p-4 border border-secondary-200 hover:shadow transition"
                    >
                      {/* Status and Basic Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            reservation.status
                          )}`}
                        >
                          {getStatusText(reservation.status)}
                        </span>
                        {reservation.schedule_slot && (
                          <span className="text-xs text-secondary-500">
                            {reservation.schedule_slot}
                          </span>
                        )}
                      </div>

                      {/* Service and Price */}
                      <div className="font-bold text-base text-secondary-900 flex items-center gap-2 mb-3">
                        {reservation.services?.name_service}
                        <span className="text-primary-700 font-semibold text-sm">
                          - Rp {getTotalPrice(reservation).toLocaleString()}
                        </span>
                      </div>

                      {/* Location and Date Info */}
                      <div className="grid md:grid-cols-2 gap-4 text-xs text-secondary-700 mb-3">
                        <div>
                          <span className="font-medium">Lokasi:</span>{" "}
                          {reservation.user_locations?.label} -{" "}
                          {reservation.user_locations?.location}
                        </div>
                        <div className="flex gap-4">
                          <span>
                            <span className="font-medium">Tanggal:</span>{" "}
                            {new Date(
                              reservation.scheduled_datetime
                            ).toLocaleDateString("id-ID")}
                          </span>
                          <span>
                            <span className="font-medium">Volume:</span>{" "}
                            {reservation.septic_tank} m³
                          </span>
                        </div>
                      </div>

                      {/* Tombol Bayar untuk status confirmed dengan payment pending */}
                      {reservation.status === "confirmed" && hasPendingPayment(reservation) && (
                        <div className="mt-3">
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
                            Bayar Sekarang
                          </button>
                        </div>
                      )}

                      {/* Assignment Details - Updated for Staff Only */}
                      {reservation.status === "assigned" &&
                        reservation.assignments?.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
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
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              Tim yang Ditugaskan
                            </h4>

                            {reservation.assignments.map((assignment) => (
                              <div key={assignment.id} className="space-y-2">
                                <div className="text-xs font-medium text-blue-800">
                                  Staff (
                                  {assignment.assignment_staffs?.length || 0}{" "}
                                  orang):
                                </div>
                                {assignment.assignment_staffs?.map(
                                  (staffAssignment, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center space-x-3 p-2 bg-white rounded-lg"
                                    >
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-blue-600"
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
                                        <div className="font-medium text-blue-900 text-sm">
                                          {staffAssignment.users?.name}
                                        </div>
                                        <div className="text-xs text-blue-700">
                                          {staffAssignment.users?.phone}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            ))}

                            <div className="text-xs text-blue-600 mt-2">
                              Ditugaskan pada:{" "}
                              {new Date(
                                reservation.assignments[0].assigned_at
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        )}
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
