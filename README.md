# Duckbill - Brain Dump Demo

A React-based task management app with AI-powered brain dump functionality and intelligent task routing.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start backend server (port 3001)
npm run server

# Start frontend (port 5173)
npm run dev
```

## 📱 Features

### Brain Dump Chat Interface
- **"What's on your mind?"** prompt with large text input
- Voice recording support with Web Speech API
- Scenario-based intelligent routing for different input types

### Task Management
- Create and manage tasks from natural language input
- Task detail view with chat interface
- Automatic task creation from appointment cancellations

### Gameplan System
- **3 Service Tiers:**
  - 🟣 **Call - Urgent** (6 credits): 2-hour completion, up to 7 call attempts
  - 🔵 **Call - Flexible** (2 credits): 3-day completion window
  - 🟡 **Email** (Free): Automated email handling by AI assistant "Billy"
- Interactive tooltips explaining each service level
- Credit-based system (starts with 62 credits)

## 🎯 Scenario Types

1. **Appointment Cancellation**: Parses dates, times, doctor names
2. **Task Creation**: General todo/reminder handling
3. **Emotional Support**: Stress/anxiety management responses
4. **Brainstorming**: Idea development flows
5. **Daily Review**: Reflection and planning

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Express.js, Node.js
- **State**: Session-based conversation management
- **Build**: Vite

## 📂 Project Structure

```
├── src/
│   ├── App.jsx          # Main React component
│   └── index.css        # Tailwind styles
├── backend/
│   ├── server.js        # Express API server
│   ├── taskManager.js   # Task CRUD operations
│   ├── scenarios.js     # Scenario definitions
│   └── scenarioManager.js # Conversation routing
└── package.json
```

## 🔑 Key Interactions

- **Plus Button (+)**: Opens brain dump chat
- **Enter Key**: Sends message (no line breaks)
- **Task Cards**: Click to view details and gameplan
- **Gameplan Button**: Shows service options popup
- **Bottom Nav**: Home, Mind (chat), Tasks, Profile

## 💡 Example Input

Type: *"Cancel my Sept 12, 10:30 a.m. appointment with Dr. Rivera. Confirm no fee."*

Result: Automatically creates task and shows gameplan options for handling the cancellation.

## 📝 Git Workflow

### Repository
- **GitHub URL**: https://github.com/luisgonzaleznf/brain-dump-demo

### Making Commits
```bash
# Check status
git status

# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "Your commit message here"

# Push to GitHub
git push origin main
```

### Commit Best Practices
- Use clear, descriptive commit messages
- Commit frequently after completing features
- Format: `"<action>: <what changed>"`
- Example: `"Add: Task detail chat functionality"`