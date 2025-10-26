/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import MapLocationPicker from "../components/MapLocationPicker";
import Navbar from "../components/Navbar";
import PasswordRequirements from "../components/PasswordRequirements";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const { user, setUser } = useAuth(); // tambahkan setUser dari AuthContext

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userLocations, setUserLocations] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({ label: "", address: "" });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationPickerValue, setLocationPickerValue] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "success" });
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchUserLocations();
    // eslint-disable-next-line
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("users")
      .select("name, profile_picture, phone, username")
      .eq("id", user.id)
      .single();
    setProfile(data);
    setName(data?.name || "");
    setProfilePicUrl(data?.profile_picture || "");
    setPhone(data?.phone || "");
  };

  const fetchUserLocations = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("user_locations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setUserLocations(data || []);
  };

  const handleLocationFormChange = (e) => {
    setLocationForm({
      ...locationForm,
      [e.target.name]: e.target.value,
    });
  };

  // MapLocationPicker handler
  const handleMapLocationChange = (val) => {
    setLocationForm({
      ...locationForm,
      address: val.location,
      latitude: val.latitude,
      longitude: val.longitude,
    });
    setLocationPickerValue({
      lat: val.latitude,
      lng: val.longitude,
      label: val.location, // label di sini harus address, bukan label lokasi
      address: val.location,
    });
  };

  useEffect(() => {
    if (!showLocationModal || typeof showLocationModal !== "string") {
      setLocationPickerValue(null);
    }
  }, [showLocationModal]);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocationLoading(true);
    setLocationError("");
    // Validasi alamat harus mengandung
    if (
      !locationForm.label ||
      !locationForm.address ||
      typeof locationForm.latitude === "undefined" ||
      typeof locationForm.longitude === "undefined"
    ) {
      setLocationError("Label, alamat, dan koordinat wajib diisi.");
      setLocationLoading(false);
      return;
    }
    if (!locationForm.address.toLowerCase().includes("bogor")) {
      setLocationError("Alamat harus berada di wilayah Bogor.");
      setLocationLoading(false);
      return;
    }
    const { error } = await supabase.from("user_locations").insert([
      {
        user_id: user.id,
        label: locationForm.label,
        address: locationForm.address,
        latitude: locationForm.latitude,
        longitude: locationForm.longitude,
      },
    ]);
    if (error) {
      setLocationError(error.message);
    } else {
      setShowLocationModal(false);
      setLocationForm({ label: "", address: "" });
      fetchUserLocations();
      setAlert({ message: "Lokasi berhasil ditambahkan!", type: "success" });
    }
    setLocationLoading(false);
  };

  const handleNameChange = (e) => setName(e.target.value);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    if (profilePicUrl) {
      const oldPath = profilePicUrl.split("/profile-picture/")[1];
      if (oldPath) {
        await supabase.storage.from("profile-picture").remove([oldPath]);
      }
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-picture")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setError("Gagal upload foto profil: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("profile-picture")
      .getPublicUrl(filePath);

    const url = publicUrlData?.publicUrl;
    setProfilePicUrl(url);

    await supabase
      .from("users")
      .update({ profile_picture: url })
      .eq("id", user.id);

    // Update AuthContext user agar Navbar langsung berubah
    setUser({ ...user, profile_picture: url });

    setUploading(false);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (value.startsWith("08")) {
      value = "+62" + value.slice(1);
    }
    value = value.replace(/[^+\d]/g, "");
    setPhone(value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Jika nomor HP berubah, kirim OTP ke nomor baru
    if (phone !== profile?.phone) {
      try {
        const res = await fetch(
          "https://settled-modern-stinkbug.ngrok-free.app/api/otp/send",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({ phone }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Gagal mengirim OTP.");
          setSaving(false);
          return;
        }
        setSaving(false);
        // Redirect ke verify-otp, kirim nomor baru dan flag ganti nomor
        navigate(
          `/verify-otp?phone=${encodeURIComponent(phone)}&changePhone=1`
        );
        return;
      } catch {
        setError("Gagal menghubungi server OTP.");
        setSaving(false);
        return;
      }
    }

    // Jika hanya nama yang berubah
    const { error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", user.id);
    if (error) setError(error.message);
    else {
      fetchProfile();
      setAlert({ message: "Profil berhasil diperbarui!", type: "success" });
    }
    setSaving(false);
  };

  const handleDeleteLocation = async () => {
    if (!showLocationModal || typeof showLocationModal !== "string") return;
    setLocationLoading(true);
    setLocationError("");
    const id = showLocationModal;
    const { error } = await supabase
      .from("user_locations")
      .delete()
      .eq("id", id);
    if (error) {
      setLocationError(error.message);
    } else {
      setShowLocationModal(false);
      setLocationForm({ label: "", address: "" });
      setLocationPickerValue(null);
      fetchUserLocations();
      setAlert({ message: "Lokasi berhasil dihapus!", type: "success" });
    }
    setLocationLoading(false);
  };

  const handleEditLocation = async (e) => {
    e.preventDefault();
    setLocationLoading(true);
    setLocationError("");
    if (!locationForm.label || !locationForm.address) {
      setLocationError("Label dan alamat wajib diisi.");
      setLocationLoading(false);
      return;
    }
    const id = showLocationModal;
    const { error } = await supabase
      .from("user_locations")
      .update({
        label: locationForm.label,
        address: locationForm.address,
        latitude: locationForm.latitude,
        longitude: locationForm.longitude,
      })
      .eq("id", id);
    if (error) {
      setLocationError(error.message);
    } else {
      setShowLocationModal(false);
      setLocationForm({ label: "", address: "" });
      setLocationPickerValue(null);
      fetchUserLocations();
      setAlert({ message: "Lokasi berhasil diperbarui!", type: "success" });
    }
    setLocationLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.message || "Gagal mengganti password.");
      } else {
        setPasswordSuccess("Password berhasil diganti.");
        setOldPassword("");
        setNewPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
        }, 1500);
      }
    } catch {
      setPasswordError("Gagal menghubungi server.");
    }
    setPasswordLoading(false);
  };

  // Tambahkan state untuk mendeteksi perubahan
  const isChanged =
    name !== (profile?.name || "") || phone !== (profile?.phone || "");

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: "", type: "success" })}
      />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">
          Profil Saya
        </h1>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Profile Card */}
          <div className="flex-1 min-w-0">
            <div className="card p-8">
              <form onSubmit={handleSave} className="space-y-6">
                {error && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 text-danger-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {profilePicUrl ? (
                      <img
                        src={profilePicUrl}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-primary-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-500 font-bold text-3xl">
                        {name?.[0] || "U"}
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-2 shadow hover:bg-primary-700 transition"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Ganti Foto Profil"
                    >
                      {/* Icon + */}
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleProfilePicChange}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <div className="text-primary-600 text-sm">
                      Mengunggah foto...
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="input-primary"
                    value={name}
                    onChange={handleNameChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nomor HP
                  </label>
                  <input
                    type="tel"
                    className="input-primary"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    placeholder={profile?.phone || "+6281234567890"}
                  />
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="btn-secondary w-full sm:w-auto"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Ganti Password
                  </button>
                  <button
                    type="submit"
                    className={`btn-primary w-full sm:w-auto ${
                      !isChanged
                        ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed hover:bg-gray-300"
                        : ""
                    }`}
                    disabled={saving || !isChanged}
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* User Locations Card */}
          <div className="w-full lg:w-80 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-secondary-900">
                Lokasi Anda
              </h2>
              <button
                onClick={() => setShowLocationModal(true)}
                className="btn-primary px-3 py-1 text-xs"
                type="button"
              >
                + Lokasi
              </button>
            </div>
            <div className="card p-4">
              {userLocations.length === 0 ? (
                <div className="bg-secondary-100 rounded-lg p-3 text-secondary-600 text-center text-sm">
                  Belum ada lokasi.
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-secondary-200 scrollbar-track-transparent pb-1">
                  {userLocations.map((loc) => (
                    <button
                      key={loc.id}
                      className="px-4 py-2 rounded-lg bg-secondary-100 hover:bg-primary-100 text-secondary-900 font-medium text-sm whitespace-nowrap border border-secondary-200 transition"
                      onClick={() => {
                        setLocationForm({
                          label: loc.label,
                          address: loc.address,
                          latitude: loc.latitude,
                          longitude: loc.longitude,
                        });
                        setLocationPickerValue({
                          lat: loc.latitude,
                          lng: loc.longitude,
                          label: loc.address, // label di sini harus address, bukan label lokasi
                          address: loc.address,
                        });
                        setShowLocationModal(loc.id);
                      }}
                      title={loc.address}
                      type="button"
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Modal Add/Edit Location */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-large w-full max-w-md p-6 relative">
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationForm({ label: "", address: "" });
                  setLocationError("");
                  setLocationPickerValue(null);
                }}
                className="absolute top-3 right-3 text-secondary-400 hover:text-secondary-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {typeof showLocationModal === "string"
                  ? "Detail Lokasi"
                  : "Tambah Lokasi Baru"}
              </h3>
              <form
                onSubmit={
                  typeof showLocationModal === "string"
                    ? handleEditLocation
                    : handleAddLocation
                }
                className="space-y-4"
                autoComplete="off"
              >
                {locationError && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 text-danger-700 text-sm">
                    {locationError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Label Lokasi <span className="text-danger-600">*</span>
                  </label>
                  <input
                    name="label"
                    type="text"
                    className="input-primary"
                    placeholder="Contoh: Rumah, Kantor, Gudang"
                    value={locationForm.label}
                    onChange={handleLocationFormChange}
                    required
                    disabled={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Pilih Lokasi di Peta{" "}
                    <span className="text-danger-600">*</span>
                  </label>
                  <MapLocationPicker
                    value={locationPickerValue}
                    onChange={handleMapLocationChange}
                  />
                </div>
                <div className="flex justify-between gap-2 pt-2">
                  {typeof showLocationModal === "string" && (
                    <button
                      type="button"
                      onClick={handleDeleteLocation}
                      disabled={locationLoading}
                      className="btn-secondary border border-danger-200 text-danger-700 hover:bg-danger-50"
                    >
                      Hapus
                    </button>
                  )}
                  <div className="flex-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={locationLoading}
                      className="btn-primary"
                    >
                      {locationLoading
                        ? "Menyimpan..."
                        : typeof showLocationModal === "string"
                        ? "Simpan Perubahan"
                        : "Simpan Lokasi"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal Ganti Password */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-large w-full max-w-sm p-6 relative">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setPasswordError("");
                  setPasswordSuccess("");
                  setShowOldPass(false);
                  setShowNewPass(false);
                }}
                className="absolute top-3 right-3 text-secondary-400 hover:text-secondary-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Ganti Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 text-danger-700 text-sm">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-success-700 text-sm">
                    {passwordSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Password Lama
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPass ? "text" : "password"}
                      className="input-primary pr-10"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      autoFocus
                      placeholder="Masukkan password lama"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      tabIndex={-1}
                      onClick={() => setShowOldPass((v) => !v)}
                    >
                      {showOldPass ? (
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.243 4.243L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      className="input-primary pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Password baru"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      tabIndex={-1}
                      onClick={() => setShowNewPass((v) => !v)}
                    >
                      {showNewPass ? (
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.243 4.243L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <PasswordRequirements password={newPassword} />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Menyimpan..." : "Simpan Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
