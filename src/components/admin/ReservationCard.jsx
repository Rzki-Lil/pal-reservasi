export default function ReservationCard({ reservation, assignment, onClick }) {
  // Check if assignment has actual staff assigned
  const hasStaffAssigned =
    assignment && assignment.staff_ids && assignment.staff_ids.length > 0;

  // Determine actual status based on payment status
  const getActualStatus = () => {
    // If has assignment with staff, return "assigned"
    if (hasStaffAssigned) return "assigned";

    // Check payment status from payments table
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
      if (
        payment.transaction_status === "deny" ||
        payment.transaction_status === "cancel" ||
        payment.transaction_status === "expire"
      ) {
        return "failed";
      }
    }

    // Fallback to original status
    return reservation.status;
  };

  const actualStatus = getActualStatus();
  const canAssign = actualStatus === "paid";

  return (
    <div
      onClick={() => canAssign && onClick(reservation)}
      className={`p-4 rounded-lg border border-secondary-200 transition-all ${
        canAssign
          ? "hover:border-primary-300 hover:bg-primary-50 cursor-pointer"
          : "opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-secondary-900">
              {reservation.schedule_slot}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                hasStaffAssigned
                  ? "bg-success-100 text-success-800"
                  : actualStatus === "paid"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-warning-100 text-warning-800"
              }`}
            >
              {hasStaffAssigned
                ? "Assigned"
                : actualStatus === "paid"
                ? "Paid - Siap Assign"
                : "Belum Bayar"}
            </span>
          </div>
          <p className="text-sm text-secondary-600">
            Volume: {reservation.volume} m³
          </p>
          {!canAssign && (
            <p className="text-xs text-secondary-400 mt-1">
              Status:{" "}
              {actualStatus === "pending"
                ? "Menunggu pembayaran"
                : "Tidak dapat di-assign"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
