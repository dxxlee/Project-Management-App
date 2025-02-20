import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={10}>
          {/* Welcome Section */}
          <Card className="shadow-sm mb-4">
            <Card.Body className="text-center py-5">
              <h1 className="mb-4">Welcome to Project Management App</h1>
              <p className="lead mb-4">
                Streamline your project management process with our comprehensive solution for teams and individuals.
              </p>
            </Card.Body>
          </Card>

          {/* Features Section */}
          <Row className="mb-5">
            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <h3 className="h4 mb-3">Projects</h3>
                  <p>Create and manage projects, assign teams, and track progress all in one place.</p>
                  <Link to="/projects">
                    <Button variant="primary">View Projects</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <h3 className="h4 mb-3">Tasks</h3>
                  <p>Break down projects into manageable tasks and track their completion status.</p>
                  <Link to="/tasks">
                    <Button variant="primary">View Tasks</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <h3 className="h4 mb-3">Teams</h3>
                  <p>Collaborate with team members and manage team assignments efficiently.</p>
                  <Link to="/teams">
                    <Button variant="primary">View Teams</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Dashboard Preview */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h2 className="h3 mb-4">Get Started</h2>
              <Row>
                <Col md={6}>
                  <ul className="list-unstyled">
                    <li className="mb-3">✓ Create and manage multiple projects</li>
                    <li className="mb-3">✓ Organize tasks with deadlines</li>
                    <li className="mb-3">✓ Collaborate with team members</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <ul className="list-unstyled">
                    <li className="mb-3">✓ Track project progress</li>
                    <li className="mb-3">✓ Set project milestones</li>
                    <li className="mb-3">✓ Generate project reports</li>
                  </ul>
                </Col>
              </Row>
              <div className="text-center mt-4">
                <Link to="/dashboard">
                  <Button variant="success" size="lg">Go to Dashboard</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;