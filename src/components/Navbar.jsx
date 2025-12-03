import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, token, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (token) {
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
          if (res.ok) {
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching role:", error);
        }
      }
    };
    fetchRole();
  }, [token]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      label: "Buat Reservasi",
      path: "/reservasi/buat",
      icon: "M12 4v16m8-8H4",
    },
    {
      label: "Riwayat",
      path: "/riwayat",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Profile",
      path: "/profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  const adminNavItems = [
    {
      label: "Admin Dashboard",
      path: "/admin",
      icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
    },
    {
      label: "Database Tables",
      path: "/admin/tables",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
      label: "WhatsApp Notifier",
      path: "/admin/whatsapp",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
  ];

  const employeeNavItems = [
    {
      label: "Dashboard Petugas",
      path: "/employee",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      label: "Riwayat",
      path: "/riwayat",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Profile",
      path: "/profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  const currentNavItems =
    userRole === "admin"
      ? adminNavItems
      : userRole === "employee"
      ? employeeNavItems
      : navItems;

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
            {/* Back Button */}
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 transition-all duration-200"
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
            )}

            {/* Navigation Items */}
            {currentNavItems.map((item) => (
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
              {currentNavItems.map((item) => (
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
