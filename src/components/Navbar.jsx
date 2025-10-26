import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Only show navItems for non-admin users
  const navItems =
    user?.role === "admin"
      ? []
      : [
          {
            path: "/dashboard",
            label: "Dashboard",
            icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
          },
          {
            path: "/reservasi/buat",
            label: "Buat Reservasi",
            icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
          },
          {
            path: "/riwayat",
            label: "Riwayat",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
          },
        ];

  return (
    <nav className="bg-white shadow-soft border-b border-secondary-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center space-x-3 group focus:outline-none"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.781 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z"
                />
              </svg>
            </div>
            <div className="hidden sm:block text-left">
              <h1 className="text-lg font-bold text-secondary-900">UPTD PAL</h1>
              <p className="text-xs text-secondary-600 -mt-1">Kota Bogor</p>
            </div>
          </button>

          <div className="hidden md:flex items-center space-x-1">
            {/* Tombol kembali */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-secondary-600 hover:text-primary-600 hover:bg-secondary-50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Kembali</span>
            </button>
            {/* Only show navItems for non-admin */}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-primary-100 text-primary-700"
                    : "text-secondary-600 hover:text-primary-600 hover:bg-secondary-50"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <button
              className="hidden lg:flex items-center space-x-2 text-right focus:outline-none"
              onClick={() => navigate("/profile")}
              title="Pengaturan Profil"
            >
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border border-secondary-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-500 font-bold text-lg">
                  {user?.name?.[0] || "U"}
                </div>
              )}
              <span>
                <p className="text-sm font-medium text-secondary-900">
                  {user?.name}
                </p>
                <p className="text-xs text-secondary-500">
                  {user?.role === "admin" ? "Admin" : "Pengguna Aktif"}
                </p>
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
            >
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
                  d={
                    isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-200 animate-slide-down">
            <div className="space-y-2">
              {/* Only show navItems for non-admin */}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-primary-100 text-primary-700"
                      : "text-secondary-600 hover:text-primary-600 hover:bg-secondary-50"
                  }`}
                >
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
                      d={item.icon}
                    />
                  </svg>
                  <span>{item.label}</span>
                </Link>
              ))}
              {/* Profile */}
              <div
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary-700 cursor-pointer hover:text-primary-700 group"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/profile");
                }}
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-secondary-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-500 font-bold text-base">
                    {user?.name?.[0] || "U"}
                  </div>
                )}
                <span>
                  <span className="group-hover:hidden">Profil Saya</span>
                  <span className="hidden group-hover:inline">
                    {user?.name}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
