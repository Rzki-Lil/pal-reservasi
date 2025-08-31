/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import MapLocationPicker from "../components/MapLocationPicker";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userLocations, setUserLocations] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({ label: "", location: "" });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationPickerValue, setLocationPickerValue] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "success" });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingPhone, setPendingPhone] = useState(""); 
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
      .select("full_name, profile_picture, phone_number")
      .eq("id", user.id)
      .single();
    setProfile(data);
    setFullName(data?.full_name || "");
    setProfilePicUrl(data?.profile_picture || "");
    setPhoneNumber(data?.phone_number || "");
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
      location: val.location,
      latitude: val.latitude,
      longitude: val.longitude,
    });
    setLocationPickerValue({
      lat: val.latitude,
      lng: val.longitude,
      label: val.location,
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
    if (
      !locationForm.label ||
      !locationForm.location ||
      typeof locationForm.latitude === "undefined" ||
      typeof locationForm.longitude === "undefined"
    ) {
      setLocationError("Label, alamat, dan koordinat wajib diisi.");
      setLocationLoading(false);
      return;
    }
    const { error } = await supabase.from("user_locations").insert([
      {
        user_id: user.id,
        label: locationForm.label,
        location: locationForm.location,
        latitude: locationForm.latitude,
        longitude: locationForm.longitude,
      },
    ]);
    if (error) {
      setLocationError(error.message);
    } else {
      setShowLocationModal(false);
      setLocationForm({ label: "", location: "" });
      fetchUserLocations();
      setAlert({ message: "Lokasi berhasil ditambahkan!", type: "success" });
    }
    setLocationLoading(false);
  };

  const handleNameChange = (e) => setFullName(e.target.value);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    if (profilePicUrl) {
      const oldPath = profilePicUrl.split("/user-profile/")[1];
      if (oldPath) {
        await supabase.storage.from("user-profile").remove([oldPath]);
      }
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("user-profile")
      .upload(filePath, file, { upsert: false }); 

    if (uploadError) {
      setError("Gagal upload foto profil: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("user-profile")
      .getPublicUrl(filePath);

    const url = publicUrlData?.publicUrl;
    setProfilePicUrl(url);

    await supabase
      .from("users")
      .update({ profile_picture: url })
      .eq("id", user.id);

    setUploading(false);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (value.startsWith("08")) {
      value = "+62" + value.slice(1);
    }
    value = value.replace(/[^+\d]/g, "");
    setPhoneNumber(value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (phoneNumber !== profile?.phone_number) {
      try {
        const res = await fetch("https://api-pupr.bojay.xyz/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Gagal mengirim OTP.");
          setSaving(false);
          return;
        }
        setPendingPhone(phoneNumber);
        setSaving(false);
        navigate(
          `/verify-otp?phone=${encodeURIComponent(
            phoneNumber
          )}&profileUpdate=1&full_name=${encodeURIComponent(fullName)}`
        );
        return;
      } catch {
        setError("Gagal menghubungi server OTP.");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName })
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
      setLocationForm({ label: "", location: "" });
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
    if (!locationForm.label || !locationForm.location) {
      setLocationError("Label dan alamat wajib diisi.");
      setLocationLoading(false);
      return;
    }
    const id = showLocationModal;
    const { error } = await supabase
      .from("user_locations")
      .update({
        label: locationForm.label,
        location: locationForm.location,
        latitude: locationForm.latitude,
        longitude: locationForm.longitude,
      })
      .eq("id", id);
    if (error) {
      setLocationError(error.message);
    } else {
      setShowLocationModal(false);
      setLocationForm({ label: "", location: "" });
      setLocationPickerValue(null);
      fetchUserLocations();
      setAlert({ message: "Lokasi berhasil diperbarui!", type: "success" });
    }
    setLocationLoading(false);
  };

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
                        {fullName?.[0] || "U"}
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
                    value={fullName}
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
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    required
                    placeholder={profile?.phone_number || "+6281234567890"}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
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
                          location: loc.location,
                          latitude: loc.latitude,
                          longitude: loc.longitude,
                        });
                        setLocationPickerValue({
                          lat: loc.latitude,
                          lng: loc.longitude,
                          label: loc.label, // <-- Ganti label jadi location
                          location: loc.location, // <-- Tambahkan property location
                        });
                        setShowLocationModal(loc.id);
                      }}
                      title={loc.location}
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
                  setLocationForm({ label: "", location: "" });
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
      </div>
    </div>
  );
}
