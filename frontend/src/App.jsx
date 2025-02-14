import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./SignUp";
import MainApp from "./MainApp";
import { useEffect, useState } from "react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const apiUrl = 'http://localhost:3000';

  useEffect(() => {
    fetch(`${apiUrl}/auth/check`, {
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Auth check failed');
      }
      return res.json();
    })
    .then((data) => {
      if (data.user) {
        setUser(data.user);
      }
    })
    .catch((err) => {
      console.error("Auth check error:", err);
      setUser(null);
    })
    .finally(() => setLoading(false));
  }, [apiUrl]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/app" /> : <Signup />}
        />
        <Route
          path="/app"
          element={user ? <MainApp /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;