import express from 'express';
import cors from 'cors';
import { TaskManager } from './taskManager.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const taskManager = new TaskManager();

app.get('/api/tasks', (req, res) => {
  res.json(taskManager.getAllTasks());
});

app.get('/api/tasks/:id', (req, res) => {
  const task = taskManager.getTask(req.params.id);
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.post('/api/tasks', (req, res) => {
  const task = taskManager.createTask(req.body);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const task = taskManager.updateTask(req.params.id, req.body);
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const success = taskManager.deleteTask(req.params.id);
  if (success) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.put('/api/tasks/:id/state', (req, res) => {
  const { state } = req.body;
  const task = taskManager.updateTaskState(req.params.id, state);
  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { input, history } = req.body;
  
  // Simple response logic - you can enhance this with AI integration later
  let reply = '';
  
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('task') || lowerInput.includes('todo')) {
    reply = "I can help you organize that into a task. What would you like to call it, and when do you need it done?";
  } else if (lowerInput.includes('help')) {
    reply = "I'm here to help you brain dump your thoughts and turn them into actionable tasks. Just tell me what's on your mind!";
  } else if (lowerInput.includes('stressed') || lowerInput.includes('overwhelmed')) {
    reply = "Let's break things down into smaller, manageable pieces. What's the most pressing thing on your mind right now?";
  } else {
    // Echo back with helpful prompting
    reply = `I understand you're thinking about "${input}". Would you like to turn this into a task, or tell me more about it?`;
  }
  
  res.json({ reply });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});