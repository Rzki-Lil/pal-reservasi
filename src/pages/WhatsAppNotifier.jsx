/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  MdAccessTime,
  MdCheckCircle,
  MdEdit,
  MdError,
  MdRefresh,
  MdSend,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

export default function WhatsAppNotifier() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    template: "",
    active: true,
  });
  const [alert, setAlert] = useState({ message: "", type: "success" });
  const [activeTab, setActiveTab] = useState("notifications");
  const [sendModal, setSendModal] = useState({ show: false, template: null });
  const [users, setUsers] = useState([]);
  const [sending] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const showAlert = (type, message) => {
    setAlert({ message, type });
  };

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
        navigate("/dashboard");
        return;
      }
      setLoading(false);
    } catch {
      navigate("/login");
    }
  };

  const fetchData = async () => {
    try {
      const [notifRes, templateRes, usersRes] = await Promise.all([
        fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/admin/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        ),
        fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/admin/notification_templates",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        ),
        fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/admin/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        ),
      ]);

      const [notifData, templateData, usersData] = await Promise.all([
        notifRes.json(),
        templateRes.json(),
        usersRes.json(),
      ]);

      setNotifications(Array.isArray(notifData) ? notifData : []);
      setTemplates(Array.isArray(templateData) ? templateData : []);
      setUsers(
        Array.isArray(usersData)
          ? usersData.filter((u) => u.role === "user" && u.notify_information)
          : []
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setNotifications([]);
      setTemplates([]);
      setUsers([]);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      template: template.template,
      active: template.active,
    });
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `https://settled-modern-stinkbug.ngrok-free.app/api/admin/notification_templates/${editingTemplate.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(templateForm),
        }
      );

      if (res.ok) {
        await fetchData();
        setEditingTemplate(null);
        setTemplateForm({ template: "", active: true });
        showAlert("success", "Template berhasil diupdate!");
      } else {
        showAlert("error", "Gagal mengupdate template!");
      }
    } catch (error) {
      console.error("Failed to update template:", error);
      showAlert("error", "Terjadi kesalahan saat mengupdate template!");
    }
  };

  const handleSendBroadcast = async () => {
    if (!sendModal.template) {
      showAlert("error", "Template tidak ditemukan!");
      return;
    }

    if (users.length === 0) {
      showAlert(
        "error",
        "Tidak ada user yang mengaktifkan notifikasi information!"
      );
      return;
    }

    setSendModal({ show: false, template: null });
    showAlert(
      "success",
      `Broadcast dimulai untuk ${users.length} user. Proses berjalan di background.`
    );

    try {
      fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/admin/send-information-broadcast",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            template_type: sendModal.template.type,
            variables: {},
          }),
        }
      );

      setTimeout(() => fetchData(), 10000);
    } catch (error) {
      console.error("Failed to start broadcast:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: {
        color: "bg-success-100 text-success-800 border-success-200",
        icon: MdCheckCircle,
      },
      failed: {
        color: "bg-danger-100 text-danger-800 border-danger-200",
        icon: MdError,
      },
      pending: {
        color: "bg-warning-100 text-warning-800 border-warning-200",
        icon: MdAccessTime,
      },
    };
    return badges[status] || badges.pending;
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
      <Navbar />
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: "", type: "success" })}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Send Broadcast Modal */}
        {sendModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Broadcast Notifikasi: {sendModal.template?.type}
              </h3>

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  📢 Broadcast Information
                </p>
                <p className="text-xs text-blue-700">
                  Pesan akan dikirim ke{" "}
                  <span className="font-bold">{users.length} user</span> yang
                  mengaktifkan notifikasi information.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  ⏱️ Estimasi waktu: ~{Math.ceil((users.length * 10) / 60)}{" "}
                  menit (10 detik/user)
                </p>
              </div>

              <div className="mb-4 p-3 bg-secondary-50 rounded-lg">
                <p className="text-xs font-medium text-secondary-600 mb-2">
                  Preview Pesan:
                </p>
                <pre className="text-sm text-secondary-700 whitespace-pre-wrap font-sans">
                  {sendModal.template?.template}
                </pre>
              </div>

              {sending && (
                <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning-600"></div>
                    <p className="text-sm text-warning-800">
                      Sedang mengirim broadcast... Harap tunggu.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    if (!sending) {
                      setSendModal({ show: false, template: null });
                    }
                  }}
                  className="btn-secondary"
                  disabled={sending}
                >
                  {sending ? "Mengirim..." : "Batal"}
                </button>
                <button
                  onClick={handleSendBroadcast}
                  className="btn-primary flex items-center"
                  disabled={sending || users.length === 0}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <MdSend className="w-4 h-4 mr-2" />
                      Kirim Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            WhatsApp Notifier
          </h1>
          <p className="text-secondary-600 mt-1">
            Kelola notifikasi WhatsApp dan template pesan
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-secondary-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "notifications"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
              }`}
            >
              Riwayat Notifikasi ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "templates"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
              }`}
            >
              Template Pesan ({templates.length})
            </button>
          </div>
        </div>

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-secondary-900">
                Riwayat Notifikasi WhatsApp
              </h2>
              <button
                onClick={fetchData}
                className="btn-secondary text-sm flex items-center"
              >
                <MdRefresh className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-secondary-500">
                  Belum ada notifikasi terkirim
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Reservasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {notifications.map((notif) => {
                      const statusInfo = getStatusBadge(notif.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={notif.id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                            {new Date(notif.created_at).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div>
                              <div className="font-medium text-secondary-900">
                                {notif.users?.name}
                              </div>
                              <div className="text-secondary-500">
                                {notif.users?.phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                            {notif.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {notif.reservations ? (
                              <div>
                                <div className="text-secondary-900">
                                  {notif.reservations.services?.name}
                                </div>
                                <div className="text-xs text-secondary-500">
                                  {new Date(
                                    notif.reservations.service_date
                                  ).toLocaleDateString("id-ID")}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                            >
                              <StatusIcon className="w-4 h-4 mr-1" />
                              {notif.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            {/* Edit Form */}
            {editingTemplate && (
              <div className="card p-6 border-2 border-primary-300 bg-primary-50">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Edit Template: {editingTemplate.type}
                </h3>

                {/* Tutorial Section */}
                <div className="mb-6 p-4 bg-white rounded-lg border border-primary-200">
                  <h4 className="font-medium text-secondary-900 mb-2">
                    📝 Cara Menggunakan Variabel:
                  </h4>
                  <p className="text-sm text-secondary-600 mb-3">
                    Gunakan format{" "}
                    <code className="bg-secondary-100 px-1 py-0.5 rounded">
                      {"{{nama_variabel}}"}
                    </code>{" "}
                    untuk menambahkan data dinamis ke template.
                  </p>
                  <div className="text-sm text-secondary-700">
                    <p className="font-medium mb-2">
                      Variabel yang tersedia untuk template ini:
                    </p>
                    {editingTemplate.category === "information" ? (
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <code>{"{{name}}"}</code> - Nama user
                        </li>
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <code>{"{{name}}"}</code> - Nama user
                        </li>
                        <li>
                          <code>{"{{service_name}}"}</code> - Nama layanan
                        </li>
                        <li>
                          <code>{"{{service_date}}"}</code> - Tanggal layanan
                        </li>
                        <li>
                          <code>{"{{schedule_slot}}"}</code> - Slot waktu
                        </li>
                        <li>
                          <code>{"{{address}}"}</code> - Alamat
                        </li>
                        <li>
                          <code>{"{{staff_names}}"}</code> - Nama staff yang
                          di-assign
                        </li>
                        <li>
                          <code>{"{{volume}}"}</code> - Volume (m³)
                        </li>
                      </ul>
                    )}
                  </div>
                </div>

                <form onSubmit={handleUpdateTemplate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Template Pesan
                    </label>
                    <textarea
                      value={templateForm.template}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          template: e.target.value,
                        })
                      }
                      rows={8}
                      className="input-primary resize-none font-mono text-sm"
                      placeholder="Contoh: Halo {{name}}, reservasi Anda untuk {{service_name}} pada {{service_date}} telah di-assign ke {{staff_names}}."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={templateForm.active}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                    <label
                      htmlFor="active"
                      className="ml-2 text-sm text-secondary-700"
                    >
                      Template Aktif
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setTemplateForm({ template: "", active: true });
                      }}
                      className="btn-secondary"
                    >
                      Batal
                    </button>
                    <button type="submit" className="btn-primary">
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Templates List */}
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`card p-6 ${
                    !template.active ? "opacity-60 bg-secondary-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {template.type}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        Kategori: {template.category}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {template.category === "information" && (
                        <button
                          onClick={() => setSendModal({ show: true, template })}
                          className="px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors flex items-center"
                          title="Broadcast ke semua user"
                        >
                          <MdSend className="w-3 h-3 mr-1" />
                          Broadcast ({users.length})
                        </button>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.active
                            ? "bg-success-100 text-success-800"
                            : "bg-secondary-100 text-secondary-800"
                        }`}
                      >
                        {template.active ? "Aktif" : "Nonaktif"}
                      </span>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <MdEdit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <pre className="text-sm text-secondary-700 whitespace-pre-wrap font-sans">
                      {template.template}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
