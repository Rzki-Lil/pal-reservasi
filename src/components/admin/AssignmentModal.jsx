import { useEffect, useState } from "react";
import { MdAdd, MdClose, MdDelete } from "react-icons/md";

export default function AssignmentModal({
  reservation,
  staffList,
  currentAssignment,
  onAssign,
  onClose,
  isOpen,
}) {
  const [selectedStaffs, setSelectedStaffs] = useState([""]);

  // Update selectedStaffs when currentAssignment changes
  useEffect(() => {
    if (
      currentAssignment?.staff_ids &&
      currentAssignment.staff_ids.length > 0
    ) {
      setSelectedStaffs(currentAssignment.staff_ids);
    } else {
      setSelectedStaffs([""]);
    }
  }, [currentAssignment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validStaffs = selectedStaffs.filter((id) => id !== "");
    if (validStaffs.length > 0) {
      onAssign(reservation.id, validStaffs);
    }
  };

  const addStaffRow = () => {
    setSelectedStaffs([...selectedStaffs, ""]);
  };

  const removeStaffRow = (index) => {
    if (selectedStaffs.length > 1) {
      setSelectedStaffs(selectedStaffs.filter((_, i) => i !== index));
    }
  };

  const updateStaff = (index, staffId) => {
    const newStaffs = [...selectedStaffs];
    newStaffs[index] = staffId;
    setSelectedStaffs(newStaffs);
  };

  if (!isOpen || !reservation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-secondary-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-secondary-900">
              Assignment Reservasi
            </h3>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-secondary-900 mb-2">
              Detail Reservasi
            </h4>
            <div className="bg-secondary-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary-600">Tanggal:</span>
                <span className="font-medium">
                  {new Date(reservation.service_date).toLocaleDateString(
                    "id-ID"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Slot Waktu:</span>
                <span className="font-medium">{reservation.schedule_slot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Volume:</span>
                <span className="font-medium">{reservation.volume} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentAssignment
                      ? "bg-success-100 text-success-800"
                      : "bg-warning-100 text-warning-800"
                  }`}
                >
                  {currentAssignment ? "Sudah Diassign" : "Belum Diassign"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-secondary-700">
                  Pilih Staff *
                </label>
                <button
                  type="button"
                  onClick={addStaffRow}
                  className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                >
                  <MdAdd className="w-4 h-4 mr-1" />
                  Tambah Staff
                </button>
              </div>

              <div className="space-y-3">
                {selectedStaffs.map((staffId, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={staffId}
                      onChange={(e) => updateStaff(index, e.target.value)}
                      className="input-primary flex-1"
                      required
                    >
                      <option value="">-- Pilih Staff {index + 1} --</option>
                      {staffList
                        .filter(
                          (staff) =>
                            !selectedStaffs.includes(staff.id) ||
                            staff.id === staffId
                        )
                        .map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} ({staff.phone})
                          </option>
                        ))}
                    </select>
                    {selectedStaffs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStaffRow(index)}
                        className="text-danger-600 hover:text-danger-700 p-2"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-secondary-500 mt-2">
                Anda dapat menambahkan lebih dari 1 staff untuk reservasi ini.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Batal
              </button>
              <button
                type="submit"
                disabled={selectedStaffs.filter((id) => id !== "").length === 0}
                className="btn-primary"
              >
                {currentAssignment &&
                currentAssignment.staff_ids &&
                currentAssignment.staff_ids.length > 0
                  ? "Update Assignment"
                  : "Assign"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
