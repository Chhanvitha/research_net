import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<AuthPage />} />

      {/* Protected Routes */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty-dashboard"
        element={
          <ProtectedRoute>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
