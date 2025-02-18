import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Вызываем функцию выхода из контекста
    navigate('/login'); // Перенаправляем на страницу входа
  };

  return (
    <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0' }}>
      <Link to="/">Home</Link> |{' '}
      <Link to="/dashboard">Dashboard</Link> |{' '}
      <Link to="/projects">Projects</Link> |{' '}
      <Link to="/tasks">Tasks</Link> |{' '}
      <Link to="/teams">Teams</Link>
      {user && (
        <button style={{ marginLeft: '1rem' }} onClick={handleLogout}>
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navbar;