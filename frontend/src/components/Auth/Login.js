import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { setAuthToken } from '../../api';
import qs from 'qs';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Отправляем данные в формате x-www-form-urlencoded
      const response = await api.post(
        '/api/auth/login',
        qs.stringify(formData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      alert('Login successful!');

      // Сохраняем токен в localStorage
      localStorage.setItem('token', response.data.access_token);

      // Устанавливаем токен в заголовки Axios
      setAuthToken(response.data.access_token);

      // Перенаправляем пользователя на /dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;