/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdFileDownload,
  MdRefresh,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

const TABLES = [
  { key: "users", label: "Users" },
  { key: "services", label: "Services" },
  { key: "user_locations", label: "User Locations" },
  { key: "reservations", label: "Reservations" },
  { key: "payments", label: "Payments" },
  { key: "assignments", label: "Assignments" },
  { key: "assignment_staffs", label: "Assignment Staffs" },
  { key: "schedule_slots", label: "Schedule Slots" },
  { key: "notification_templates", label: "Notification Templates" },
];

export default function TablesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState("users");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  const [alert, setAlert] = useState({ message: "", type: "success" });

  const showAlert = (type, message) => {
    setAlert({ message, type });
  };

  useEffect(() => {
    checkAdminAccess();
  }, [token]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
      setCurrentPage(1);
      setSearchQuery("");
    }
  }, [selectedTable]);

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
        navigate("/admin");
        return;
      }
    } catch {
      navigate("/login");
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/admin/${selectedTable}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      const data = await res.json();
      setTableData(data || []);
    } catch (error) {
      console.error("Failed to fetch table data:", error);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/admin/${selectedTable}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(formData),
        }
      );
      if (res.ok) {
        await fetchTableData();
        setShowAddForm(false);
        setFormData({});
        showAlert("success", "Data berhasil ditambahkan!");
      } else {
        showAlert("error", "Gagal menambahkan data!");
      }
    } catch (error) {
      console.error("Failed to create:", error);
      showAlert("error", "Terjadi kesalahan saat menambahkan data!");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/admin/${selectedTable}/${editingItem.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(formData),
        }
      );
      if (res.ok) {
        await fetchTableData();
        setEditingItem(null);
        setFormData({});
        showAlert("success", "Data berhasil diupdate!");
      } else {
        showAlert("error", "Gagal mengupdate data!");
      }
    } catch (error) {
      console.error("Failed to update:", error);
      showAlert("error", "Terjadi kesalahan saat mengupdate data!");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/admin/${selectedTable}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      if (res.ok) {
        await fetchTableData();
        showAlert("success", "Data berhasil dihapus!");
      } else {
        showAlert("error", "Gagal menghapus data!");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      showAlert("error", "Terjadi kesalahan saat menghapus data!");
    }
  };

  const renderTableColumns = () => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]).filter((key) => key !== "password_hash");
  };

  const renderCellValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "✓" : "✗";
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 50) + "...";
    }
    return String(value);
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
  };

  const startAdd = () => {
    setShowAddForm(true);
    setFormData({});
  };

  const renderForm = (isEdit = false) => {
    const columns = renderTableColumns();
    return (
      <form
        onSubmit={isEdit ? handleUpdate : handleCreate}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {columns.map((column) => {
            if (
              column === "id" ||
              column === "created_at" ||
              column === "updated_at"
            )
              return null;
            return (
              <div key={column}>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  {column
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <input
                  type="text"
                  className="input-primary"
                  value={formData[column] || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [column]: e.target.value })
                  }
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setEditingItem(null);
              setFormData({});
            }}
            className="btn-secondary"
          >
            Batal
          </button>
          <button type="submit" className="btn-primary">
            {isEdit ? "Update" : "Tambah"}
          </button>
        </div>
      </form>
    );
  };

  const getFilteredData = () => {
    let filtered = tableData;

    if (searchQuery.trim()) {
      filtered = filtered.filter((item) => {
        return Object.values(item).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value)
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        });
      });
    }

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      showAlert("error", "Tidak ada data untuk diexport!");
      return;
    }

    const columns = renderTableColumns();

    let csvContent = "data:text/csv;charset=utf-8,";

    csvContent +=
      columns
        .map((col) => `"${col.replace(/_/g, " ").toUpperCase()}"`)
        .join(",") + "\n";

    filteredData.forEach((item) => {
      const row = columns.map((col) => {
        let value = item[col];

        if (value === null || value === undefined) {
          value = "";
        } else if (typeof value === "boolean") {
          value = value ? "TRUE" : "FALSE";
        } else if (typeof value === "object") {
          value = JSON.stringify(value);
        } else {
          value = String(value);
        }

        return `"${value.replace(/"/g, '""')}"`;
      });

      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    const timestamp = new Date().toISOString().slice(0, 10);
    const tableName =
      TABLES.find((t) => t.key === selectedTable)?.label || selectedTable;
    link.setAttribute("download", `${tableName}_${timestamp}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert("success", "Data berhasil diexport!");
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: "", type: "success" })}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Database Tables Management
          </h1>
          <p className="text-secondary-600 mt-1">
            Kelola semua data database dengan mudah
          </p>
        </div>

        <div className="card p-6">
          {/* Table Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="input-primary max-w-xs"
            >
              {TABLES.map((table) => (
                <option key={table.key} value={table.key}>
                  {table.label}
                </option>
              ))}
            </select>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="input-primary pl-10 pr-4"
                />
                <svg
                  className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={startAdd}
                className="btn-primary text-sm flex items-center"
              >
                <MdAdd className="w-4 h-4 mr-1" />
                Tambah
              </button>
              <button
                onClick={fetchTableData}
                className="btn-secondary text-sm flex items-center"
                disabled={loading}
              >
                <MdRefresh
                  className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-secondary-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="input-primary py-1 px-2 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-secondary-600">entries</span>
            </div>

            <div className="text-sm text-secondary-600">
              Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(endIndex, filteredData.length)} of {filteredData.length}{" "}
              entries
              {searchQuery && ` (filtered from ${tableData.length} total)`}
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h3 className="text-lg font-medium text-primary-900 mb-4">
                Tambah Data Baru
              </h3>
              {renderForm(false)}
            </div>
          )}

          {/* Edit Form */}
          {editingItem && (
            <div className="mb-6 p-4 bg-warning-50 rounded-lg border border-warning-200">
              <h3 className="text-lg font-medium text-warning-900 mb-4">
                Edit Data
              </h3>
              {renderForm(true)}
            </div>
          )}

          {/* Table Data */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-500 mt-2">Loading...</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-500">
                {searchQuery ? "No matching data found" : "Tidak ada data"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      {renderTableColumns().map((column) => (
                        <th
                          key={column}
                          className={`px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider ${
                            column === "created_at" || column === "updated_at"
                              ? "cursor-pointer select-none hover:bg-secondary-100"
                              : ""
                          }`}
                          onClick={() => {
                            if (
                              column === "created_at" ||
                              column === "updated_at"
                            ) {
                              handleSort(column);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.replace(/_/g, " ")}</span>
                            {(column === "created_at" ||
                              column === "updated_at") && (
                              <div className="flex flex-col">
                                <svg
                                  className={`w-3 h-3 ${
                                    sortConfig.key === column &&
                                    sortConfig.direction === "asc"
                                      ? "text-primary-600"
                                      : "text-secondary-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
                                </svg>
                                <svg
                                  className={`w-3 h-3 -mt-1 ${
                                    sortConfig.key === column &&
                                    sortConfig.direction === "desc"
                                      ? "text-primary-600"
                                      : "text-secondary-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {currentData.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="hover:bg-secondary-50"
                      >
                        {renderTableColumns().map((column) => (
                          <td
                            key={column}
                            className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900"
                          >
                            {renderCellValue(item[column])}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-danger-600 hover:text-danger-900"
                              title="Delete"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Export Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={exportToExcel}
                  className="btn-primary text-sm flex items-center"
                  disabled={loading || filteredData.length === 0}
                >
                  <MdFileDownload className="w-4 h-4 mr-2" />
                  Export to Excel ({filteredData.length} rows)
                </button>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-1 text-secondary-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-primary-600 text-white"
                            : "text-secondary-600 hover:text-primary-600 hover:bg-secondary-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
