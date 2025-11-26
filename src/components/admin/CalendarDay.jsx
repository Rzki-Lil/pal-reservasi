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

      <div className="space-y-1">
        {reservations.length > 0 ? (
          <div className="space-y-1">
            <div className="text-xs font-medium text-secondary-800 bg-secondary-100 px-2 py-1 rounded text-center">
              {totalCount} Reservasi
            </div>

            {/* Tambahkan ikon besar di bawah jumlah untuk mengisi ruang */}
            <div className="flex items-center justify-center mt-2">
              <svg
                className="w-12 h-12 text-secondary-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="6" rx="2" />
                <rect x="3" y="14" width="18" height="6" rx="2" />
                <path d="M8 7h.01M8 17h.01" />
              </svg>
            </div>
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
