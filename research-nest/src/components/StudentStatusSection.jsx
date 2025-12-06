import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./StudentStatusSection.css";

export default function StudentStatusSection() {
  const [email, setEmail] = useState("");
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseStatus, setCourseStatus] = useState({});
  const [courseStructure, setCourseStructure] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);

  /** Search Student */
  const searchStudent = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .eq("role", "STUDENT")
      .single();

    setStudent(data);

    if (data) {
      const { data: enrolled } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("student_id", data.id);

      setCourses(enrolled || []);
      enrolled?.forEach(c => fetchCourseDetails(data.id, c.course_id));
    }
  };

  /** Fetch course structure + calculated status */
  const fetchCourseDetails = async (studentId, courseId) => {
    const structure = { milestones: [] };

    const { data: progressRecords } = await supabase
      .from("student_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId);

    const { data: milestones } = await supabase
      .from("course_milestones")
      .select("*")
      .eq("course_id", courseId);

    for (let m of milestones) {
      const { data: stages } = await supabase
        .from("course_stages")
        .select("*")
        .eq("milestone_id", m.id);

      const stageList = [];

      for (let s of stages) {
        const { data: tasks } = await supabase
          .from("course_tasks")
          .select("*")
          .eq("stage_id", s.id);

        const taskList = [];

        for (let t of tasks) {
          const { data: subtasks } = await supabase
            .from("course_subtasks")
            .select("*")
            .eq("task_id", t.id);

          const processedSubtasks = subtasks.map(sub => ({
            ...sub,
            status:
              progressRecords?.find(p => p.entity_id === sub.id)?.status ||
              "LOCKED"
          }));

          taskList.push({ ...t, subtasks: processedSubtasks });
        }

        stageList.push({ ...s, tasks: taskList });
      }

      structure.milestones.push({ ...m, stages: stageList });
    }

    /** ---- Recalculate ---- */
    const calculateStatus = (items) => {
      const statuses = items.map(i => i.status || i.calculatedStatus);
      if (statuses.every(s => s === "COMPLETED")) return "COMPLETED";
      if (statuses.some(s => s === "IN_PROGRESS")) return "IN_PROGRESS";
      return "LOCKED";
    };

    structure.milestones.forEach(m => {
      m.stages.forEach(s => {
        s.tasks.forEach(t => {
          t.calculatedStatus = calculateStatus(t.subtasks);
        });
        s.calculatedStatus = calculateStatus(s.tasks);
      });
      m.calculatedStatus = calculateStatus(m.stages);
    });

    const finalStatus = calculateStatus(structure.milestones);

    setCourseStatus(prev => ({ ...prev, [courseId]: finalStatus }));
    setCourseStructure(prev => ({ ...prev, [courseId]: structure }));
  };

  /** Update Subtask Status */
  const updateSubtaskStatus = async (courseId, subtaskId, newStatus) => {
  const { error } = await supabase.from("student_progress")
    .upsert(
      {
        student_id: studentId,
        course_id: courseId,
        entity_type: "SUBTASK",
        entity_id: subtaskId,
        status: newStatus
      },
      { onConflict: "student_id,entity_type,entity_id" }
    );

  if (error) {
    console.error("Update failed:", error);
    return;
  }

  // Ensure Supabase finishes writing before refreshing UI
  await refreshCourse();
};


  const toggleExpand = (courseId) => {
    setExpandedCourse(prev => (prev === courseId ? null : courseId));
  };

  return (
    <div>
      <h3>Search Student</h3>

      <input
        placeholder="Enter student email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={searchStudent}>Search</button>

      {student && (
        <>
          <h4>{student.full_name}</h4>
          <h5>Enrolled Courses:</h5>

          {courses.length === 0 && <p>No courses enrolled.</p>}

          {courses.map((c) => (
            <div key={c.id} className="course-box">
              <div className="course-header" onClick={() => toggleExpand(c.course_id)}>
                {c.course_title}
                <span className={`status-badge ${courseStatus[c.course_id]?.toLowerCase()}`}>
                  {courseStatus[c.course_id] || "Loading..."}
                </span>
                <span>{expandedCourse === c.course_id ? "▲" : "▼"}</span>
              </div>

              {expandedCourse === c.course_id && courseStructure[c.course_id] && (
                <div className="structure">
                  {courseStructure[c.course_id].milestones.map(m => (
                    <div key={m.id}>
                      📌 {m.milestone_title} — <strong>{m.calculatedStatus}</strong>
                      {m.stages.map(s => (
                        <div key={s.id} style={{ marginLeft: 20 }}>
                          ↳ {s.stage_title} — <strong>{s.calculatedStatus}</strong>
                          {s.tasks.map(t => (
                            <div key={t.id} style={{ marginLeft: 40 }}>
                              ➡ {t.task_title} — <strong>{t.calculatedStatus}</strong>
                              {t.subtasks.map(sub => (
                                <div key={sub.id} style={{ marginLeft: 60 }}>
                                  🔹 {sub.subtask_title} — 
                                  <select
                                    value={sub.status}
                                    onChange={async (e) => await updateSubtaskStatus(course.course_id, sub.id, e.target.value)}
                                  >
                                    <option value="LOCKED">LOCKED</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
