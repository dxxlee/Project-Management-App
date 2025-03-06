# Project Manager App

## Overview
The **Project Manager App** is a web-based platform designed to help teams efficiently manage projects, tasks, and team collaboration. Built with **FastAPI** and **MongoDB**, it provides a streamlined experience for tracking project progress, assigning tasks, and ensuring workflow organization.

## Features
- **Centralized Project Management** – Manage multiple projects and tasks in one place.
- **Real-Time Collaboration** – Teams can work together seamlessly with role-based access control.
- **Task Prioritization & Kanban Workflow** – Assign tasks with priorities and move them through various stages (TODO, IN_PROGRESS, REVIEW, DONE).
- **Automated Reports & Insights** – Visualize project progress with analytics and reporting.
- **User Authentication & Security** – Secure login and access control for team members.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (NoSQL)
- **Frontend**: React (planned integration)
- **Authentication**: JWT & bcrypt
- **Deployment**: Docker & Render.com

## Database Design
The application follows a structured NoSQL schema using **MongoDB**, with collections for:
- **Users** – Stores authentication details and role-based permissions.
- **Teams** – Manages team collaborations and assigned members.
- **Projects** – Contains project metadata, deadlines, and ownership details.
- **Tasks** – Tracks task progress, priorities, and assignments.
- **Full Summary** – Aggregates project analytics and reports.

## Installation & Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/project-manager.git
   cd project-manager
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Set up environment variables (`.env` file):
   ```sh
   MONGO_URI="your_mongodb_connection_string"
   SECRET_KEY="your_secret_key"
   ```
4. Run the application:
   ```sh
   uvicorn main:app --reload
   ```
5. Access the API documentation at:
   ```
   http://localhost:8000/docs
   ```

## API Endpoints
| Method | Endpoint           | Description               |
|--------|-------------------|---------------------------|
| POST   | /auth/signup      | Register a new user       |
| POST   | /auth/login       | User login & JWT token    |
| GET    | /projects         | Get all projects          |
| POST   | /projects         | Create a new project      |
| PUT    | /projects/{id}    | Update a project          |
| DELETE | /projects/{id}    | Delete a project          |
| GET    | /tasks            | Get all tasks             |
| POST   | /tasks            | Create a task             |
| PUT    | /tasks/{id}       | Update task details       |
| DELETE | /tasks/{id}       | Delete a task             |

## Future Improvements
- Full frontend implementation with **React**.
- Adding more functionalities
