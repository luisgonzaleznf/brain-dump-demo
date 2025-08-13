import express from 'express';
import cors from 'cors';
import { TaskManager } from './taskManager.js';
import ScenarioManager from './scenarioManager.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const taskManager = new TaskManager();
const scenarioManager = new ScenarioManager();

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
  const { input, history, sessionId } = req.body;
  
  // Generate session ID if not provided
  const session = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Process message through scenario manager
  const result = scenarioManager.processMessage(session, input, history);
  
  // If scenario indicates task creation, create the task
  if (result.createTask && result.taskData) {
    const task = taskManager.createTask({
      title: result.taskData.title,
      description: result.taskData.description,
      status: 'Created from brain dump',
      state: 'active',
      icon: '🧠',
      priority: result.taskData.priority,
      deadline: result.taskData.deadline
    });
    
    // Add task info to response
    result.taskCreated = {
      id: task.id,
      title: task.title
    };
  }
  
  res.json({ 
    reply: result.reply,
    sessionId: session,
    scenario: result.scenario,
    stage: result.stage,
    taskCreated: result.taskCreated || null,
    taskType: result.taskType || null,
    showGameplan: result.showGameplan || false
  });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});