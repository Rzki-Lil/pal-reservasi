import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const { user, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [alert, setAlert] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (value.startsWith("0")) {
      value = "+62" + value.slice(1);
    }
    if (value.startsWith("8")) {
      value = "+62" + value.slice(1);
    }
    if (value.startsWith("62")) {
      value = "+6" + value.slice(1);
    }
    value = value.replace(/[^+\d]/g, "");
    setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ message: "", type: "success" });

    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ phone, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        await signIn(data.token, data.user);
        setAlert({ message: "Berhasil masuk! Mengalihkan ke dashboard...", type: "success" });
        setTimeout(() => {
          if (data.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 1000);
      } else {
        setAlert({ message: data.message || "Gagal masuk! Periksa nomor HP dan password Anda.", type: "error" });
      }
    } catch (error) {
      setAlert({ message: "Terjadi kesalahan. Coba lagi.", type: "error" });
    }

    setLoading(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setAlert({ message: "", type: "success" });
    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/otp/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ phone: forgotPhone }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setAlert({ message: data.message || "Gagal mengirim OTP.", type: "error" });
        setForgotLoading(false);
        return;
      }
      setShowForgot(false);
      setForgotPhone("");
      setAlert({ message: "Kode OTP berhasil dikirim ke WhatsApp Anda.", type: "success" });
      navigate(`/verify-otp?phone=${encodeURIComponent(forgotPhone)}&forgot=1`);
    } catch {
      setAlert({ message: "Gagal menghubungi server.", type: "error" });
    }
    setForgotLoading(false);
  };

  const handleForgotPhoneChange = (e) => {
    let value = e.target.value;
    if (value.startsWith("08")) {
      value = "+62" + value.slice(1);
    }
    value = value.replace(/[^+\d]/g, "");
    setForgotPhone(value);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <Alert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ message: "", type: "success" })}
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-blue-600">UPTD PAL</h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Atau{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            daftar akun baru
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Nomor HP
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Masukan No HP"
                  value={phone}
                  onChange={handlePhoneChange}
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
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
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
                {loading ? "Masuk..." : "Masuk"}
              </button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-blue-600 hover:underline text-sm"
              onClick={() => setShowForgot(true)}
            >
              Lupa Password?
            </button>
          </div>
        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-large w-full max-w-sm p-6 relative">
            <button
              onClick={() => {
                setShowForgot(false);
                setForgotPhone("");
                setForgotError("");
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
              Reset Password
            </h3>
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Masukkan nomor HP terdaftar
                </label>
                <input
                  type="tel"
                  className="input-primary"
                  value={forgotPhone}
                  onChange={handleForgotPhoneChange}
                  required
                  placeholder="+6281234567890"
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="btn-primary w-full"
              >
                {forgotLoading ? "Mengirim OTP..." : "Kirim OTP"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
