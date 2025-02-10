import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./SignUp";
import MainApp from "./MainApp";
import { useEffect, useState } from "react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/auth/check", { 
      credentials: "include" 
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.user) {
        setUser(data.user);
      }
    })
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
  }, []);

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