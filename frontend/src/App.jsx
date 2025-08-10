import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Signup from "./SignUp";
import MainApp from "./MainApp";
import { useEffect, useState } from "react";
import React from "react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const checkAuth = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/check`, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        throw new Error('Auth check failed');
      }
      
      const data = await res.json();
      console.log("Auth check response:", data); // Debug log
      
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Add a second useEffect to handle URL changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/app" replace /> : <Signup />} 
        />
        <Route 
          path="/app" 
          element={
            user ? (
              <MainApp />
            ) : (
              <Navigate to="/" replace state={{ from: '/app' }} />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
