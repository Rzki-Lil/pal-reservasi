import React from "react";
import { validatePassword } from "../utils/passwordUtils";

export default function PasswordRequirements({ password }) {
  const v = validatePassword(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="text-xs text-gray-600 mb-1">Syarat password:</div>
      <div
        className={`text-xs flex items-center ${
          v.minLength ? "text-green-600" : "text-red-600"
        }`}
      >
        <span className="mr-1">{v.minLength ? "✓" : "✗"}</span>
        Minimal 8 karakter
      </div>
      <div
        className={`text-xs flex items-center ${
          v.hasUppercase ? "text-green-600" : "text-red-600"
        }`}
      >
        <span className="mr-1">{v.hasUppercase ? "✓" : "✗"}</span>
        Huruf besar (A-Z)
      </div>
      <div
        className={`text-xs flex items-center ${
          v.hasLowercase ? "text-green-600" : "text-red-600"
        }`}
      >
        <span className="mr-1">{v.hasLowercase ? "✓" : "✗"}</span>
        Huruf kecil (a-z)
      </div>
      <div
        className={`text-xs flex items-center ${
          v.hasNumber ? "text-green-600" : "text-red-600"
        }`}
      >
        <span className="mr-1">{v.hasNumber ? "✓" : "✗"}</span>
        Angka (0-9)
      </div>
      <div
        className={`text-xs flex items-center ${
          v.hasSpecialChar ? "text-green-600" : "text-red-600"
        }`}
      >
        <span className="mr-1">{v.hasSpecialChar ? "✓" : "✗"}</span>
        Karakter khusus (!@#$%^&*)
      </div>
    </div>
  );
}
