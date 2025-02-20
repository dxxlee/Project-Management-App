import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={10}>
          {/* Welcome Section */}
          <Card className="shadow-sm mb-4" style={{
            backgroundImage: 'url("https://img.freepik.com/free-vector/happy-tiny-people-near-huge-welcome-word-flat-illustration_74855-10808.jpg?t=st=1740059384~exp=1740062984~hmac=6a4d231a07510bb99ccfe2c8e4712cc682b578e7ceeabee6c75d30430202214c&w=1480")',
            backgroundSize: 'cover',
            backgroundPosition: '50% 60%'
            }}>
            <Card.Body className="text-center py-5" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              borderRadius: 'inherit'
            }}>
              <h1 className="mb-4">Welcome to Project Management App</h1>
              <p className="lead mb-4">
                Streamline your project management process with our comprehensive solution for teams and individuals.
              </p>
            </Card.Body>
          </Card>

          {/* Features Section */}
          <Row className="mb-5">
          <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm" style={{
                backgroundImage: 'url("https://img.freepik.com/free-vector/flat-tiny-people-communication-concept-partner-discussion-business-projects_513217-77.jpg?t=st=1740058554~exp=1740062154~hmac=b8de7fe6b933e171f4f3fb293ca1e46e22bbcb5f2ac9ef185a8de3404a0b544e&w=1480")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <Card.Body className="text-center" style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  borderRadius: 'inherit',
                  height: '100%',
                }}>
                  <h3 className="h4 mb-3">Projects</h3>
                  <p>Create and manage projects, assign teams, and track progress all in one place.</p>
                  <Link to="/projects">
                    <Button variant="primary">View Projects</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm" style={{
              backgroundImage: 'url("https://img.freepik.com/free-vector/manager-prioritizing-tasks-list_74855-5272.jpg?t=st=1740058867~exp=1740062467~hmac=ecfe33d124e0ababeaf7bb0d2de2063a2353c9ea12a5cf00f3e0a9670dcf0929&w=1480")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <Card.Body className="text-center" style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                borderRadius: 'inherit',
                height: '100%'
              }}>
                <h3 className="h4 mb-3">Tasks</h3>
                <p>Break down projects into manageable tasks and track their completion status.</p>
                <Link to="/tasks">
                  <Button variant="primary">View Tasks</Button>
                </Link>
              </Card.Body>
            </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm" style={{
                backgroundImage: 'url("https://img.freepik.com/free-vector/connecting-teams-concept-landing-page_52683-24772.jpg?t=st=1740059324~exp=1740062924~hmac=f37a4292a8a2f442bdf14a4be51fb21559840bad6163601b6acb7d7cd4bbcd2a&w=996")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <Card.Body className="text-center" style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  borderRadius: 'inherit',
                  height: '100%'
                }}>
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