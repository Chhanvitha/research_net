import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import FacultyDashboard from "./pages/FacultyDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />

      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
    </Routes>
  );
}

export default App;
