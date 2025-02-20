import React, { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Modal,
  ListGroup
} from 'react-bootstrap';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newMember, setNewMember] = useState({ email: '', role: 'member' });

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/teams');
      setTeams(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch teams');
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/teams', newTeam);
      setTeams([...teams, response.data]);
      setNewTeam({ name: '', description: '' });
      toast.success('Team created successfully!');
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleEditTeam = async (teamId, updatedData) => {
    try {
      const updatePayload = {
        name: updatedData.name,
        description: updatedData.description
      };

      const response = await api.put(`/api/teams/${teamId}`, updatePayload);

      setTeams(teams.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            name: response.data.name,
            description: response.data.description
          };
        }
        return t;
      }));

      setEditingTeam(null);
      toast.success('Team updated successfully!');
    } catch (error) {
      toast.error('Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }
    try {
      await api.delete(`/api/teams/${teamId}`);
      setTeams(teams.filter((t) => t.id !== teamId));
      toast.success('Team deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/teams/${selectedTeam.id}/members`, newMember);
      toast.success('Member added successfully!');
      fetchTeams();
      setShowAddMemberModal(false);
      setNewMember({ email: '', role: 'member' });
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  const handleUpdateMemberRole = async (teamId, userId, role) => {
    try {
      await api.put(`/api/teams/${teamId}/members/${userId}`, { role });
      toast.success('Member role updated successfully!');
      fetchTeams();
    } catch (error) {
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    try {
      await api.delete(`/api/teams/${teamId}/members/${userId}`);
      toast.success('Member removed successfully!');
      fetchTeams();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={10}>
          {error && (
            <Alert variant="danger" className="text-center mb-4">
              {error}
            </Alert>
          )}

          {/* Create New Team Card */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title>Create New Team</Card.Title>
              <Form onSubmit={handleCreateTeam}>
                <Form.Group className="mb-3">
                  <Form.Label>Team Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  />
                </Form.Group>
                <Button variant="success" type="submit">
                  Create Team
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Teams List */}
          <Row className="mb-4">
            {teams.map((team) => (
              <Col key={team.id} md={6} lg={4} className="mb-4">
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>{team.name}</Card.Title>
                    <Card.Text>{team.description}</Card.Text>

                    <div className="mb-3">
                      <small className="text-muted">Members ({team.members.length})</small>
                      <ListGroup variant="flush" className="mt-2">
                        {team.members.map((member) => (
                          <ListGroup.Item key={member.user_name} className="d-flex justify-content-between align-items-center">
                            <span>{member.user_name}</span>
                            <div>
                              <Form.Select
                                size="sm"
                                value={member.role}
                                onChange={(e) => handleUpdateMemberRole(team.id, member.user_id, e.target.value)}
                                className="d-inline-block me-2"
                                style={{ width: 'auto' }}
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </Form.Select>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveMember(team.id, member.user_id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>

                    <div className="d-flex justify-content-between mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddMemberModal(true);
                        }}
                      >
                        Add Member
                      </Button>
                      <div>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => setEditingTeam(team)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteTeam(team.id)}
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

          {/* Edit Team Modal */}
          {editingTeam && (
            <Modal show onHide={() => setEditingTeam(null)}>
              <Modal.Header closeButton>
                <Modal.Title>Edit Team</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  handleEditTeam(editingTeam.id, editingTeam);
                }}>
                  <Form.Group className="mb-3">
                    <Form.Label>Team Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={editingTeam.name}
                      onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={editingTeam.description}
                      onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="secondary"
                      className="me-2"
                      onClick={() => setEditingTeam(null)}
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

          {/* Add Member Modal */}
          <Modal show={showAddMemberModal} onHide={() => setShowAddMemberModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Add Team Member</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleAddMember}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
                <div className="d-flex justify-content-end">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Add Member
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default Teams;