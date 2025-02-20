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
  Spinner
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

  const fetchTasks = async (projectId) => {
    setLoading(true);
    try {
      console.log('Fetching tasks for project:', projectId); // Отладочный лог
      const response = await api.get(`/api/projects/${projectId}/tasks`);
      console.log('Response:', response.data); // Отладочный лог

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const formattedTask = {
        ...newTask,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        assignee_id: newTask.assignee_id || null
      };

      await api.post(`/api/projects/${projectId}/tasks`, formattedTask);
      await fetchTasks(projectId);

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
                            onChange={e => setNewTask({...newTask, title: e.target.value})}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Assignee</Form.Label>
                          <Form.Select
                            value={newTask.assignee_id}
                            onChange={e => setNewTask({...newTask, assignee_id: e.target.value})}
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
                            onChange={e => setNewTask({...newTask, priority: e.target.value})}
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
                            onChange={e => setNewTask({...newTask, due_date: e.target.value})}
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
                            onChange={e => setNewTask({...newTask, description: e.target.value})}
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
                                              <Dropdown.Toggle
                                                variant="link"
                                                className="p-0 text-dark"
                                              >
                                                <ThreeDotsVertical />
                                              </Dropdown.Toggle>
                                              <Dropdown.Menu>
                                                <Dropdown.Item>Edit</Dropdown.Item>
                                                <Dropdown.Item>Delete</Dropdown.Item>
                                              </Dropdown.Menu>
                                            </Dropdown>
                                          </div>
                                          <p className="small text-muted mb-2">
                                            {task.description}
                                          </p>
                                          <Stack gap={2} direction="horizontal">
                                            {task.assignee && (
                                              <Badge bg="light" text="dark" className="d-flex align-items-center">
                                                <PersonFill className="me-1" />
                                                {task.assignee.username}
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
                                        <Badge
                                          bg={priorityColors[task.priority]}
                                          className="align-self-start"
                                        >
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
    </Container>
  );
};

export default Tasks;