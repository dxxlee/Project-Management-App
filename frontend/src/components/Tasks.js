import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
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

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

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
        // Format the date properly if it exists
        const formattedTask = {
            ...newTask,
            due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
            // Only include assignee_id if it's not empty
            assignee_id: newTask.assignee_id || null,
            // Ensure these fields are present
            labels: newTask.labels || [],
            comments: newTask.comments || []
        };

        const response = await api.post(`/api/projects/${selectedProject}/tasks`, formattedTask);
        
        await fetchTasks(selectedProject);
        // Reset form
        setNewTask({
            title: '',
            description: '',
            priority: 'MEDIUM',
            status: 'todo',
            due_date: null,
            assignee_id: null,
            labels: [],
            comments: []
        });
        toast.success('Task created successfully');
    } catch (error) {
        console.error('Task creation error:', error.response?.data);
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks Management</h1>
      
      {/* Project Selection */}
      <select
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      >
        <option value="">Select Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>

      {/* New Task Form */}
      {selectedProject && (
        <form onSubmit={handleCreateTask} className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Create New Task</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              className="w-full p-2 border rounded"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
              className="w-full p-2 border rounded"
            />
            <select
              value={newTask.assignee_id}
              onChange={(e) => setNewTask({...newTask, assignee_id: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">Assign to...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* Tasks Kanban Board */}
      {selectedProject && !loading && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-4">
            {['todo', 'in_progress', 'review', 'done'].map(status => (
              <div key={status} className="bg-gray-100 p-4 rounded">
                <h3 className="text-lg font-semibold mb-3 capitalize">
                  {status.replace('_', ' ')}
                </h3>
                <Droppable droppableId={status}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {tasks[status]?.map((task, index) => (
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
                              className="bg-white p-3 rounded shadow"
                            >
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                              <div className="mt-2 flex justify-between text-sm">
                                <span className={`px-2 py-1 rounded ${
                                  task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.priority}
                                </span>
                                {task.due_date && (
                                  <span className="text-gray-500">
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default Tasks;