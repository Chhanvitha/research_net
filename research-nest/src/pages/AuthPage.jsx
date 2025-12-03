import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // <-- NEW

  const navigate = useNavigate();

  const handleSignup = async () => {
    setMessage(""); 

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return setMessage(authError.message);

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: name,
      email,
      role,
    });

    if (profileError) return setMessage(profileError.message);

    setMessage("Account created successfully! Please sign in.");
    setIsSignup(false);
  };

  const handleSignin = async () => {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return setMessage(error.message);

    const { data: userData } = await supabase.auth.getUser();
    const id = userData.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if (!profile) return setMessage("Profile not found.");

    if (profile.role === "STUDENT") navigate("/student-dashboard");
    else navigate("/faculty-dashboard");
  };

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button
          className={isSignup ? "active" : "inactive"}
          onClick={() => setIsSignup(true)}
        >
          Sign Up
        </button>
        <button
          className={!isSignup ? "active" : "inactive"}
          onClick={() => setIsSignup(false)}
        >
          Sign In
        </button>
      </div>

      
      {message && (
        <p style={{ color: message.includes("success") || message.includes("created") ? "green" : "red" }}>
          {message}
        </p>
      )}

      {isSignup ? (
        <>
          <input
            className="auth-input"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select
            className="auth-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
          </select>

          <button className="auth-submit" onClick={handleSignup}>
            Sign Up
          </button>
        </>
      ) : (
        <>
          <input
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-submit" onClick={handleSignin}>
            Sign In
          </button>
        </>
      )}
    </div>
  );
}
