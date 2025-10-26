export default function ReservationCard({ reservation, assignment, onClick }) {
  return (
    <div
      onClick={() => onClick(reservation)}
      className="p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-secondary-900">
              {reservation.schedule_slot}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                assignment
                  ? "bg-success-100 text-success-800"
                  : "bg-warning-100 text-warning-800"
              }`}
            >
              {assignment ? "Assigned" : "Belum Assign"}
            </span>
          </div>
          <p className="text-sm text-secondary-600">
            Volume: {reservation.volume} m³
          </p>
        </div>
      </div>
    </div>
  );
}
