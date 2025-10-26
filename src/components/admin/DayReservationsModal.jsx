import { MdClose } from "react-icons/md";

export default function DayReservationsModal({
  isOpen,
  date,
  reservations,
  onClose,
  onReservationClick,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="border-b border-secondary-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-secondary-900">
              Reservasi -{" "}
              {date.toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {reservations.length === 0 ? (
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
                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a1 1 0 001 1h10a1 1 0 001-1V11a1 1 0 00-1-1H9a1 1 0 00-1 1z"
                  />
                </svg>
              </div>
              <p className="text-secondary-500">
                Tidak ada reservasi pada tanggal ini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  onClick={() => {
                    onReservationClick(reservation);
                    onClose();
                  }}
                  className="p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-secondary-900 text-sm">
                          {reservation.schedule_slot}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reservation.assignment
                              ? "bg-success-100 text-success-800"
                              : "bg-warning-100 text-warning-800"
                          }`}
                        >
                          {reservation.assignment ? "Assigned" : "Belum Assign"}
                        </span>
                      </div>
                      <div className="text-xs text-secondary-600 space-y-1">
                        <p>
                          <span className="font-medium">Volume:</span>{" "}
                          {reservation.volume} m³
                        </p>
                        {reservation.services?.name && (
                          <p>
                            <span className="font-medium">Layanan:</span>{" "}
                            {reservation.services.name}
                          </p>
                        )}
                        {reservation.user_locations && (
                          <p>
                            <span className="font-medium">Lokasi:</span>{" "}
                            {reservation.user_locations.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-secondary-500">
                      {reservation.assignment && (
                        <div className="text-success-600 font-medium">
                          ✓ Staff & Kendaraan Assigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-secondary-200 px-6 py-4 bg-secondary-50">
          <div className="text-sm text-secondary-600">
            Total:{" "}
            <span className="font-medium">{reservations.length} reservasi</span>
            {reservations.length > 0 && (
              <>
                {" • "}
                <span className="text-success-600 font-medium">
                  {reservations.filter((r) => r.assignment).length} assigned
                </span>
                {" • "}
                <span className="text-warning-600 font-medium">
                  {reservations.filter((r) => !r.assignment).length} pending
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
