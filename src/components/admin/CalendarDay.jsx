export default function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  reservations,
  onDayClick,
}) {
  const handleDayClick = (e) => {
    if (reservations.length > 0 && onDayClick) {
      e.stopPropagation();
      onDayClick(date, reservations);
    }
  };

  // Helper function to get actual status
  const getActualStatus = (reservation) => {
    // Check if has assignment with staff
    if (
      reservation.assignment &&
      reservation.assignment.staff_ids &&
      reservation.assignment.staff_ids.length > 0
    ) {
      return "assigned";
    }

    // Check payment status
    if (reservation.payments && reservation.payments.length > 0) {
      const payment = reservation.payments[0];
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

  const assignedCount = reservations.filter(
    (r) => getActualStatus(r) === "assigned"
  ).length;
  const paidCount = reservations.filter(
    (r) => getActualStatus(r) === "paid"
  ).length;
  const pendingCount = reservations.filter((r) => {
    const status = getActualStatus(r);
    return status !== "assigned" && status !== "paid";
  }).length;

  return (
    <div
      className={`min-h-[120px] p-2 border border-secondary-200 rounded-lg ${
        isCurrentMonth ? "bg-white" : "bg-secondary-50"
      } ${isToday ? "ring-2 ring-primary-500" : ""} ${
        reservations.length > 0
          ? "cursor-pointer hover:border-primary-300 hover:shadow-sm"
          : ""
      }`}
      onClick={handleDayClick}
      title={
        reservations.length > 0
          ? `${reservations.length} reservasi - Klik untuk detail`
          : undefined
      }
    >
      <div
        className={`text-sm font-medium mb-2 ${
          isCurrentMonth ? "text-secondary-900" : "text-secondary-400"
        }`}
      >
        <span
          className={`inline-block px-2 py-0.5 rounded-full ${
            isToday
              ? "bg-primary-100 text-primary-700 border border-primary-400"
              : ""
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="space-y-1">
        {reservations.length > 0 ? (
          <div className="space-y-1">
            <div className="text-xs font-medium text-secondary-800 bg-secondary-100 px-2 py-1 rounded">
              {reservations.length} Reservasi
            </div>

            {assignedCount > 0 && (
              <div className="text-xs text-success-800 bg-success-100 px-2 py-1 rounded flex items-center">
                <span className="w-2 h-2 bg-success-500 rounded-full mr-1"></span>
                {assignedCount} Assigned
              </div>
            )}

            {paidCount > 0 && (
              <div className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                {paidCount} Paid
              </div>
            )}

            {pendingCount > 0 && (
              <div className="text-xs text-warning-800 bg-warning-100 px-2 py-1 rounded flex items-center">
                <span className="w-2 h-2 bg-warning-500 rounded-full mr-1"></span>
                {pendingCount} Pending
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-secondary-400 text-center py-4">
            Tidak ada reservasi
          </div>
        )}
      </div>
    </div>
  );
}
