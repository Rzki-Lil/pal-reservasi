/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  MdAccessTime,
  MdAssignment,
  MdCalendarToday,
  MdChevronLeft,
  MdChevronRight,
  MdExpandLess,
  MdExpandMore,
  MdGroup,
  MdSchedule,
  MdCheckCircle,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AssignmentModal from "../components/admin/AssignmentModal";
import CalendarDay from "../components/admin/CalendarDay";
import DayReservationsModal from "../components/admin/DayReservationsModal";
import ReservationCard from "../components/admin/ReservationCard";
import StatsCard from "../components/admin/StatsCard";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [calendarDates, setCalendarDates] = useState([]);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDateReservations, setSelectedDateReservations] = useState([]);
  const [selectedModalDate, setSelectedModalDate] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "success" });

  useEffect(() => {
    checkAdminAccess();
  }, [token]);

  useEffect(() => {
    generateCalendar();
  }, [selectedDate]);

  useEffect(() => {
    if (user) {
      fetchAllData();
      const interval = setInterval(() => {
        fetchAllData();
      }, 60000); // refresh tiap 60 detik
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
      setStaffList(staffData?.filter((u) => u.role === "staff") || []);

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

  const generateCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    setCalendarDates(dates);
  };

  const getReservationsForDate = (date) => {
    const dateStr = date.toDateString();
    return reservations.filter(
      (r) => new Date(r.service_date).toDateString() === dateStr
    );
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
        // jalankan refresh data di background (tidak menunggu)
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

  // NEW: mark reservation as completed (only admin, reservation must be assigned)
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
        // refresh data in background
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

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const getTodayReservations = () => {
    const today = new Date().toDateString();
    return reservations.filter(
      (r) => new Date(r.service_date).toDateString() === today
    );
  };

  const handleDayClick = (date, dayReservations) => {
    setSelectedModalDate(date);
    setSelectedDateReservations(dayReservations);
    setDayModalOpen(true);
  };

  const getActualReservationStatus = (reservation) => {
    // Treat completed, failed or canceled as final statuses
    if (
      reservation.status === "failed" ||
      reservation.status === "canceled" ||
      reservation.status === "completed"
    ) {
      return reservation.status;
    }

    const assignment = getAssignmentForReservation(reservation.id);
    if (assignment) return "assigned";

    // Check payment status - prioritize failed states
    if (reservation.payments && reservation.payments.length > 0) {
      const payment = reservation.payments[0];
      
      // Check for failed payment status first
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
        return "paid";
      }
      
      if (payment.transaction_status === "pending") {
        return "pending";
      }
    }

    return reservation.status;
  };

  // totals for new stats cards
  // count assigned but exclude reservations already completed
  const totalAssigned = reservations.filter(
    (r) => r.status !== "completed" && Boolean(getAssignmentForReservation(r.id))
  ).length;
  const totalCompleted = reservations.filter((r) => r.status === "completed")
    .length;

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Navbar */}
      <Navbar />
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: "", type: "success" })}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Reservasi"
            value={reservations.length}
            icon={MdAssignment}
            bgColor="from-primary-500 to-primary-600"
          />
          <StatsCard
            title="Belum Diassign"
            value={
              reservations.filter(
                (r) => !assignments.find((a) => a.reservation_id === r.id) && r.status !== "completed"
              ).length
            }
            icon={MdSchedule}
            bgColor="from-warning-500 to-warning-600"
          />
          <StatsCard
            title="Assigned"
            value={totalAssigned}
            icon={MdAssignment}
            bgColor="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Completed"
            value={totalCompleted}
            icon={MdCheckCircle}
            bgColor="from-success-500 to-success-600"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Full Width - Calendar & Today's Reservations */}
          <div className="lg:col-span-3 space-y-6">
            {/* Compact/Expandable Calendar */}
            <div className="card">
              <div
                className="p-4 cursor-pointer hover:bg-secondary-50 transition-colors"
                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MdCalendarToday className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-secondary-900">
                      Kalender Reservasi
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-secondary-600">
                      {monthNames[selectedDate.getMonth()]}{" "}
                      {selectedDate.getFullYear()}
                    </span>
                    {isCalendarExpanded ? (
                      <MdExpandLess className="w-5 h-5 text-secondary-600" />
                    ) : (
                      <MdExpandMore className="w-5 h-5 text-secondary-600" />
                    )}
                  </div>
                </div>

                {!isCalendarExpanded && (
                  <div className="mt-3 text-sm text-secondary-600">
                    Klik untuk melihat kalender lengkap • {reservations.length}{" "}
                    reservasi total
                  </div>
                )}
              </div>

              {isCalendarExpanded && (
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(
                          new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth() - 1
                          )
                        );
                      }}
                      className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
                    >
                      <MdChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-medium text-secondary-900">
                      {monthNames[selectedDate.getMonth()]}{" "}
                      {selectedDate.getFullYear()}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(
                          new Date(
                            selectedDate.getFullYear(),
                            selectedDate.getMonth() + 1
                          )
                        );
                      }}
                      className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
                    >
                      <MdChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        className="p-3 text-center text-sm font-medium text-secondary-600 bg-secondary-50 rounded-lg"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDates.map((date, index) => {
                      const dayReservations = getReservationsForDate(date).map(
                        (r) => ({
                          ...r,
                          assignment: getAssignmentForReservation(r.id),
                        })
                      );
                      const isCurrentMonth =
                        date.getMonth() === selectedDate.getMonth();
                      const isToday =
                        date.toDateString() === new Date().toDateString();

                      return (
                        <CalendarDay
                          key={index}
                          date={date}
                          isCurrentMonth={isCurrentMonth}
                          isToday={isToday}
                          reservations={dayReservations}
                          onReservationClick={(reservation) => {
                            const actualStatus =
                              getActualReservationStatus(reservation);
                            if (actualStatus === "paid") {
                              setSelectedReservation(reservation);
                              setAssignModalOpen(true);
                            }
                          }}
                          onDayClick={handleDayClick}
                          onComplete={handleCompleteReservation}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Today's Reservations */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MdAccessTime className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-secondary-900">
                    Reservasi Hari Ini
                  </h2>
                </div>
                <span className="text-sm text-secondary-600">
                  {new Date().toLocaleDateString("id-ID")}
                </span>
              </div>

              {getTodayReservations().length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdCalendarToday className="w-8 h-8 text-secondary-400" />
                  </div>
                  <p className="text-secondary-500">
                    Tidak ada reservasi hari ini
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {getTodayReservations()
                      .slice(0, 3)
                      .map((reservation) => {
                        const actualStatus = getActualReservationStatus(reservation);
                        return (
                          <div key={reservation.id} className="space-y-2">
                            <ReservationCard
                              reservation={reservation}
                              assignment={getAssignmentForReservation(reservation.id)}
                              onClick={(res) => {
                                const as = getActualReservationStatus(res);
                                if (as === "paid") {
                                  setSelectedReservation(res);
                                  setAssignModalOpen(true);
                                }
                              }}
                            />
                            {/* Show 'Tandai Selesai' only when reservation is assigned */}
                            {actualStatus === "assigned" && (
                              <div className="flex justify-end mt-1">
                                <button
                                  onClick={async () => {
                                    const ok = await handleCompleteReservation(reservation.id);
                                    if (ok) {
                                      // optional: close assign modal if open for same reservation
                                      if (selectedReservation?.id === reservation.id) {
                                        setAssignModalOpen(false);
                                        setSelectedReservation(null);
                                      }
                                    }
                                  }}
                                  className="text-sm px-3 py-1 rounded-lg bg-success-100 text-success-800 border border-success-200 hover:bg-success-200"
                                  title="Tandai reservasi ini selesai"
                                >
                                  Tandai Selesai
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  {getTodayReservations().length > 3 && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
                        onClick={() => {
                          setSelectedModalDate(new Date());
                          setSelectedDateReservations(getTodayReservations());
                          setDayModalOpen(true);
                        }}
                      >
                        Lihat Semua Reservasi Hari Ini
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        <AssignmentModal
          isOpen={assignModalOpen && selectedReservation}
          reservation={selectedReservation}
          staffList={staffList}
          currentAssignment={
            selectedReservation
              ? (() => {
                  const assignment = assignments.find(
                    (a) => a.reservation_id === selectedReservation.id
                  );
                  if (
                    assignment &&
                    assignment.staff_ids &&
                    assignment.staff_ids.length > 0
                  ) {
                    return {
                      ...assignment,
                      staff_ids: assignment.staff_ids || [],
                    };
                  }
                  return null;
                })()
              : null
          }
          onAssign={handleAssign}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedReservation(null);
          }}
        />

        {/* Day Reservations Modal */}
        <DayReservationsModal
           isOpen={dayModalOpen}
           date={selectedModalDate}
           reservations={selectedDateReservations}
           onClose={() => {
             setDayModalOpen(false);
             setSelectedDateReservations([]);
             setSelectedModalDate(null);
           }}
           onReservationClick={(reservation) => {
             const actualStatus = getActualReservationStatus(reservation);
             if (actualStatus === "paid") {
               setSelectedReservation(reservation);
               setAssignModalOpen(true);
             }
           }}
           onComplete={async (reservationId) => {
            const ok = await handleCompleteReservation(reservationId);
            if (ok) {
              // close day modal to show refresh if desired, or keep open and refresh data
              // we'll refresh data in handleCompleteReservation already
            }
          }}
         />
      </div>
    </div>
  );
}