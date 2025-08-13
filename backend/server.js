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
      deadline: result.taskData.deadline,
      taskType: result.taskData.taskType
    });
    
    // Add complete task info to response
    result.taskCreated = task;
  }
  
  res.json({ 
    reply: result.reply,
    sessionId: session,
    scenario: result.scenario,
    stage: result.stage,
    taskCreated: result.taskCreated || null,
    taskType: result.taskType || null,
    showGameplan: result.showGameplan || false,
    showOptions: result.showOptions || false,
    optionsDelay: result.optionsDelay || 0,
    restaurantOptions: result.restaurantOptions || null,
    showDestinations: result.showDestinations || false,
    destinationOptions: result.destinationOptions || null,
    destinationsDelay: result.destinationsDelay || 0,
    showTaskChecklist: result.showTaskChecklist || false,
    suggestedTasks: result.suggestedTasks || null
  });
});

// Handle restaurant selection
app.post('/api/select-restaurant', async (req, res) => {
  const { sessionId, restaurantName } = req.body;
  
  if (!sessionId || !restaurantName) {
    return res.status(400).json({ error: 'Session ID and restaurant name are required' });
  }
  
  const result = scenarioManager.selectRestaurant(sessionId, restaurantName);
  
  // Find the restaurant booking task
  let selectedTask = null;
  if (result.showGameplan && result.taskType === 'restaurant_booking') {
    const allTasks = taskManager.getAllTasks();
    selectedTask = allTasks
      .filter(task => task.taskType === 'restaurant_booking')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
  }
  
  res.json({
    reply: result.reply,
    sessionId: sessionId,
    scenario: result.scenario,
    stage: result.stage,
    showGameplan: result.showGameplan || false,
    taskType: result.taskType || null,
    selectedTask: selectedTask
  });
});

// Handle destination selection for ski trip
app.post('/api/select-destination', async (req, res) => {
  const { sessionId, destinationName } = req.body;
  
  if (!sessionId || !destinationName) {
    return res.status(400).json({ error: 'Session ID and destination name are required' });
  }
  
  const result = scenarioManager.selectDestination(sessionId, destinationName);
  
  res.json({
    reply: result.reply,
    sessionId: sessionId,
    scenario: result.scenario,
    stage: result.stage,
    showTaskChecklist: result.showTaskChecklist || false,
    suggestedTasks: result.suggestedTasks || null
  });
});

// Create a single task for ski trip
app.post('/api/create-single-task', async (req, res) => {
  const { task, destination } = req.body;
  
  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }
  
  const createdTask = taskManager.createTask({
    title: `${task.title} - ${destination || 'Ski Trip'}`,
    description: `Part of your ski trip planning`,
    status: 'Planning',
    state: 'active',
    icon: task.icon || '🎿',
    priority: 'medium',
    taskType: 'ski_trip_task',
    needsResearch: true  // Flag to show research options instead of gameplan
  });
  
  res.json({
    success: true,
    task: createdTask
  });
});

// Handle task selection for ski trip
app.post('/api/select-trip-tasks', async (req, res) => {
  const { sessionId, selectedTasks } = req.body;
  
  if (!sessionId || !selectedTasks) {
    return res.status(400).json({ error: 'Session ID and selected tasks are required' });
  }
  
  const result = scenarioManager.selectTripTasks(sessionId, selectedTasks);
  
  // Create the selected tasks
  const createdTasks = [];
  if (result.tasksToCreate) {
    result.tasksToCreate.forEach(taskInfo => {
      const task = taskManager.createTask({
        title: `${taskInfo.title} - ${result.selectedDestination || 'Ski Trip'}`,
        description: `Part of your ski trip planning`,
        status: 'Created from brain dump',
        state: 'active',
        icon: taskInfo.icon || '🎿',
        priority: 'medium',
        taskType: 'ski_trip_task'
      });
      createdTasks.push(task);
    });
  }
  
  res.json({
    reply: result.reply,
    sessionId: sessionId,
    scenario: result.scenario,
    stage: result.stage,
    createdTasks: createdTasks
  });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});