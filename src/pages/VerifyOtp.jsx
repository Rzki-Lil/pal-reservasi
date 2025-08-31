import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const email = searchParams.get("email") || "";
  const password = searchParams.get("password") || "";
  const full_name = searchParams.get("full_name") || "";
  const id_number = searchParams.get("id_number") || "";
  const profileUpdate = searchParams.get("profileUpdate") === "1";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) {
      setCode((prev) => {
        const arr = [...prev];
        arr[idx] = "";
        return arr;
      });
      return;
    }
    setCode((prev) => {
      const arr = [...prev];
      arr[idx] = val[0];
      return arr;
    });
    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (paste.length === 6) {
      setCode(paste.split(""));
      setTimeout(() => {
        inputsRef.current[5]?.focus();
      }, 10);
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const codeStr = code.join("");
    if (codeStr.length !== 6) {
      setError("Kode OTP harus 6 digit.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("https://api-pupr.bojay.xyz/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: codeStr }),
      });
      const data = await res.json();
      if (res.ok) {
        if (profileUpdate) {
          let userId = null;
          const { data: sessionData } = await supabase.auth.getSession();
          userId = sessionData?.session?.user?.id;
          if (!userId) {
            const localUser = JSON.parse(localStorage.getItem("sb-user")) || {};
            userId = localUser.id;
          }
          if (!userId) {
            setError("User tidak ditemukan. Silakan logout dan login ulang.");
            setLoading(false);
            return;
          }
          const { error: updateError } = await supabase
            .from("users")
            .update({ phone_number: phone, full_name })
            .eq("id", userId);
          if (updateError) {
            setError(updateError.message);
          } else {
            setSuccess("Nomor HP berhasil diperbarui!");
            setTimeout(() => {
              navigate("/profile");
            }, 2000);
          }
        } else {
          const { data: regData, error: regError } = await supabase.auth.signUp(
            {
              email,
              password,
              options: {
                data: {
                  full_name,
                  phone_number: phone,
                  id_number,
                },
              },
            }
          );
          if (regError) {
            setError(regError.message);
          } else {
            let userId = regData?.user?.id;
            if (!userId && regData?.user) userId = regData.user.id;
            if (!userId && regData?.session?.user?.id)
              userId = regData.session.user.id;
            if (userId) {
              await supabase
                .from("users")
                .update({ phone_number: phone })
                .eq("id", userId);
            }
            setSuccess("Verifikasi berhasil! Silakan login.");
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
        }
      } else {
        setError(data.error || "Kode OTP salah atau kedaluwarsa.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-blue-600">UPTD PAL</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Verifikasi OTP
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Masukkan kode OTP yang dikirim ke WhatsApp <b>{phone}</b>
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4 text-green-700 text-sm">
                {success}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode OTP
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((v, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={v}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? "Memverifikasi..." : "Verifikasi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
