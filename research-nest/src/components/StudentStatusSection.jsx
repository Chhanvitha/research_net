import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./StudentStatusSection.css";

export default function StudentStatusSection() {
  const [email, setEmail] = useState("");
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);

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

      setCourses(enrolled);
    }
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
          <h4> {student.full_name}</h4>
          <h5>Enrolled Courses:</h5>

          {courses.length === 0 && <p>No courses enrolled.</p>}

          {courses.map((c) => (
            <div key={c.id} className="course-box">{c.course_title}</div>
          ))}
        </>
      )}
    </div>
  );
}
