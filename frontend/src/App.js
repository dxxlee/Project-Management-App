import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import Teams from './components/Teams';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AuthContext } from './context/AuthContext';

// Layout Component for Private Routes
const PrivateLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  );
};

const App = () => {
  const { user, isLoading } = React.useContext(AuthContext);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      {/* Flexbox Container */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Routes */}
          <Route
            path="/"
            element={
              user ? (
                <PrivateRoute>
                  <PrivateLayout>
                    <Home />
                  </PrivateLayout>
                </PrivateRoute>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <PrivateRoute>
                  <PrivateLayout>
                    <Dashboard />
                  </PrivateLayout>
                </PrivateRoute>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/projects"
            element={
              user ? (
                <PrivateRoute>
                  <PrivateLayout>
                    <Projects />
                  </PrivateLayout>
                </PrivateRoute>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/projects/:projectId/tasks"
            element={
              user ? (
                <PrivateRoute>
                  <PrivateLayout>
                    <Tasks />
                  </PrivateLayout>
                </PrivateRoute>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/tasks"
            element={
              user ? (
                <PrivateRoute>
                  <PrivateLayout>
                    <Tasks />
                  </PrivateLayout>
                </PrivateRoute>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/teams"
            element={
              user ? (
                <PrivateRoute>
                  <PrivateLayout>
                    <Teams />
                  </PrivateLayout>
                </PrivateRoute>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;