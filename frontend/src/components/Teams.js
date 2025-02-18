import React, { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [error, setError] = useState(null);

  // Получение списка команд
  const fetchTeams = async () => {
    try {
      const response = await api.get('/api/teams');
      setTeams(response.data);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch teams');
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Создание новой команды
  const handleCreateTeam = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post('/api/teams', newTeam);
    setTeams([...teams, response.data]);
    setNewTeam({ name: '', description: '' });
    toast.success('Team created successfully!');
    fetchTeams(); // Обновляем список команд
  } catch (error) {
    toast.error('Failed to create team');
    console.error('Error creating team:', error);
  }
};

  // Редактирование команды
  const handleEditTeam = async (teamId, updatedData) => {
    try {
      const response = await api.put(`/api/teams/${teamId}`, updatedData);
      setTeams(teams.map((t) => (t.id === teamId ? response.data : t)));
      setEditingTeam(null); // Закрываем форму редактирования
      toast.success('Team updated successfully!');
    } catch (error) {
      toast.error('Failed to update team');
      console.error('Error updating team:', error);
    }
  };

  // Удаление команды
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
      console.error('Error deleting team:', error);
    }
  };

  // Добавление участника в команду
  const handleAddMemberByEmail = async (teamId, email) => {
    try {
      await api.post(`/api/teams/${teamId}/members`, { email });
      toast.success('Member added successfully!');
      fetchTeams(); // Обновляем список команд
    } catch (error) {
      toast.error('Failed to add member');
      console.error('Error adding member:', error);
    }
  };

  // Удаление участника из команды
  const handleRemoveMember = async (teamId, userId) => {
    try {
      await api.delete(`/api/teams/${teamId}/members/${userId}`);
      toast.success('Member removed successfully!');
      fetchTeams(); // Обновляем список команд
    } catch (error) {
      toast.error('Failed to remove member');
      console.error('Error removing member:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teams</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Форма создания команды */}
      <form onSubmit={handleCreateTeam} className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Create New Team</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Team Name"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={newTeam.description}
            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Team
          </button>
        </div>
      </form>

      {/* Список команд */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="border rounded p-4">
            <h3 className="text-lg font-semibold">{team.name}</h3>
            <p className="text-gray-600 mb-3">{team.description}</p>

            {/* Форма добавления участника */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const email = e.target.email.value;
                handleAddMemberByEmail(team.id, email);
                e.target.reset(); // Очищаем форму
              }}
              className="mb-4"
            >
              <h4 className="text-sm font-semibold mb-2">Add Member by Email:</h4>
              <div className="flex space-x-2">
                <input
                  type="email"
                  name="email"
                  placeholder="User Email"
                  className="w-full p-2 border rounded"
                  required
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Add
                </button>
              </div>
            </form>

            <div>
              <h4 className="text-sm font-semibold mb-2">Members:</h4>
              <ul className="list-disc pl-5">
                {team.members.map((member) => (
                  <li key={member.user_id}>
                    {member.user_id} ({member.role})
                    <button
                      onClick={() => handleRemoveMember(team.id, member.user_id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setEditingTeam(team)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTeam(team.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Форма редактирования команды */}
      {editingTeam && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditTeam(editingTeam.id, editingTeam);
          }}
          className="mb-6"
        >
          <h2 className="text-xl font-semibold mb-3">Edit Team</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Team Name"
              value={editingTeam.name}
              onChange={(e) =>
                setEditingTeam({ ...editingTeam, name: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={editingTeam.description}
              onChange={(e) =>
                setEditingTeam({ ...editingTeam, description: e.target.value })
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
                onClick={() => setEditingTeam(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default Teams;