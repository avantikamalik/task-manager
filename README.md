🚀 Team Task Manager

A modern full-stack team collaboration and task management platform built to help teams plan projects, assign tasks, and track progress in real time.

Users can create projects, invite members, assign tasks, and monitor workflow status from To Do → In Progress → Done.
Admins get advanced controls for managing project members and permissions.

✨ Features
👥 Team-based project collaboration
📌 Create, update, and delete projects
✅ Task management with status tracking
🎯 Assign tasks to team members
🔐 Secure authentication (JWT-based)
🧑‍💼 Role-based access control (Admin / Member)
📊 Dashboard with task overview & stats
⚡ Real-time UI updates (React Query powered)
📱 Fully responsive modern UI
🧰 Tech Stack
Frontend
React 18 (Vite)
React Router
TanStack Query
React Hook Form
Tailwind CSS
shadcn-style UI components
Lucide Icons
Backend
Node.js
Express.js
Knex.js (SQL query builder)
Zod (validation)
JWT Authentication
bcryptjs
Database
MySQL 8
Deployment
Railway (Nixpacks)
📁 Project Structure
client/   → React Frontend (SPA)
server/   → Express Backend API
.env.example
nixpacks.toml
railway.json
Client
UI components
Pages & routing
Auth context
API integration
Server
Controllers (auth, tasks, projects)
Middleware (auth, validation, RBAC)
Routes (REST APIs)
Database migrations & seeds
⚙️ Getting Started (Local Setup)
1️⃣ Clone repository
git clone <your-repo-url>
cd team-task-manager
2️⃣ Install dependencies
npm run install:all
3️⃣ Setup environment
cp .env.example .env

Configure:

DATABASE_URL=mysql://user:password@host:3306/team_task_manager
JWT_SECRET=your-secret-key
4️⃣ Run migrations & seed
npm run migrate
npm run seed
5️⃣ Start development server
npm run dev

👉 Frontend: http://localhost:5173

👉 Backend: http://localhost:4000

🔑 Demo Accounts
Role	Email	Password
Admin	admin@example.com
	Admin@12345
User	alice@example.com
	Member@12345
User	bob@example.com
	Member@12345
🚀 Deployment (Railway)
Create MySQL database on Railway
Deploy repo from GitHub
Add environment variables:
DATABASE_URL
JWT_SECRET
NODE_ENV=production
Railway automatically builds and deploys 🚀
🔐 Security
Passwords hashed with bcrypt
JWT authentication
Role-based access control
Input validation using Zod
SQL injection protection (Knex)
Rate limiting on auth routes
Secure environment variables
📊 Database Overview
Users → authentication & roles
Projects → team workspaces
Tasks → project work items
Project Members → team access control
💡 Why this project is special

This project is designed as a real-world SaaS-style collaboration tool, demonstrating:

Full-stack architecture
Scalable backend design
Modern React frontend patterns
Authentication & authorization systems
Production-ready deployment setup
