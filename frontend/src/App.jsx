import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider, useAuth} from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import VerifyEmail from './components/auth/VerifyEmail';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import SpotDetailPage from './pages/SpotDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import OAuthCallback from './components/auth/OAuthCallback';
import {GlobalProvider} from '@/context/GlobalState';

const ProtectedRoute = ({children}) => {
  const {isAuthenticated, user, loading} = useAuth();
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login"/>;
  }
  return children;
};

const AdminRoute = ({children}) => {
  const {isAuthenticated, user, loading} = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/"/>;
  }
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <GlobalProvider>
          <Routes>
            <Route path="/" element={<MainLayout/>}>
              <Route index element={<HomePage/>}/>
              <Route path="/login" element={<LoginPage/>}/>
              <Route path="/register" element={<RegisterPage/>}/>
              <Route path="/explore" element={<ExplorePage/>}/>
              <Route path="/oauth-callback" element={<OAuthCallback/>}/>
              <Route path="/verify-email/:token" element={<VerifyEmail/>}/>
              <Route path="/spots/:id" element={<SpotDetailPage/>}/>
              <Route path="/profile" element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
              <Route path="/admin" element={<AdminRoute><AdminDashboardPage/></AdminRoute>}/>
              <Route path="*" element={<NotFoundPage/>}/>
            </Route>
          </Routes>
        </GlobalProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
