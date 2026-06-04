import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import UserProfile from "./pages/UserProfile";
import CustomerChat from "./pages/CustomerChat";
import AdminProfile from "./pages/AdminProfile";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="/userprofile" element={<UserProfile />} />
        <Route path="/chat/:adminId" element={<CustomerChat />} />
        <Route path="/customerchat" element={<Navigate to="/chat/1" replace />} />
        <Route path="/adminprofile" element={<AdminProfile />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;