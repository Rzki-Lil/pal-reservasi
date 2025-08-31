import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import BuatReservasi from "./pages/BuatReservasi";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Riwayat from "./pages/Riwayat";
import VerifyOtp from "./pages/VerifyOtp";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservasi/buat"
            element={
              <ProtectedRoute>
                <BuatReservasi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat"
            element={
              <ProtectedRoute>
                <Riwayat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/verify-otp" element={<VerifyOtp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
