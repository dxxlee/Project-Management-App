import React, { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Modal,
} from 'react-bootstrap';


const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', team_id: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'my', 'team'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch projects');
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all teams
  const fetchTeams = async () => {
    try {
      const response = await api.get('/api/teams');
      setTeams(response.data);
    } catch (error) {
      toast.error('Failed to fetch teams');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, []);

  // Create a new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (newProject.team_id) {
        response = await api.post(`/api/teams/${newProject.team_id}/projects`, newProject);
      } else {
        response = await api.post('/api/projects', newProject);
      }
      setProjects([...projects, response.data]);
      setNewProject({ name: '', description: '', team_id: '' });
      toast.success('Project created successfully!');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  // Update an existing project
  const handleEditProject = async (projectId, updatedData) => {
    try {
      const response = await api.put(`/api/projects/${projectId}`, updatedData);
      setProjects(projects.map((p) => (p.id === projectId ? response.data : p)));
      setEditingProject(null);
      toast.success('Project updated successfully!');
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  // Delete a project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }
    try {
      await api.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter((p) => p.id !== projectId));
      toast.success('Project deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Filter projects based on filter type and search query
  const filteredProjects = projects
    .filter(project => {
      if (filter === 'my') return project.owner_id === localStorage.getItem('userId');
      if (filter === 'team') return project.team_id;
      return true;
    })
    .filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={10}>
          {/* Filter and search */}
          <Row className="mb-4">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 border rounded"
              />
            </Col>
            <Col md={6} className="mt-2 mt-md-0">
              <Form.Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="all">All Projects</option>
                <option value="my">My Projects</option>
                <option value="team">Team Projects</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Error message */}
          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}

          {/* List of projects */}
          <Row className="mb-4">
            {filteredProjects.map((project) => (
              <Col key={project.id} md={6} lg={4} className="mb-4">
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>{project.name}</Card.Title>
                    <Card.Text>{project.description}</Card.Text>
                    {project.team_id && (
                      <div className="text-muted mb-2">Team: {project.team_name}</div>
                    )}
                    <div className="d-flex justify-content-between">
                      <Link
                        to={`/projects/${project.id}/tasks`}
                        className="btn btn-primary btn-sm"
                      >
                       View Tasks
                      </Link>
                      <div>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => setEditingProject(project)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Create new project form */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title>Create New Project</Card.Title>
              <Form onSubmit={handleCreateProject}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Team (optional)</Form.Label>
                  <Form.Select
                    value={newProject.team_id}
                    onChange={(e) => setNewProject({ ...newProject, team_id: e.target.value })}
                  >
                    <option value="">No team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button variant="success" type="submit">
                  Create Project
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Edit project modal */}
          {editingProject && (
            <Modal show onHide={() => setEditingProject(null)}>
              <Modal.Header closeButton>
                <Modal.Title>Edit Project</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  handleEditProject(editingProject.id, editingProject);
                }}>
                  <Form.Group className="mb-3">
                    <Form.Label>Project Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingProject.name}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, name: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={editingProject.description}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, description: e.target.value })
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Team (optional)</Form.Label>
                    <Form.Select
                      value={editingProject.team_id}
                      onChange={(e) =>
                        setEditingProject({ ...editingProject, team_id: e.target.value })
                      }
                    >
                      <option value="">No team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="secondary"
                      className="me-2"
                      onClick={() => setEditingProject(null)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Save Changes
                    </Button>
                  </div>
                </Form>
              </Modal.Body>
            </Modal>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Projects;