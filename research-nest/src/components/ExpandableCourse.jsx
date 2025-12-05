import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ExpandableCourse({ course, studentId, structure, refreshCourse }) {

  const [open, setOpen] = useState(false);

  /** ---- FIXED: Load structure on expand ---- */
  const toggleOpen = async () => {
    if (!open && !structure) {
      await refreshCourse(); 
    }
    setOpen(!open);
  };

  /** -------- STATUS CALCULATOR FUNCTION -------- */
  const calculateStatus = (items) => {
    const statuses = items.map(item => item.status || item.calculatedStatus);

    if (statuses.every(s => s === "COMPLETED")) return "COMPLETED";
    if (statuses.some(s => s === "IN_PROGRESS")) return "IN_PROGRESS";
    if (statuses.every(s => s === "LOCKED")) return "LOCKED";

    return "IN_PROGRESS";
  };

  /** -------- UPDATE SUBTASK STATUS -------- */
  const updateSubtaskStatus = async (subtaskId, newStatus) => {
    await supabase.from("student_progress").upsert({
      student_id: studentId,
      course_id: course.course_id,
      entity_type: "SUBTASK",
      entity_id: subtaskId,
      status: newStatus
    });

    refreshCourse(); 
  };

  /** -------- CALCULATE HIERARCHY STATUS -------- */
  let courseStatus = "LOCKED";

  structure?.milestones.forEach(m => {
    m.stages.forEach(s => {
      s.tasks.forEach(t => {
        t.calculatedStatus = calculateStatus(t.subtasks);
      });
      s.calculatedStatus = calculateStatus(s.tasks);
    });

    m.calculatedStatus = calculateStatus(m.stages);
  });

  if (structure) courseStatus = calculateStatus(structure.milestones);

  return (
    <div className="course-box-wrapper">

      {/* Clickable course header with status */}
      <div className="course-box" onClick={toggleOpen}>
        <span>{course.course_title}</span>
        <span className={`status-badge ${courseStatus.toLowerCase()}`}>
          {courseStatus}
        </span>
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>

      {/* Only show details when expanded AND structure loaded */}
      {open && structure && (
        <div className="course-structure">
          {structure.milestones.map(m => (
            <div key={m.id} className="level milestone">
              <strong>📌 {m.milestone_title}</strong>
              <span className={`status-badge ${m.calculatedStatus.toLowerCase()}`}>
                {m.calculatedStatus}
              </span>

              {m.stages.map(s => (
                <div key={s.id} className="level stage">
                  ↳ {s.stage_title}
                  <span className={`status-badge ${s.calculatedStatus.toLowerCase()}`}>{s.calculatedStatus}</span>

                  {s.tasks.map(t => (
                    <div key={t.id} className="level task">
                      ➡ {t.task_title}
                      <span className={`status-badge ${t.calculatedStatus.toLowerCase()}`}>{t.calculatedStatus}</span>

                      {t.subtasks.map(sub => (
                        <div key={sub.id} className="level subtask">
                          🔹 {sub.subtask_title}

                          <select
                            defaultValue={sub.status || "LOCKED"}
                            onChange={(e) => updateSubtaskStatus(sub.id, e.target.value)}
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
  );
}
