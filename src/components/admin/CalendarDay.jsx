export default function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  reservations,
  onDayClick,
  onComplete,
}) {
  const handleDayClick = (e) => {
    if (reservations.length > 0 && onDayClick) {
      e.stopPropagation();
      onDayClick(date, reservations);
    }
  };

  const getActualStatus = (reservation) => {
    if (
      reservation.status === "failed" ||
      reservation.status === "canceled" ||
      reservation.status === "completed"
    )
      return reservation.status;
    if (
      reservation.assignment &&
      reservation.assignment.staff_ids &&
      reservation.assignment.staff_ids.length > 0
    )
      return "assigned";
    if (reservation.payments && reservation.payments.length > 0) {
      const p = reservation.payments[0];
      if (["deny", "cancel", "expire"].includes(p.transaction_status))
        return "failed";
      if (["settlement", "capture"].includes(p.transaction_status))
        return "paid";
      if (p.transaction_status === "pending") return "pending";
    }
    return reservation.status;
  };

  const totalCount = reservations.length;

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

      <div className="space-y-2">
        {reservations.length > 0 ? (
          <>
            <div className="text-xs font-medium text-secondary-800 bg-secondary-100 px-2 py-1 rounded text-center">
              {totalCount} Reservasi
            </div>
            <div className="mt-2 space-y-1">
              {reservations.slice(0, 3).map((r) => {
                const status = getActualStatus(r);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-white/80 px-2 py-1 rounded text-xs border border-secondary-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-secondary-900 truncate">
                        {r.services?.name || r.schedule_slot}
                      </div>
                      <div className="text-secondary-500 text-[11px] truncate">
                        {r.schedule_slot} • {r.volume} m³
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "assigned" ? (
                        <>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-success-100 text-success-800">
                            Assigned
                          </span>
                          {onComplete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onComplete(r.id);
                              }}
                              className="text-[11px] px-2 py-0.5 rounded bg-success-50 text-success-800 border border-success-100"
                              title="Tandai selesai"
                            >
                              ✓
                            </button>
                          )}
                        </>
                      ) : status === "completed" ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-success-100 text-success-800">
                          Selesai
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700">
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-xs text-secondary-400 text-center py-4">
            Tidak ada reservasi
          </div>
        )}
      </div>
    </div>
  );
}
