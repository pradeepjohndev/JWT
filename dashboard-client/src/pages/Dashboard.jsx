import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";   

function Dashboard() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem("token");
          navigate("/");
        }
        return res.json();
      })
      .then(data => setMessage(data.message))
      .catch(() => navigate("/"));
  });

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Dashboard</h2>
      <p>{message}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;
