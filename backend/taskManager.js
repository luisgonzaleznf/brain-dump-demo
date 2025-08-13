export class TaskManager {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
    this.initializeSampleData();
  }

  initializeSampleData() {
    this.createTask({
      title: 'Task from 08-13-25',
      status: 'Ready for review',
      state: 'active',
      icon: '🔄',
      timestamp: new Date('2025-08-13')
    });
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  getTask(id) {
    return this.tasks.get(id);
  }

  createTask(taskData) {
    const task = {
      id: String(this.nextId++),
      title: taskData.title || 'New Task',
      status: taskData.status || 'Created',
      state: taskData.state || 'active',
      icon: taskData.icon || '📝',
      timestamp: taskData.timestamp || new Date(),
      ...taskData
    };
    this.tasks.set(task.id, task);
    return task;
  }

  updateTask(id, updates) {
    const task = this.tasks.get(id);
    if (!task) return null;
    
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id) {
    return this.tasks.delete(id);
  }

  updateTaskState(id, newState) {
    const task = this.tasks.get(id);
    if (!task) return null;
    
    const validStates = ['active', 'completed', 'archived'];
    if (!validStates.includes(newState)) {
      return null;
    }
    
    task.state = newState;
    if (newState === 'completed') {
      task.status = 'Completed';
    }
    
    this.tasks.set(id, task);
    return task;
  }
}