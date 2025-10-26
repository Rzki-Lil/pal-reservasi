/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  MdAccessTime,
  MdArrowBack,
  MdAssignment,
  MdCalendarToday,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdDirectionsCar,
  MdExpandLess,
  MdExpandMore,
  MdGroup,
  MdPerson,
  MdSchedule,
  MdShield,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AssignmentModal from "../components/admin/AssignmentModal";
import CalendarDay from "../components/admin/CalendarDay";
import DayReservationsModal from "../components/admin/DayReservationsModal";
import InfoPanel from "../components/admin/InfoPanel";
import ReservationCard from "../components/admin/ReservationCard";
import StatsCard from "../components/admin/StatsCard";
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

  useEffect(() => {
    checkAdminAccess();
  }, [token]);

  useEffect(() => {
    generateCalendar();
  }, [selectedDate]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("https://settled-modern-stinkbug.ngrok-free.app/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        fetch("https://settled-modern-stinkbug.ngrok-free.app/api/admin/reservations", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://settled-modern-stinkbug.ngrok-free.app/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://settled-modern-stinkbug.ngrok-free.app/api/admin/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
    return assignments.find((a) => a.reservation_id === reservationId);
  };

  const handleAssign = async (reservationId, staffIds) => {
    try {
      const res = await fetch("https://settled-modern-stinkbug.ngrok-free.app/api/admin/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          staff_ids: staffIds, // Array of staff IDs
        }),
      });

      if (res.ok) {
        await fetchAllData();
        setAssignModalOpen(false);
        setSelectedReservation(null);
      }
    } catch (error) {
      console.error("Failed to assign:", error);
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

  const getUpcomingReservations = () => {
    const today = new Date();
    const upcoming = new Date();
    upcoming.setDate(today.getDate() + 7); // Next 7 days

    return reservations.filter((r) => {
      const reservationDate = new Date(r.service_date);
      return reservationDate > today && reservationDate <= upcoming;
    });
  };

  const getRecentAssignments = () => {
    return assignments
      .sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))
      .slice(0, 5);
  };

  const handleDayClick = (date, dayReservations) => {
    setSelectedModalDate(date);
    setSelectedDateReservations(dayReservations);
    setDayModalOpen(true);
  };

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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                (r) => !assignments.find((a) => a.reservation_id === r.id)
              ).length
            }
            icon={MdSchedule}
            bgColor="from-warning-500 to-warning-600"
          />
          <StatsCard
            title="Staff Aktif"
            value={staffList.length}
            icon={MdGroup}
            bgColor="from-secondary-500 to-secondary-600"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar & Today's Reservations */}
          <div className="lg:col-span-2 space-y-6">
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
                            setSelectedReservation(reservation);
                            setAssignModalOpen(true);
                          }}
                          onDayClick={handleDayClick}
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
                <div className="space-y-3">
                  {getTodayReservations().map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      assignment={getAssignmentForReservation(reservation.id)}
                      onClick={(res) => {
                        setSelectedReservation(res);
                        setAssignModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Upcoming Reservations */}
            <InfoPanel
              title="7 Hari Mendatang"
              icon={MdSchedule}
              emptyMessage="Tidak ada reservasi mendatang"
            >
              {getUpcomingReservations().length > 0 && (
                <div className="space-y-3">
                  {getUpcomingReservations()
                    .slice(0, 5)
                    .map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm text-secondary-900">
                            {new Date(
                              reservation.service_date
                            ).toLocaleDateString("id-ID")}
                          </p>
                          <p className="text-xs text-secondary-600">
                            {reservation.schedule_slot}
                          </p>
                        </div>
                        <span className="text-xs text-secondary-500">
                          {reservation.volume}m³
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </InfoPanel>

            {/* Recent Assignments */}
            <InfoPanel
              title="Assignment Terbaru"
              icon={MdPerson}
              emptyMessage="Belum ada assignment"
            >
              {getRecentAssignments().length > 0 && (
                <div className="space-y-3">
                  {getRecentAssignments().map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-3 bg-secondary-50 rounded-lg"
                    >
                      <div className="text-xs text-secondary-600 mb-1">
                        {new Date(assignment.assigned_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-secondary-900 mb-1">
                          Tim Staff ({assignment.staffs?.length || 0} orang):
                        </p>
                        <div className="text-secondary-600 space-y-1">
                          {assignment.staffs && assignment.staffs.length > 0 ? (
                            assignment.staffs.map((staff, idx) => (
                              <p key={idx} className="text-xs">
                                • {staff.name}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs">Tidak ada data staff</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </InfoPanel>
          </div>
        </div>

        {/* Assignment Modal */}
        <AssignmentModal
          isOpen={assignModalOpen && selectedReservation}
          reservation={selectedReservation}
          staffList={staffList}
          currentAssignment={
            selectedReservation
              ? {
                  ...getAssignmentForReservation(selectedReservation.id),
                  staff_ids:
                    getAssignmentForReservation(selectedReservation.id)
                      ?.staff_ids || [],
                }
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
            setSelectedReservation(reservation);
            setAssignModalOpen(true);
          }}
        />
      </div>
    </div>
  );
}
