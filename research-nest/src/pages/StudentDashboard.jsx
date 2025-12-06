// src/pages/StudentDashboard.jsx

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ExpandableCourse from "../components/ExpandableCourse";
import "./StudentDashboard.css";

export default function StudentDashboard() {

  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("enrolled");

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);

  const [courseStructure, setCourseStructure] = useState({});

  useEffect(() => {
    loadStudent();
  }, []);

  /** Load current logged in student */
  const loadStudent = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setStudent(profile);

    loadEnrolledCourses(profile.id);
    loadAllCourses();
  };

  /** Load student's enrolled courses */
  const loadEnrolledCourses = async (studentId) => {
    const { data } = await supabase
      .from("course_enrollments")
      .select("*")
      .eq("student_id", studentId);

    setEnrolledCourses(data || []);

    // Load structure for each enrolled course
    data?.forEach(c => loadFullStructure(c.course_id));
  };

  /** Load all available courses to enroll */
  const loadAllCourses = async () => {
    const { data } = await supabase.from("courses").select("*");
    setAllCourses(data || []);
  };

  /** Load full milestone → stage → task → subtask structure */
  const loadFullStructure = async (courseId) => {
  const structure = { milestones: [] };

  // Load all progress records for this student + course
  const { data: progressRecords } = await supabase
    .from("student_progress")
    .select("*")
    .eq("student_id", student.id)
    .eq("course_id", courseId);

  const getSavedStatus = (entityId) => {
    return progressRecords?.find(p => p.entity_id === entityId)?.status || "LOCKED";
  };

  // Fetch milestones
  const { data: milestones } = await supabase
    .from("course_milestones")
    .select("*")
    .eq("course_id", courseId);

  for (let m of milestones) {
    const { data: stages } = await supabase
      .from("course_stages")
      .select("*")
      .eq("milestone_id", m.id);

    const processedStages = [];

    for (let s of stages) {
      const { data: tasks } = await supabase
        .from("course_tasks")
        .select("*")
        .eq("stage_id", s.id);

      const processedTasks = [];

      for (let t of tasks) {
        const { data: subtasks } = await supabase
          .from("course_subtasks")
          .select("*")
          .eq("task_id", t.id);

        const processedSubtasks = subtasks.map(sub => ({
          ...sub,
          status: getSavedStatus(sub.id)  // 🔥 restore saved subtask progress
        }));

        processedTasks.push({
          ...t,
          subtasks: processedSubtasks
        });
      }

      processedStages.push({
        ...s,
        tasks: processedTasks
      });
    }

    structure.milestones.push({
      ...m,
      stages: processedStages
    });
  }

  setCourseStructure(prev => ({ ...prev, [courseId]: structure }));
};


  /** Enroll in a course */
  const enrollCourse = async (course) => {
  const { data, error } = await supabase
    .from("course_enrollments")
    .insert({
      student_id: student.id,
      course_id: course.id,
      course_title: course.course_title
    })
    .select()
    .single();

  if (error) {
    alert("⚠️ " + error.message);
    return;
  }

  // refresh UI
  await loadEnrolledCourses(student.id);
  setActiveTab("enrolled");
};
const isEnrolled = (courseId) => {
  return enrolledCourses.some(ec => ec.course_id === courseId);
};



  return (
    <div className="student-container">
      <h2>Hi {student?.full_name} 👋</h2>


      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === "enrolled" ? "active" : ""} onClick={() => setActiveTab("enrolled")}>
          Enrolled Courses
        </button>

        <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
          Courses List
        </button>
      </div>


      {/* Enrolled Courses View */}
      {activeTab === "enrolled" && (
        <>
          {enrolledCourses.map(c => (
            <ExpandableCourse
              key={c.id}
              course={c}
              studentId={student.id}
              structure={courseStructure[c.course_id]}
              refreshCourse={() => loadFullStructure(c.course_id)}
            />
          ))}
        </>
      )}


      {/* Available Courses View */}
      {activeTab === "all" && (
        allCourses.map(c => (
  <div key={c.id} className="course-row">
    {c.course_title}

    {isEnrolled(c.id) ? (
      <button className="enrolled-btn" disabled>Enrolled </button>
    ) : (
      <button onClick={() => enrollCourse(c)}>Enroll Now</button>
    )}
  </div>
))

      )}

    </div>
  );
}
