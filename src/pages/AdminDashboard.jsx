/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  MdAssignment,
  MdCheckCircle,
  MdFilterList,
  MdSchedule,
  MdSearch,
  MdSort,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AssignmentModal from "../components/admin/AssignmentModal";
import StatsCard from "../components/admin/StatsCard";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "success" });
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = terbaru, asc = terlama
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    checkAdminAccess();
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchAllData();
      const interval = setInterval(() => {
        fetchAllData();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

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

      if (!res.ok || data.role !== "admin") {
        navigate("/dashboard");
        return;
      }
      setLoading(false);
    } catch {
      navigate("/login");
    }
  };

  const fetchAllData = async () => {
    try {
      const [reservationsRes, staffRes, assignmentsRes] = await Promise.all([
        fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/admin/reservations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        ),
        fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/admin/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        ),
        fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/admin/assignments",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        ),
      ]);

      const [reservationsData, staffData, assignmentsData] = await Promise.all([
        reservationsRes.json(),
        staffRes.json(),
        assignmentsRes.json(),
      ]);

      setReservations(reservationsData || []);
      // Filter untuk employee saja, bukan staff
      setStaffList(staffData?.filter((u) => u.role === "employee") || []);

      const processedAssignments = (assignmentsData || []).map(
        (assignment) => ({
          ...assignment,
          staff_ids:
            assignment.assignment_staffs?.map((as) => as.staff_id) || [],
          staffs: assignment.assignment_staffs?.map((as) => as.users) || [],
        })
      );
      setAssignments(processedAssignments);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const getAssignmentForReservation = (reservationId) => {
    const assignment = assignments.find(
      (a) => a.reservation_id === reservationId
    );
    if (assignment && assignment.staff_ids && assignment.staff_ids.length > 0) {
      return assignment;
    }
    return null;
  };

  const handleAssign = async (reservationId, staffIds) => {
    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/admin/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            reservation_id: reservationId,
            staff_ids: staffIds,
          }),
        }
      );

      if (res.ok) {
        fetchAllData().catch((err) => {
          console.error("Background fetchAllData failed:", err);
        });
        setAlert({ message: "Staff berhasil ditugaskan!", type: "success" });
        return true;
      } else {
        setAlert({ message: "Gagal menugaskan staff!", type: "error" });
        return false;
      }
    } catch (error) {
      console.error("Failed to assign:", error);
      setAlert({
        message: "Terjadi kesalahan saat menugaskan staff!",
        type: "error",
      });
      return false;
    }
  };

  const handleCompleteReservation = async (reservationId) => {
    if (!confirm("Tandai reservasi ini sebagai selesai?")) return false;
    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/admin/reservations/${reservationId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        fetchAllData().catch((err) =>
          console.error("Background fetchAllData failed:", err)
        );
        setAlert({ message: data.message || "Reservasi ditandai selesai!", type: "success" });
        return true;
      } else {
        setAlert({ message: data.message || "Gagal menandai selesai", type: "error" });
        return false;
      }
    } catch (error) {
      console.error("Failed to complete reservation:", error);
      setAlert({ message: "Terjadi kesalahan saat menandai selesai", type: "error" });
      return false;
    }
  };

  const getActualReservationStatus = (reservation) => {
    if (
      reservation.status === "failed" ||
      reservation.status === "canceled" ||
      reservation.status === "completed"
    ) {
      return reservation.status;
    }

    const assignment = getAssignmentForReservation(reservation.id);
    if (assignment) return "in_progress";

    if (reservation.payments && reservation.payments.length > 0) {
      const payment = reservation.payments[0];
      
      if (
        payment.transaction_status === "deny" ||
        payment.transaction_status === "cancel" ||
        payment.transaction_status === "expire"
      ) {
        return "failed";
      }
      
      if (
        payment.transaction_status === "settlement" ||
        payment.transaction_status === "capture"
      ) {
        return "confirmed";
      }
      
      if (payment.transaction_status === "pending") {
        return "pending";
      }
    }

    return reservation.status;
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
      confirmed: "Menunggu Pembayaran",
      in_progress: "Sedang Dikerjakan",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return texts[status] || status;
  };

  // Statistics - sesuaikan dengan status reservasi langsung
  const totalPending = reservations.filter(r => r.status === "pending").length;
  const totalConfirmed = reservations.filter(r => r.status === "confirmed").length;
  const totalInProgress = reservations.filter(r => r.status === "in_progress").length;
  const totalCompleted = reservations.filter(r => r.status === "completed").length;

  // Filter reservations - gunakan status langsung dari DB
  const filteredReservations = reservations
    .filter((r) => {
      if (filterStatus === "all") return true;
      return r.status === filterStatus;
    })
    .filter((r) => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        r.users?.name?.toLowerCase().includes(search) ||
        r.users?.phone?.toLowerCase().includes(search) ||
        r.services?.name_service?.toLowerCase().includes(search) ||
        r.user_locations?.label?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  // Group by date
  const groupedReservations = paginatedReservations.reduce((acc, reservation) => {
    const date = new Date(reservation.scheduled_datetime).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(reservation);
    return acc;
  }, {});

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        {/* Stats Cards - Update dengan status baru */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Menunggu Survei"
            value={totalPending}
            icon={MdSchedule}
            bgColor="from-yellow-500 to-yellow-600"
          />
          <StatsCard
            title="Menunggu Bayar"
            value={totalConfirmed}
            icon={MdAssignment}
            bgColor="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Sedang Dikerjakan"
            value={totalInProgress}
            icon={MdAssignment}
            bgColor="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Selesai"
            value={totalCompleted}
            icon={MdCheckCircle}
            bgColor="from-success-500 to-success-600"
          />
        </div>

        {/* Filters, Sort and Search */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Row 1: Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <MdFilterList className="w-5 h-5 text-secondary-600 flex-shrink-0" />
              {["all", "pending", "confirmed", "in_progress", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? "bg-primary-600 text-white"
                      : "bg-secondary-100 text-secondary-700 hover:bg-secondary-200"
                  }`}
                >
                  {status === "all" ? "Semua" : getStatusText(status)}
                </button>
              ))}
            </div>

            {/* Row 2: Sort & Search */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Sort Dropdown */}
              <div className="lg:w-48">
                <div className="relative">
                  <MdSort className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="input-primary pl-10 appearance-none"
                  >
                    <option value="desc">Terbaru</option>
                    <option value="asc">Terlama</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, HP, layanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-primary pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Info Text */}
            <div className="text-sm text-secondary-600">
              Menampilkan {filteredReservations.length === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, filteredReservations.length)} dari {filteredReservations.length} reservasi
              {searchQuery && ` (hasil pencarian)`}
            </div>
          </div>
        </div>

        {/* Reservations List */}
        {Object.keys(groupedReservations).length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdAssignment className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Tidak ada reservasi
            </h3>
            <p className="text-secondary-600">
              {searchQuery 
                ? "Tidak ada hasil yang cocok dengan pencarian Anda" 
                : "Tidak ada reservasi dengan filter yang dipilih"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {Object.entries(groupedReservations).map(([date, dayReservations]) => (
                <div key={date} className="card p-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4 pb-3 border-b border-secondary-200">
                    {date}
                  </h3>
                  <div className="space-y-3">
                    {dayReservations.map((reservation) => {
                      const assignment = getAssignmentForReservation(reservation.id);
                      
                      return (
                        <div
                          key={reservation.id}
                          className={`p-4 rounded-lg border transition-all ${
                            reservation.status === "pending"
                              ? "border-yellow-300 bg-yellow-50 hover:border-yellow-400"
                              : reservation.status === "confirmed"
                              ? "border-blue-300 bg-blue-50 hover:border-blue-400"
                              : "border-secondary-200 bg-white hover:border-secondary-300"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Left Side - Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                                    reservation.status
                                  )}`}
                                >
                                  {getStatusText(reservation.status)}
                                </span>
                                <span className="text-sm font-medium text-secondary-900">
                                  {reservation.schedule_slot}
                                </span>
                                <span className="text-xs text-secondary-500">
                                  {new Date(reservation.created_at).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </span>
                              </div>

                              <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                <div>
                                  <span className="text-secondary-600">Customer:</span>{" "}
                                  <span className="font-medium text-secondary-900">
                                    {reservation.users?.name}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-secondary-600">HP:</span>{" "}
                                  <span className="font-medium text-secondary-900">
                                    {reservation.users?.phone}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-secondary-600">Layanan:</span>{" "}
                                  <span className="font-medium text-secondary-900">
                                    {reservation.services?.name_service}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-secondary-600">Volume:</span>{" "}
                                  <span className="font-medium text-secondary-900">
                                    {reservation.septic_tank ? `${reservation.septic_tank} m³` : "Belum diukur"}
                                  </span>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-secondary-600">Lokasi:</span>{" "}
                                  <span className="font-medium text-secondary-900">
                                    {reservation.user_locations?.label}
                                  </span>
                                </div>
                                {reservation.customer_notes && (
                                  <div className="md:col-span-2 text-xs text-secondary-600 italic">
                                    Catatan: {reservation.customer_notes}
                                  </div>
                                )}
                              </div>

                              {/* Staff Assigned */}
                              {assignment && assignment.staffs?.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-secondary-200">
                                  <span className="text-xs text-secondary-600">
                                    Petugas Ditugaskan:
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {assignment.staffs.map((staff, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                                      >
                                        {staff.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Info untuk status confirmed (menunggu pembayaran) */}
                              {reservation.status === "confirmed" && reservation.septic_tank && (
                                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                                  <strong>Info:</strong> Menunggu pembayaran dari customer. Link pembayaran sudah dikirim.
                                </div>
                              )}
                            </div>

                            {/* Right Side - Actions */}
                            <div className="flex flex-col gap-2 lg:w-48">
                              {/* Tombol Assign hanya untuk status pending */}
                              {reservation.status === "pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedReservation(reservation);
                                    setAssignModalOpen(true);
                                  }}
                                  className="btn-primary text-sm py-2"
                                >
                                  <MdAssignment className="w-4 h-4 inline mr-2" />
                                  Assign Petugas
                                </button>
                              )}
                              
                              {/* Tombol Complete untuk status in_progress */}
                              {reservation.status === "in_progress" && (
                                <button
                                  onClick={() => handleCompleteReservation(reservation.id)}
                                  className="px-3 py-2 rounded-lg bg-success-100 text-success-800 border border-success-200 hover:bg-success-200 text-sm font-medium"
                                >
                                  <MdCheckCircle className="w-4 h-4 inline mr-2" />
                                  Tandai Selesai
                                </button>
                              )}
                              
                              {/* Info untuk status confirmed */}
                              {reservation.status === "confirmed" && (
                                <div className="text-center text-sm text-blue-600 font-medium py-2 bg-blue-50 rounded">
                                  ⏳ Menunggu Pembayaran
                                </div>
                              )}
                              
                              {/* Info untuk status completed */}
                              {reservation.status === "completed" && (
                                <div className="text-center text-sm text-success-600 font-medium py-2">
                                  ✓ Reservasi Selesai
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-3 py-1 text-secondary-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-primary-600 text-white"
                          : "text-secondary-600 hover:text-primary-600 hover:bg-secondary-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Assignment Modal */}
        <AssignmentModal
          isOpen={assignModalOpen && selectedReservation}
          reservation={selectedReservation}
          staffList={staffList}
          currentAssignment={
            selectedReservation
              ? getAssignmentForReservation(selectedReservation.id)
              : null
          }
          onAssign={handleAssign}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedReservation(null);
          }}
        />
      </div>
    </div>
  );
}