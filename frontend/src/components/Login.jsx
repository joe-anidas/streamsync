import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    const data = await res.json();
    if (data.message) {
      alert("Login successful! Redirecting to dashboard...");
      navigate("/dashboard");
    } else {
      alert(data.error || "Login failed");
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="login-btn">Login</button>
        </form>
        <button className="google-btn" onClick={handleGoogleSignIn}>Login with Google</button>
        <p className="register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
