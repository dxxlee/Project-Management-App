import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <h1>Welcome to your personal account!</h1>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<h1>Welcome!</h1>} />
      </Routes>
    </Router>
  );
}

export default App;