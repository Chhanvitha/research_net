import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./CoursesSection.css";

export default function CoursesSection({ facultyId }) {
  const [courses, setCourses] = useState([]);
  const [addMode, setAddMode] = useState(false);

  const [courseTitle, setCourseTitle] = useState("");
  const [milestones, setMilestones] = useState([
    { title: "", stages: [{ title: "", tasks: [{ title: "", subtasks: [{ title: "" }] }] }] }
  ]);

  const [message, setMessage] = useState("");

  // NEW state for viewing course content
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseStructure, setCourseStructure] = useState([]);

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

  /** ---------------------- Load Course Structure ---------------------- */

  const loadCourseDetails = async (courseId) => {
    setExpandedCourse(courseId);
    const structured = [];

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

          taskList.push({ ...t, subtasks });
        }

        stageList.push({ ...s, tasks: taskList });
      }

      structured.push({ ...m, stages: stageList });
    }

    setCourseStructure(structured);
  };

  /** ---------------------- Create Course Logic ---------------------- */

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: "", stages: [{ title: "", tasks: [{ title: "", subtasks: [{ title: "" }] }] }] }
    ]);
  };

  const updateMilestoneTitle = (value, index) => {
    const updated = [...milestones];
    updated[index].title = value;
    setMilestones(updated);
  };

  const addStage = (milestoneIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].stages.push({
      title: "",
      tasks: [{ title: "", subtasks: [{ title: "" }] }]
    });
    setMilestones(updated);
  };

  const addTask = (milestoneIndex, stageIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].stages[stageIndex].tasks.push({
      title: "",
      subtasks: [{ title: "" }]
    });
    setMilestones(updated);
  };

  const addSubtask = (milestoneIndex, stageIndex, taskIndex) => {
    const updated = [...milestones];
    updated[milestoneIndex].stages[stageIndex].tasks[taskIndex].subtasks.push({
      title: ""
    });
    setMilestones(updated);
  };

  const createCourse = async () => {
    if (!courseTitle.trim()) return setMessage("Course title cannot be empty.");

    const { data: courseData, error: cErr } = await supabase
      .from("courses")
      .insert({
        course_title: courseTitle,
        created_by: facultyId
      })
      .select()
      .single();

    if (cErr) return setMessage(cErr.message);

    for (let m of milestones) {
      const { data: milestone } = await supabase
        .from("course_milestones")
        .insert({ course_id: courseData.id, milestone_title: m.title })
        .select()
        .single();

      for (let s of m.stages) {
        const { data: stage } = await supabase
          .from("course_stages")
          .insert({ milestone_id: milestone.id, stage_title: s.title })
          .select()
          .single();

        for (let t of s.tasks) {
          const { data: task } = await supabase
            .from("course_tasks")
            .insert({ stage_id: stage.id, task_title: t.title })
            .select()
            .single();

          for (let sub of t.subtasks) {
            await supabase
              .from("course_subtasks")
              .insert({ task_id: task.id, subtask_title: sub.title });
          }
        }
      }
    }

    setMessage("🎉 Course created successfully!");
    setAddMode(false);
    setCourseTitle("");
    setMilestones([
      { title: "", stages: [{ title: "", tasks: [{ title: "", subtasks: [{ title: "" }] }] }] }
    ]);
    loadCourses();
  };

  /** ---------------------- UI ---------------------- */

  return (
    <div>
      {!addMode && (
        <>
          <h3>Your Courses</h3>
          <ul>
            {courses.map((c) => (
              <li key={c.id} className="courseItem">
                <div
                  className="courseTitle"
                  onClick={() =>
                    expandedCourse === c.id
                      ? setExpandedCourse(null)
                      : loadCourseDetails(c.id)
                  }
                >
                  {expandedCourse === c.id ? "▼" : "►"} {c.course_title}
                </div>

                {expandedCourse === c.id && (
                  <div className="courseDetails">
                    {courseStructure.map((m, mi) => (
                      <div key={mi}>
                        <strong>Milestone:  {m.milestone_title}</strong>

                        {m.stages.map((s, si) => (
                          <div key={si} className="indent">
                           Stage:  {s.stage_title}

                            {s.tasks.map((t, ti) => (
                              <div key={ti} className="indent">
                                Task:  {t.task_title}

                                {t.subtasks.map((sub, subi) => (
                                  <div key={subi} className="indent">
                                    Sub-task:  {sub.subtask_title}
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
              </li>
            ))}
          </ul>

          <button onClick={() => setAddMode(true)}>➕ Add Course</button>
        </>
      )}

      {addMode && (
        <div>
          <h3>Create Course</h3>
          {message && <p style={{ color: "green" }}>{message}</p>}

          <input placeholder="Course Name" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />

          {milestones.map((m, mi) => (
            <div key={mi} className="milestoneBox">
              <strong>Milestone {mi + 1}</strong>
              <input
                placeholder="Milestone Name"
                value={m.title}
                onChange={(e) => updateMilestoneTitle(e.target.value, mi)}
              />

              {m.stages.map((s, si) => (
                <div key={si} className="indent">
                  <input
                    placeholder="Stage Name"
                    value={s.title}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[mi].stages[si].title = e.target.value;
                      setMilestones(updated);
                    }}
                  />

                  {s.tasks.map((t, ti) => (
                    <div key={ti} className="indent">
                      <input
                        placeholder="Task Name"
                        value={t.title}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[mi].stages[si].tasks[ti].title = e.target.value;
                          setMilestones(updated);
                        }}
                      />

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
                          className="indent"
                        />
                      ))}
                      <button onClick={() => addSubtask(mi, si, ti)}>➕ Add Subtask</button>
                    </div>
                  ))}

                  <button onClick={() => addTask(mi, si)}>➕ Add Task</button>
                </div>
              ))}

              <button onClick={() => addStage(mi)}>➕ Add Stage</button>
            </div>
          ))}

          <button onClick={addMilestone}>➕ Add Milestone</button>

          <button onClick={createCourse} className="createBtn">
            Create Course
          </button>
        </div>
      )}
    </div>
  );
}
