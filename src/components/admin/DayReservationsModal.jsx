import { MdClose } from "react-icons/md";

export default function DayReservationsModal({
  isOpen,
  date,
  reservations,
  onClose,
  onReservationClick,
  onComplete,
}) {
  if (!isOpen) return null;

  const getActualStatus = (reservation) => {
    if (
      reservation.status === "failed" ||
      reservation.status === "canceled" ||
      reservation.status === "completed"
    ) {
      return reservation.status;
    }

    if (
      reservation.assignment &&
      reservation.assignment.staff_ids &&
      reservation.assignment.staff_ids.length > 0
    ) {
      return "assigned";
    }

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
        return "paid";
      }

      if (payment.transaction_status === "pending") {
        return "pending";
      }
    }

    return reservation.status;
  };

  const pendingCount = reservations.filter((r) => getActualStatus(r) === "pending")
    .length;
  const paidCount = reservations.filter((r) => getActualStatus(r) === "paid").length;
  const assignedCount = reservations.filter(
    (r) => getActualStatus(r) === "assigned"
  ).length;
  const completedCount = reservations.filter(
    (r) => getActualStatus(r) === "completed"
  ).length;

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
              {reservations.map((reservation) => {
                const actualStatus = getActualStatus(reservation);
                return (
                  <div
                    key={reservation.id}
                    className="p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    <div
                      onClick={() => {
                        onReservationClick(reservation);
                        onClose();
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-secondary-900 text-sm">
                              {reservation.schedule_slot}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${(() => {
                                if (actualStatus === "assigned") {
                                  return "bg-success-100 text-success-800";
                                } else if (actualStatus === "completed") {
                                  return "bg-success-100 text-success-800";
                                } else if (actualStatus === "paid") {
                                  return "bg-blue-100 text-blue-800";
                                } else if (
                                  actualStatus === "failed" ||
                                  actualStatus === "canceled"
                                ) {
                                  return "bg-danger-100 text-danger-800";
                                } else {
                                  return "bg-warning-100 text-warning-800";
                                }
                              })()}`}
                            >
                              {(() => {
                                if (actualStatus === "assigned") return "Assigned";
                                if (actualStatus === "completed") return "Selesai";
                                if (actualStatus === "paid") return "Paid - Siap Assign";
                                if (actualStatus === "failed") return "Failed";
                                if (actualStatus === "canceled") return "Canceled";
                                return "Belum Bayar";
                              })()}
                            </span>
                          </div>
                          <div className="text-xs text-secondary-600 space-y-1">
                            <p>
                              <span className="font-medium">Volume:</span>{" "}
                              {reservation.septic_tank} m³
                            </p>
                            {reservation.services?.name_service && (
                              <p>
                                <span className="font-medium">Layanan:</span>{" "}
                                {reservation.services.name_service}
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
                          {actualStatus === "assigned" && (
                            <div className="text-success-600 font-medium">
                              ✓ Staff Assigned
                            </div>
                          )}
                          {(actualStatus === "failed" || actualStatus === "canceled") && (
                            <div className="text-danger-600 font-medium">
                              ✗ {actualStatus === "failed" ? "Gagal" : "Dibatalkan"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions row - separate from clickable area to avoid accidental close */}
                    <div className="mt-3 flex justify-end space-x-2">
                      {actualStatus === "assigned" && onComplete && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            // call parent's onComplete handler
                            try {
                              await onComplete(reservation.id);
                            } catch (err) {
                              console.error("onComplete error:", err);
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-success-100 text-success-800 border border-success-200 hover:bg-success-200 text-sm"
                        >
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
                <span className="text-warning-600 font-medium">
                  {pendingCount} pending
                </span>
                {" • "}
                <span className="text-blue-600 font-medium">
                  {paidCount} paid
                </span>
                {" • "}
                <span className="text-success-600 font-medium">
                  {assignedCount} assigned
                </span>
                {" • "}
                <span className="text-success-800 font-medium">
                  {completedCount} completed
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
