import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Badge,
  Dropdown,
  Stack,
  Spinner,
  Modal,
  Table
} from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  PlusCircle,
  Calendar,
  PersonFill,
  ThreeDotsVertical
} from 'react-bootstrap-icons';
import api from '../api';
import { toast } from 'react-toastify';

const statusConfig = {
  todo: { title: 'To Do', color: 'secondary' },
  in_progress: { title: 'In Progress', color: 'primary' },
  review: { title: 'Review', color: 'warning' },
  done: { title: 'Done', color: 'success' }
};

const priorityColors = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'dark'
};

const Tasks = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState({});
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    due_date: '',
    assignee_id: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // States for "full" aggregation (full_summary)
  const [fullAggregation, setFullAggregation] = useState({});
  const [showFullAggModal, setShowFullAggModal] = useState(false);
  const [fullAggLoading, setFullAggLoading] = useState(false);

  // States for editing a task
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // States for working with comments
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [currentTaskForComment, setCurrentTaskForComment] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
      fetchTasks(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchTasks = async (projId) => {
    setLoading(true);
    try {
      console.log('Fetching tasks for project:', projId);
      const response = await api.get(`/api/projects/${projId}/tasks`);
      console.log('Response:', response.data);
      const groupedTasks = {
        'todo': response.data.filter(task => task.status === 'todo'),
        'in_progress': response.data.filter(task => task.status === 'in_progress'),
        'review': response.data.filter(task => task.status === 'review'),
        'done': response.data.filter(task => task.status === 'done')
      };
      setTasks(groupedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error.response || error);
      toast.error(error.response?.data?.detail || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Create a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const formattedTask = {
        ...newTask,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        assignee_id: newTask.assignee_id || null
      };
      await api.post(`/api/projects/${selectedProject}/tasks`, formattedTask);
      await fetchTasks(selectedProject);
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due_date: '',
        assignee_id: ''
      });
      setShowCreateForm(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create task');
    }
  };

  // Update a task
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}/status?status=${newStatus}`);
      await fetchTasks(selectedProject);
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;
    try {
      await handleUpdateTaskStatus(draggableId, destination.droppableId);
    } catch (error) {
      toast.error('Failed to move task');
    }
  };

  // Edit task
  const handleEditTask = (task) => {
    setEditingTask({ ...task });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEditTask = async () => {
    try {
      const updateData = {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        due_date: editingTask.due_date ? new Date(editingTask.due_date).toISOString() : null,
        assignee_id: editingTask.assignee_id || null
      };
      console.log("Sending update request:", updateData);
      await api.put(`/api/tasks/${editingTask.id}`, updateData);
      await fetchTasks(selectedProject);
      setShowEditModal(false);
      setEditingTask(null);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error("Update error:", error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to update task');
    }
  };

  // Add comment
  const handleAddComment = (task) => {
    setCurrentTaskForComment(task);
    setNewCommentText("");
    setShowAddCommentModal(true);
  };

  // Save comment
  const handleSaveComment = async () => {
    try {
      await api.put(`/api/tasks/${currentTaskForComment.id}/comments`, { text: newCommentText });
      await fetchTasks(selectedProject);
      setShowAddCommentModal(false);
      setCurrentTaskForComment(null);
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add comment');
    }
  };

  // Delete comment
  const handleDeleteComment = (task) => {
    setCurrentTaskForComment(task);
    setShowDeleteCommentModal(true);
  };

  const handleConfirmDeleteComment = async (commentText) => {
    try {
      await api.put(`/api/tasks/${currentTaskForComment.id}/comments/remove`, { comment_text: commentText });
      await fetchTasks(selectedProject);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete comment');
    }
  };

  // Full aggregation
  const fetchFullAggregation = async () => {
    setFullAggLoading(true);
    try {
      const response = await api.get('/api/aggregation/full_summary', {
        params: { project_id: selectedProject }
      });
      console.log("Full Aggregation summary:", response.data);
      setFullAggregation(response.data);
      setShowFullAggModal(true);
      toast.success('Full aggregation fetched successfully');
    } catch (error) {
      console.error('Full Aggregation fetch error:', error.response?.data || error.message);
      toast.error(error.response?.data?.detail || 'Failed to fetch full aggregation');
    } finally {
      setFullAggLoading(false);
    }
  };

  return (
    <Container fluid className="p-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="h2 mb-0">Task Board</h1>
        </Col>
        <Col xs="auto">
          <Form.Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <option>Select Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {selectedProject && (
        <Row className="mb-4">
          <Col>
            <Button
              variant="outline-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <PlusCircle className="me-2" />
              New Task
            </Button>

            {/* Button for full aggregation */}
            <Button
              variant="outline-dark"
              onClick={fetchFullAggregation}
              className="ms-2"
              disabled={fullAggLoading}
            >
              {fullAggLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Full Aggregation"
              )}
            </Button>

            {showCreateForm && (
              <Card className="mt-3">
                <Card.Body>
                  <Form onSubmit={handleCreateTask}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Title</Form.Label>
                          <Form.Control
                            required
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Assignee</Form.Label>
                          <Form.Select
                            value={newTask.assignee_id}
                            onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}
                          >
                            <option>Unassigned</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Priority</Form.Label>
                          <Form.Select
                            value={newTask.priority}
                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                          >
                            {Object.entries(priorityColors).map(([key]) => (
                              <option key={key} value={key}>{key}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Due Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={newTask.due_date}
                            onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowCreateForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" variant="primary">
                            Create Task
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      )}

      {selectedProject && !loading ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Row className="g-4">
            {Object.entries(statusConfig).map(([statusKey, { title, color }]) => (
              <Col key={statusKey} md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className={`bg-${color} bg-opacity-10 text-${color} d-flex justify-content-between`}>
                    <span className="fw-semibold">{title}</span>
                    <Badge bg={color} pill>
                      {tasks[statusKey]?.length || 0}
                    </Badge>
                  </Card.Header>
                  <Card.Body className="p-2">
                    <Droppable droppableId={statusKey}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="h-100 min-vh-50"
                        >
                          {tasks[statusKey]?.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <Card className="mb-2 shadow-sm">
                                    <Card.Body>
                                      <Stack direction="horizontal" gap={2} className="align-items-start">
                                        <div className="flex-grow-1">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0">{task.title}</h6>
                                            <Dropdown>
                                              <Dropdown.Toggle variant="link" className="p-0 text-dark">
                                                <ThreeDotsVertical />
                                              </Dropdown.Toggle>
                                              <Dropdown.Menu>
                                                <Dropdown.Item onClick={() => handleEditTask(task)}>
                                                  Edit
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => {
                                                  if (window.confirm("Are you sure you want to delete this task?")) {
                                                    api.delete(`/api/tasks/${task.id}`)
                                                      .then(() => {
                                                        fetchTasks(selectedProject);
                                                        toast.success("Task deleted successfully");
                                                      })
                                                      .catch(err => toast.error(err.response?.data?.detail || "Failed to delete task"));
                                                  }
                                                }}>
                                                  Delete
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleAddComment(task)}>
                                                  Add Comment
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleDeleteComment(task)}>
                                                  Delete Comment
                                                </Dropdown.Item>
                                              </Dropdown.Menu>
                                            </Dropdown>
                                          </div>
                                          <p className="small text-muted mb-2">{task.description}</p>
                                          {/* Блок комментариев */}
                                          {task.comments && task.comments.length > 0 && (
                                            <div className="mt-2 p-2" style={{ backgroundColor: 'rgba(0, 123, 255, 0.1)', borderRadius: '5px' }}>
                                              <h6 className="mb-1" style={{ fontSize: '0.85rem' }}>Comments:</h6>
                                              {task.comments.map((comment, idx) => (
                                                <Card key={idx} className="mb-1" style={{ backgroundColor: 'rgba(0, 123, 255, 0.05)' }}>
                                                  <Card.Body className="py-1 px-2">
                                                    <small>{comment.text}</small>
                                                  </Card.Body>
                                                </Card>
                                              ))}
                                            </div>
                                          )}
                                          <Stack gap={2} direction="horizontal">
                                            {task.assignee_id && (
                                              <Badge bg="light" text="dark" className="d-flex align-items-center">
                                                <PersonFill className="me-1" />
                                                {(users.find(u => u.id === task.assignee_id) || {}).username || "Unassigned"}
                                              </Badge>
                                            )}
                                            {task.due_date && (
                                              <Badge bg="light" text="dark" className="d-flex align-items-center">
                                                <Calendar className="me-1" />
                                                {new Date(task.due_date).toLocaleDateString()}
                                              </Badge>
                                            )}
                                          </Stack>
                                        </div>
                                        <Badge bg={priorityColors[task.priority]} className="align-self-start">
                                          {task.priority}
                                        </Badge>
                                      </Stack>
                                    </Card.Body>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </DragDropContext>
      ) : selectedProject ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : null}

      {/* Modal for aggregation */}
      <Modal
        show={showFullAggModal}
        onHide={() => setShowFullAggModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Full Aggregation Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.keys(fullAggregation).length > 0 ? (
            <>
              <h5>Summary by Status</h5>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Total Tasks</th>
                    <th>Labels</th>
                  </tr>
                </thead>
                <tbody>
                  {fullAggregation.summaryByStatus && fullAggregation.summaryByStatus.map((statusItem, idx) => (
                    <tr key={idx}>
                      <td>{statusItem._id}</td>
                      <td>{statusItem.total}</td>
                      <td>
                        {statusItem.labels.map((labelObj, i) => (
                          <div key={i}>
                            {labelObj.label || 'No Label'}: {labelObj.count}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <hr />
              <h5>Bucket by Due Date</h5>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>Count</th>
                    <th>Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {fullAggregation.bucketByDueDate && fullAggregation.bucketByDueDate.map((bucket, idx) => (
                    <tr key={idx}>
                      <td>{bucket._id}</td>
                      <td>{bucket.count}</td>
                      <td>{bucket.tasks.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <p>No full aggregation data available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFullAggModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for adding a comment */}
      <Modal
        show={showAddCommentModal}
        onHide={() => setShowAddCommentModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Comment Text</Form.Label>
            <Form.Control
              type="text"
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddCommentModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveComment}>
            Save Comment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for deleting a task */}
      <Modal
        show={showDeleteCommentModal}
        onHide={() => setShowDeleteCommentModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentTaskForComment && currentTaskForComment.comments && currentTaskForComment.comments.length > 0 ? (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Comment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentTaskForComment.comments.map((comment, idx) => (
                  <tr key={idx}>
                    <td>{comment.text}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this comment?")) {
                            handleConfirmDeleteComment(comment.text);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>No comments available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteCommentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for editing a task */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingTask && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  name="title"
                  value={editingTask.title}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Assignee</Form.Label>
                <Form.Select
                  name="assignee_id"
                  value={editingTask.assignee_id || ""}
                  onChange={handleEditChange}
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  name="priority"
                  value={editingTask.priority}
                  onChange={handleEditChange}
                >
                  {Object.entries(priorityColors).map(([key]) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="due_date"
                  value={editingTask.due_date ? editingTask.due_date.substring(0,10) : ""}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={editingTask.description}
                  onChange={handleEditChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEditTask}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Tasks;
