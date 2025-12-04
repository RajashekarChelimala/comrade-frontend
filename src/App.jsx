import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import ChatPage from './pages/Chat/ChatPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';

function App() {
  return (
    <FeatureFlagsProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </FeatureFlagsProvider>
  );
}

export default App;
