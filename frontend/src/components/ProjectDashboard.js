import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Plus, MoreVertical, Calendar, AlertCircle, Icon } from 'lucide-react';

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    team_id: ''
  });

  const mockFetchProjects = () => {
    // Имитация загрузки данных
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'Website Redesign',
          description: 'Complete overhaul of company website',
          status: 'in_progress',
          progress: 65,
          tasks: 12,
          team_name: 'Design Team'
        },
        {
          id: '2', 
          name: 'Mobile App Development',
          description: 'New mobile application for customers',
          status: 'todo',
          progress: 25,
          tasks: 8,
          team_name: 'Mobile Team'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    mockFetchProjects();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
          <p className="text-gray-600">Manage your projects and tasks</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          New Project
        </button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <div className="h-4 w-4 text-blue-600">
                  <Plus />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-gray-600">+2 from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                <div className="h-4 w-4 text-yellow-600">
                  <AlertCircle />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-gray-600">12 due this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <div className="h-4 w-4 text-green-600">
                  <Calendar />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-gray-600">Across 3 teams</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {projects.map(project => (
              <Card key={project.id} className="w-full">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">{project.team_name}</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-gray-600"
                          >
                            U{i+1}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">{project.tasks} tasks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <div className="grid gap-4">
            {/* Project list will go here */}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="grid gap-4">
            {/* Tasks list will go here */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;