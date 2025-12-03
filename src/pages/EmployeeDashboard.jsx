/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

export default function EmployeeDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "success" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({ septic_tank: "", rit: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      checkRoleAndFetch();
    }
  }, [token]);

  const checkRoleAndFetch = async () => {
    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      const data = await res.json();

      if (!res.ok || data.role !== "employee") {
        navigate("/login");
        return;
      }

      fetchAssignments();
    } catch {
      navigate("/login");
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/employee/my-assignments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      const data = await res.json();

      if (res.ok) {
        setAssignments(data);
      } else {
        setAlert({ message: data.message || "Gagal memuat data", type: "error" });
      }
    } catch (error) {
      setAlert({ message: "Gagal memuat data tugas", type: "error" });
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
    return badges[status] || "bg-secondary-100 text-secondary-800 border-secondary-200";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Menunggu Survei",
      confirmed: "Siap Input Inspeksi",
      in_progress: "Sedang Dikerjakan",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return texts[status] || status;
  };

  const handleOpenInspection = (reservation) => {
    setSelectedReservation(reservation);
    setInspectionForm({
      septic_tank: reservation.septic_tank || "",
      rit: reservation.rit || "",
    });
  };

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!selectedReservation) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/employee/reservations/${selectedReservation.id}/input-inspection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            septic_tank: parseFloat(inspectionForm.septic_tank),
            rit: inspectionForm.rit ? parseFloat(inspectionForm.rit) : null,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setAlert({
          message: "Data inspeksi berhasil disimpan! Link pembayaran telah dikirim ke pelanggan.",
          type: "success",
        });
        setSelectedReservation(null);
        fetchAssignments();
      } else {
        setAlert({ message: data.message || "Gagal menyimpan data", type: "error" });
      }
    } catch (error) {
      setAlert({ message: "Terjadi kesalahan", type: "error" });
    }
    setSubmitting(false);
  };

  const handleCompleteReservation = async (reservationId) => {
    if (!confirm("Apakah Anda yakin ingin menandai reservasi ini sebagai selesai?")) return;

    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/employee/reservations/${reservationId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setAlert({ message: "Reservasi berhasil ditandai selesai!", type: "success" });
        fetchAssignments();
      } else {
        setAlert({ message: data.message || "Gagal menyelesaikan reservasi", type: "error" });
      }
    } catch (error) {
      setAlert({ message: "Terjadi kesalahan", type: "error" });
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  const stats = {
    total: assignments.length,
    confirmed: assignments.filter((a) => a.status === "confirmed").length,
    in_progress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Dashboard Petugas
          </h1>
          <p className="text-secondary-600 mt-1">
            Selamat datang, {user?.name}! Kelola tugas Anda di sini.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Tugas</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Perlu Inspeksi</p>
                <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Dikerjakan</p>
                <p className="text-3xl font-bold text-purple-600">{stats.in_progress}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Selesai</p>
                <p className="text-3xl font-bold text-success-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-primary w-full md:w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="confirmed">Perlu Inspeksi</option>
            <option value="in_progress">Sedang Dikerjakan</option>
            <option value="completed">Selesai</option>
          </select>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">Belum ada tugas</h3>
            <p className="text-secondary-600">Tugas akan muncul setelah admin menugaskan Anda.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="card p-6 border border-secondary-200">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(assignment.status)}`}>
                      {getStatusText(assignment.status)}
                    </span>
                    {assignment.schedule_slot && (
                      <span className="text-sm text-secondary-600">{assignment.schedule_slot}</span>
                    )}
                  </div>
                  <div className="text-sm text-secondary-500">
                    Ditugaskan: {new Date(assignment.assigned_at).toLocaleDateString("id-ID")}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {assignment.services?.name_service}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-secondary-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{assignment.users?.name}</span> - {assignment.users?.phone}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {assignment.user_locations?.label} - {assignment.user_locations?.location}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(assignment.scheduled_datetime).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                {/* Septic Tank Info (if already filled) */}
                {assignment.septic_tank && (
                  <div className="mb-4 p-4 bg-secondary-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-secondary-600">Volume Tangki:</span>
                        <span className="ml-2 font-semibold">{assignment.septic_tank} m³</span>
                      </div>
                      {assignment.rit && (
                        <div>
                          <span className="text-secondary-600">Rit:</span>
                          <span className="ml-2 font-semibold">{assignment.rit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Notes */}
                {assignment.customer_notes && (
                  <div className="mb-4 text-sm text-secondary-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <strong>Catatan Pelanggan:</strong> {assignment.customer_notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {/* Tombol Input Inspeksi untuk status confirmed */}
                  {assignment.status === "confirmed" && (
                    <button
                      onClick={() => handleOpenInspection(assignment)}
                      className="btn-primary text-sm py-2 px-4 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Input Hasil Inspeksi
                    </button>
                  )}

                  {/* Tombol Selesaikan untuk status in_progress */}
                  {assignment.status === "in_progress" && (
                    <button
                      onClick={() => handleCompleteReservation(assignment.id)}
                      className="btn-primary bg-success-600 hover:bg-success-700 text-sm py-2 px-4 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tandai Selesai
                    </button>
                  )}

                  {/* Link Google Maps */}
                  {assignment.user_locations?.latitude && assignment.user_locations?.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${assignment.user_locations.latitude},${assignment.user_locations.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm py-2 px-4 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Navigasi
                    </a>
                  )}

                  {/* Link WhatsApp */}
                  {assignment.users?.phone && (
                    <a
                      href={`https://wa.me/${assignment.users.phone.replace(/^0/, "62")}?text=Halo ${assignment.users.name}, saya petugas PAL untuk reservasi Anda.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm py-2 px-4 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Input Inspeksi */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-secondary-900">Input Hasil Inspeksi</h3>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-600">
                <strong>Pelanggan:</strong> {selectedReservation.users?.name}
              </p>
              <p className="text-sm text-secondary-600">
                <strong>Lokasi:</strong> {selectedReservation.user_locations?.location}
              </p>
              <p className="text-sm text-secondary-600">
                <strong>Layanan:</strong> {selectedReservation.services?.name_service}
              </p>
              <p className="text-sm text-secondary-600">
                <strong>Harga per 3m³:</strong> Rp {selectedReservation.services?.price?.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleSubmitInspection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Volume Tangki Septik (m³) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  className="input-primary"
                  value={inspectionForm.septic_tank}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, septic_tank: e.target.value })}
                  placeholder="Masukkan volume dalam m³"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Rit (opsional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-primary"
                  value={inspectionForm.rit}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, rit: e.target.value })}
                  placeholder="Masukkan jumlah rit"
                />
              </div>

              {inspectionForm.septic_tank && (
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-sm text-primary-800">
                    <strong>Estimasi Biaya:</strong>{" "}
                    Rp {(selectedReservation.services?.price * Math.ceil(parseFloat(inspectionForm.septic_tank) / 3)).toLocaleString()}
                  </p>
                  <p className="text-xs text-primary-600 mt-1">
                    ({inspectionForm.septic_tank} m³ ÷ 3 = {Math.ceil(parseFloat(inspectionForm.septic_tank) / 3)} unit × Rp {selectedReservation.services?.price?.toLocaleString()})
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  className="flex-1 btn-secondary"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={submitting || !inspectionForm.septic_tank}
                >
                  {submitting ? "Menyimpan..." : "Simpan & Kirim Tagihan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
