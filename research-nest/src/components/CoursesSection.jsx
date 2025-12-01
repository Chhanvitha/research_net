import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./CoursesSection.css";

export default function CoursesSection({ facultyId }) {
  const [courses, setCourses] = useState([]);
  const [addMode, setAddMode] = useState(false);

  // Dynamic structure
  const [courseTitle, setCourseTitle] = useState("");
  const [milestones, setMilestones] = useState([
    { title: "", stages: [{ title: "", tasks: [{ title: "", subtasks: [{ title: "" }] }] }] }
  ]);

  const [message, setMessage] = useState("");

  const [expanded, setExpanded] = useState({
  milestone: {},
  stage: {},
  task: {}
});


  useEffect(() => {
    if (facultyId) loadCourses();
  }, [facultyId]);

  const loadCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("created_by", facultyId);
    setCourses(data || []);
  };

  /** ----------------------  Dynamic UI handlers ---------------------- */

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", stages: [{ title: "", tasks: [{ title: "", subtasks: [{ title: "" }] }] }] }]);
  };

  const updateMilestoneTitle = (value, index) => {
    const updated = [...milestones];
    updated[index].title = value;
    setMilestones(updated);
  };

  const addStage = (milestoneIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].stages.push({ title: "", tasks: [{ title: "", subtasks: [{ title: "" }] }] });
    setMilestones(updated);
  };

  const addTask = (milestoneIndex, stageIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].stages[stageIndex].tasks.push({ title: "", subtasks: [{ title: "" }] });
    setMilestones(updated);
  };

  const addSubtask = (milestoneIndex, stageIndex, taskIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].stages[stageIndex].tasks[taskIndex].subtasks.push({ title: "" });
    setMilestones(updated);
  };

  /** ----------------------  Supabase Submit Logic ---------------------- */

  const createCourse = async () => {
    if (!courseTitle.trim()) return setMessage("Course title cannot be empty.");

    // STEP 1 — Insert Course
    const { data: courseData, error: cErr } = await supabase.from("courses").insert({
      course_title: courseTitle,
      created_by: facultyId
    }).select().single();

    if (cErr) return setMessage(cErr.message);

    // STEP 2 — Insert milestones
    for (let m of milestones) {
      const { data: milestone, error: mErr } = await supabase
        .from("course_milestones")
        .insert({ course_id: courseData.id, milestone_title: m.title })
        .select()
        .single();

      if (mErr) continue;

      // STEP 3 — Insert stages
      for (let s of m.stages) {
        const { data: stage, error: sErr } = await supabase
          .from("course_stages")
          .insert({ milestone_id: milestone.id, stage_title: s.title })
          .select()
          .single();

        if (sErr) continue;

        // STEP 4 — Insert tasks
        for (let t of s.tasks) {
          const { data: task, error: tErr } = await supabase
            .from("course_tasks")
            .insert({ stage_id: stage.id, task_title: t.title })
            .select()
            .single();

          if (tErr) continue;

          // STEP 5 — Insert subtasks
          for (let sub of t.subtasks) {
            await supabase
              .from("course_subtasks")
              .insert({ task_id: task.id, subtask_title: sub.title });
          }
        }
      }
    }

    setMessage("🎉 Course structure created successfully!");
    setAddMode(false);
    setCourseTitle("");
    setMilestones([
      { title: "", stages: [{ title: "", tasks: [{ title: "", subtasks: [{ title: "" }] }] }] }
    ]);
    loadCourses();
  };

  return (
    <div>
      {/* List existing courses */}
      {!addMode && (
        <>
          <h3>Your Courses</h3>
          <ul>
            {courses.map((c) => (
              <li key={c.id}>{c.course_title}</li>
            ))}
          </ul>

          <button onClick={() => setAddMode(true)}>➕ Add Course</button>
        </>
      )}

      {/* Add course mode */}
      {addMode && (
        <div>
          <h3>Create Course</h3>

          {message && <p style={{ color: "green" }}>{message}</p>}

          <input
            placeholder="Course Name"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
          />

          {/* Dynamic Milestones */}
          {milestones.map((m, mi) => (
  <div key={mi} style={{ marginTop: "20px", border: "1px solid #ddd", padding: "10px", borderRadius: "6px" }}>

    {/* ---- Milestone Header ---- */}
    <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
      onClick={() =>
        setExpanded({
          ...expanded,
          milestone: { ...expanded.milestone, [mi]: !expanded.milestone[mi] }
        })
      }
    >
      <strong>{expanded.milestone[mi] ? "▼" : "►"} Milestone {mi + 1}</strong>

      <button onClick={(e) => { e.stopPropagation(); addStage(mi); }}>
        ➕ Add Stage
      </button>
    </div>

    {/* Show input only if expanded */}
    {expanded.milestone[mi] && (
      <>
        <input
          placeholder="Milestone Name"
          value={m.title}
          onChange={(e) => updateMilestoneTitle(e.target.value, mi)}
          style={{ marginTop: "10px", width: "90%" }}
        />

        {/* ---- Stages ---- */}
        {m.stages.map((s, si) => (
          <div key={si} style={{ marginLeft: "20px", marginTop: "10px", borderLeft: "2px solid #ccc", paddingLeft: "10px" }}>
            
            {/* Stage Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() =>
                setExpanded({
                  ...expanded,
                  stage: {
                    ...expanded.stage,
                    [`${mi}-${si}`]: !expanded.stage[`${mi}-${si}`]
                  }
                })
              }
            >
              <span>{expanded.stage[`${mi}-${si}`] ? "▼" : "►"} Stage {si + 1}</span>
              <button onClick={(e) => { e.stopPropagation(); addTask(mi, si); }}>➕ Add Task</button>
            </div>

            {expanded.stage[`${mi}-${si}`] && (
              <>
                <input
                  placeholder="Stage Name"
                  value={s.title}
                  onChange={(e) => {
                    const updated = [...milestones];
                    updated[mi].stages[si].title = e.target.value;
                    setMilestones(updated);
                  }}
                  style={{ width: "80%", marginTop: "8px" }}
                />

                {/* ---- TASKS ---- */}
                {s.tasks.map((t, ti) => (
                  <div key={ti} style={{ marginLeft: "20px", borderLeft: "2px dashed #ddd", paddingLeft: "10px", marginTop: "10px" }}>
                    
                    {/* Task Toggle */}
                    <div
                      onClick={() =>
                        setExpanded({
                          ...expanded,
                          task: {
                            ...expanded.task,
                            [`${mi}-${si}-${ti}`]: !expanded.task[`${mi}-${si}-${ti}`]
                          }
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {expanded.task[`${mi}-${si}-${ti}`] ? "▼" : "►"} Task {ti + 1}
                    </div>

                    {expanded.task[`${mi}-${si}-${ti}`] && (
                      <>
                        <input
                          placeholder="Task Name"
                          value={t.title}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[mi].stages[si].tasks[ti].title = e.target.value;
                            setMilestones(updated);
                          }}
                          style={{ width: "70%", marginTop: "8px" }}
                        />

                        {/* Subtasks */}
                        {t.subtasks.map((sub, subi) => (
                          <input
                            key={subi}
                            placeholder={`Subtask ${subi + 1}`}
                            value={sub.title}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[mi].stages[si].tasks[ti].subtasks[subi].title = e.target.value;
                              setMilestones(updated);
                            }}
                            style={{ width: "60%", marginLeft: "20px", marginTop: "8px", display: "block" }}
                          />
                        ))}

                        <button onClick={() => addSubtask(mi, si, ti)} style={{ marginTop: "8px" }}>
                          ➕ Add Subtask
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </>
    )}
  </div>
))}

          <button onClick={addMilestone}>➕ Add Milestone</button>
          <button onClick={createCourse} style={{ marginTop: "15px", display: "block", color:"black", backgroundColor:"lightgreen"}}>
             Create Course
          </button>
        </div>
      )}
    </div>
  );
}
