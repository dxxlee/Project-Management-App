import React, { useState } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/register', formData);
      setError(null); // Очищаем ошибки
      alert('Registration successful!');
      console.log(response.data);
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Register</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email:</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </Form.Group>

            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username:</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
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

            <Button variant="success" type="submit" className="w-100">
              Register
            </Button>
          </Form>

          {/* Ссылка на логин */}
          <div className="text-center mt-3">
            Already have an account?{' '}
            <Link to="/login" style={{ textDecoration: 'none' }}>
              Login here
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;