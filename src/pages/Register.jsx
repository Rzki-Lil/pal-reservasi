/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    id_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      isValid:
        minLength &&
        hasUppercase &&
        hasLowercase &&
        hasNumber &&
        hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://api-pupr.bojay.xyz/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone_number }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim OTP.");
        setLoading(false);
        return;
      }
      navigate(
        `/verify-otp?phone=${encodeURIComponent(
          formData.phone_number
        )}&email=${encodeURIComponent(
          formData.email
        )}&password=${encodeURIComponent(
          formData.password
        )}&full_name=${encodeURIComponent(
          formData.full_name
        )}&id_number=${encodeURIComponent(formData.id_number)}`
      );
    } catch {
      setError("Gagal menghubungi server OTP.");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    // Otomatis konversi nomor HP 08... menjadi +628...
    if (name === "phone_number") {
      if (value.startsWith("08")) {
        value = "+62" + value.slice(1);
      }
      // Hanya izinkan karakter + dan angka
      value = value.replace(/[^+\d]/g, "");
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-blue-600">UPTD PAL</h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Daftar Akun Baru
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Atau{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            masuk ke akun yang sudah ada
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Terjadi kesalahan
                    </h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700"
              >
                Nama Lengkap
              </label>
              <div className="mt-1">
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Masukkan nama lengkap"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Alamat Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="nama@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700"
              >
                Nomor HP
              </label>
              <div className="mt-1">
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Contoh: +6281234567890"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="id_number"
                className="block text-sm font-medium text-gray-700"
              >
                NIK
              </label>
              <div className="mt-1">
                <input
                  id="id_number"
                  name="id_number"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nomor Induk Kependudukan"
                  value={formData.id_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Minimal 8 karakter"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
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

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-600 mb-1">
                    Syarat password:
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.minLength
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordValidation.minLength ? "✓" : "✗"}
                    </span>
                    Minimal 8 karakter
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.hasUppercase
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordValidation.hasUppercase ? "✓" : "✗"}
                    </span>
                    Huruf besar (A-Z)
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.hasLowercase
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordValidation.hasLowercase ? "✓" : "✗"}
                    </span>
                    Huruf kecil (a-z)
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.hasNumber
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordValidation.hasNumber ? "✓" : "✗"}
                    </span>
                    Angka (0-9)
                  </div>
                  <div
                    className={`text-xs flex items-center ${
                      passwordValidation.hasSpecialChar
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span className="mr-1">
                      {passwordValidation.hasSpecialChar ? "✓" : "✗"}
                    </span>
                    Karakter khusus (!@#$%^&*)
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !passwordValidation.isValid}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                {loading ? "Mendaftar..." : "Daftar Sekarang"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
