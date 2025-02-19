import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import qs from 'qs';
import { AuthContext } from '../../context/AuthContext';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = React.useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        '/api/auth/login',
        qs.stringify(formData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      setError(null); // Очищаем ошибки
      alert('Login successful!');
      login(response.data.access_token); // Сохраняем токен через контекст
      navigate('/dashboard'); // Перенаправляем на Dashboard
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Login</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email:</Form.Label>
              <Form.Control
                type="email"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </Form.Group>

            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password:</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Login
            </Button>
          </Form>

          {/* Ссылка на регистрацию */}
          <div className="text-center mt-3">
            Don't have an account?{' '}
            <Link to="/register" style={{ textDecoration: 'none' }}>
              Register here
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;