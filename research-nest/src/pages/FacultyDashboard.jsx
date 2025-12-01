import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import CoursesSection from "../components/CoursesSection";
import StudentStatusSection from "../components/StudentStatusSection";
import "./FacultyDashboard.css"; 

export default function FacultyDashboard() {
  const [faculty, setFaculty] = useState(null);
  const [activeTab, setActiveTab] = useState("courses");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return navigate("/");

    const userId = sessionData.session.user.id;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) console.error(error);
    setFaculty(profile);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="faculty-container">
      <div className="top-bar">
      <h2 className="title">Faculty Dashboard</h2>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
       </div>

    
      {faculty && <p>Hi <strong>{faculty.full_name}</strong> </p>}

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === "student" ? "active" : ""}
          onClick={() => setActiveTab("student")}
        >
          Student Status
        </button>
        <button 
          className={activeTab === "courses" ? "active" : ""}
          onClick={() => setActiveTab("courses")}
        >
          Courses
        </button>
      </div>

      {/* Dynamic Section Rendering */}
      {activeTab === "courses" && <CoursesSection facultyId={faculty?.id} />}
      {activeTab === "student" && <StudentStatusSection />}

    </div>
  );
}
