import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import StarredFiles from './pages/StarredFiles';
import { getCurrentUser } from './utils/hiveUtils';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const isAuthenticated = !!getCurrentUser();
  return isAuthenticated ? <>{element}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={<ProtectedRoute element={<Dashboard />} />} 
        />
        <Route 
          path="/folder/:folderId" 
          element={<ProtectedRoute element={<Dashboard />} />} 
        />
        <Route 
          path="/starred" 
          element={<ProtectedRoute element={<StarredFiles />} />} 
        />
        <Route 
          path="/recent" 
          element={<ProtectedRoute element={<Dashboard />} />} 
        />
        <Route 
          path="/shared" 
          element={<ProtectedRoute element={<Dashboard />} />} 
        />
        <Route 
          path="/trash" 
          element={<ProtectedRoute element={<Dashboard />} />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;