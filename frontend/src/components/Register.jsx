import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    const data = await res.json();
    if (data.message) {
      alert("Registration successful! Redirecting to login...");
      navigate("/login");
    } else {
      alert(data.error || "Registration failed");
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Register</button>
      </form>
      <button className="google-btn" onClick={handleGoogleSignIn}>Register with Google</button>
      <p className="link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
