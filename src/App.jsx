import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';

import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import ChatPage from './pages/Chat/ChatPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';

import LandingPage from './pages/Home/LandingPage.jsx';
import UserProfilePage from './pages/Profile/UserProfilePage.jsx';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage.jsx';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <FeatureFlagsProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </FeatureFlagsProvider>
  );
}

export default App;
