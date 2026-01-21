import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const token = localStorage.getItem("token");
  const isAuth = !!token;

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={isAuth ? <Dashboard /> : <Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;
