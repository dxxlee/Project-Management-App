import React, { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]); // Массив команд
  const [newProject, setNewProject] = useState({ name: '', description: '', team_id: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [error, setError] = useState(null);

  // Получение списка проектов
  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch projects');
      console.error('Error fetching projects:', error);
    }
  };

  // Получение списка команд
  const fetchTeams = async () => {
    try {
      const response = await api.get('/api/teams');
      console.log("Teams Data:", response.data); // Проверяем, что API возвращает
      if (Array.isArray(response.data)) {
        setTeams(response.data); // Устанавливаем teams только если это массив
      } else {
        console.error("Teams data is not an array:", response.data);
        setError("Failed to load teams: Data is not an array");
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError(error.response?.data?.detail || 'Failed to fetch teams');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, []);

  // Создание нового проекта
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (newProject.team_id) {
        // Создаем проект для выбранной команды
        response = await api.post(`/api/teams/${newProject.team_id}/projects`, newProject);
      } else {
        // Стандартное создание проекта
        response = await api.post('/api/projects', newProject);
      }
      setProjects([...projects, response.data]);
      setNewProject({ name: '', description: '', team_id: '' });
      toast.success('Project created successfully!');
      fetchProjects(); // Обновляем список проектов
    } catch (error) {
      toast.error('Failed to create project');
      console.error('Error creating project:', error);
    }
  };

  const handleEditProject = async (projectId, updatedData) => {
    try {
      const response = await api.put(`/api/projects/${projectId}`, updatedData);
      setProjects(projects.map((p) => (p.id === projectId ? response.data : p)));
      setEditingProject(null); // Закрываем форму редактирования
      toast.success('Project updated successfully!');
    } catch (error) {
      toast.error('Failed to update project');
      console.error('Error updating project:', error);
    }
  };

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
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Форма создания проекта */}
      <form onSubmit={handleCreateProject} className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Create New Project</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          {/* Выпадающий список для выбора команды (необязательно) */}
          <select
            value={newProject.team_id}
            onChange={(e) =>
              setNewProject({ ...newProject, team_id: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            <option value="">Select team (optional)</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Project
          </button>
        </div>
      </form>

      {/* Форма редактирования проекта */}
      {editingProject && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditProject(editingProject.id, editingProject);
          }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-3">Edit Project</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Project Name"
              value={editingProject.name}
              onChange={(e) =>
                setEditingProject({ ...editingProject, name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={editingProject.description}
              onChange={(e) =>
                setEditingProject({ ...editingProject, description: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Список проектов */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="border rounded p-4">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-gray-600 mb-3">{project.description}</p>
            {project.team_id && (
              <p className="text-sm text-blue-600 mb-2">
                Team: {project.team_name}
              </p>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingProject(project)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
