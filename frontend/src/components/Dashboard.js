import React, { useEffect, useState } from 'react';
import api from '../api';
import { Container, Card, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = React.useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error.response?.data || error.message);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">Unable to load user data.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="text-center mb-4">
                <FaUser size={32} className="mb-2" /> {/* Иконка пользователя */}
                <br />
                Welcome, {user.username}!
              </Card.Title>

              <Card.Text>
                <div className="d-flex align-items-center justify-content-center mb-3">
                  {/* Иконка email */}
                  <FaEnvelope size={20} className="me-2" />
                  {/* Email */}
                  <span>
                    <strong>Email:</strong> {user.email}
                  </span>
                </div>
              </Card.Text>

              <div className="text-center">
                <Button variant="outline-danger" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;