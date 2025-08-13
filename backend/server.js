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

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});