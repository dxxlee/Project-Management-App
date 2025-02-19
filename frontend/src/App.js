import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Импорты компонентов
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import Teams from './components/Teams';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import { AuthContext } from './context/AuthContext';

const App = () => {
  const { user, isLoading } = React.useContext(AuthContext);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Обертка для защищенных маршрутов */}
        <Route
          path="/*"
          element={
            <>
              {user && <Navbar />} {/* Navbar только для залогиненных */}
              <Routes>
                <Route
                  path="/"
                  element={
                    user ? (
                      <PrivateRoute> {/* Защищаем Home */}
                        <Home />
                      </PrivateRoute>
                    ) : (
                      <Navigate to="/login" /> // Редирект на логин, если не залогинен
                    )
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    user ? (
                      <PrivateRoute> {/* Защищаем Dashboard */}
                        <Dashboard />
                      </PrivateRoute>
                    ) : (
                      <Navigate to="/login" /> // Редирект на логин, если не залогинен
                    )
                  }
                />
                <Route
                  path="/projects" // Пример защищенного маршрута Projects
                  element={
                    user ? (
                      <PrivateRoute>
                        <Projects />
                      </PrivateRoute>
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route
                  path="/tasks" // Пример защищенного маршрута Tasks
                  element={
                    user ? (
                      <PrivateRoute>
                        <Tasks />
                      </PrivateRoute>
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route
                  path="/teams" // Пример защищенного маршрута Teams
                  element={
                    user ? (
                      <PrivateRoute>
                        <Teams />
                      </PrivateRoute>
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              </Routes>
            </>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;