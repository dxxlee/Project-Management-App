import React, { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', team_id: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'my', 'team'
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Projects</option>
            <option value="my">My Projects</option>
            <option value="team">Team Projects</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateProject} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <select
              value={newProject.team_id}
              onChange={(e) => setNewProject({ ...newProject, team_id: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="">Select team (optional)</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full p-2 border rounded h-24"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Create Project
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingProject(project)}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{project.description}</p>
              {project.team_id && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded mb-4">
                  Team: {project.team_name}
                </span>
              )}
              <div className="border-t pt-4">
                <Link
                  to={`/projects/${project.id}/tasks`}
                  className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  View Tasks
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal для редактирования проекта */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditProject(editingProject.id, editingProject);
            }}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full p-2 border rounded h-24"
                />
                <select
                  value={editingProject.team_id || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, team_id: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">No team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;