class DuckbillApp {
  constructor() {
    this.currentScreen = 'home';
    this.tasks = [];
    this.credits = 62;
    this.apiUrl = 'http://localhost:3001/api';
    this.init();
  }

  async init() {
    await this.loadTasks();
    this.render();
    this.attachEventListeners();
  }

  async loadTasks() {
    try {
      const response = await fetch(`${this.apiUrl}/tasks`);
      this.tasks = await response.json();
    } catch (error) {
      console.error('Failed to load tasks:', error);
      this.tasks = [];
    }
  }

  async createTask(taskData) {
    try {
      const response = await fetch(`${this.apiUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const newTask = await response.json();
      this.tasks.push(newTask);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }

  async updateTaskState(taskId, newState) {
    try {
      const response = await fetch(`${this.apiUrl}/tasks/${taskId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      const updatedTask = await response.json();
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      }
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task state:', error);
    }
  }

  render() {
    const app = document.getElementById('app');
    if (this.currentScreen === 'home') {
      app.innerHTML = this.renderHomeScreen();
    } else if (this.currentScreen === 'addTask') {
      app.innerHTML = this.renderAddTaskScreen();
    }
  }

  renderHomeScreen() {
    const activeTasks = this.tasks.filter(t => t.state === 'active');
    return `
      <div class="screen home-screen">
        <div class="status-bar">
          <span class="time">14:57</span>
          <div class="status-icons">
            <span class="signal">📶</span>
            <span class="network">5G</span>
            <span class="battery">85</span>
          </div>
        </div>
        
        <header class="app-header">
          <h1 class="app-title">duckbill</h1>
          <div class="credits-badge">${this.credits} credits</div>
        </header>
        
        <div class="content">
          <div class="section-label">ACTIVE</div>
          
          <div class="task-list">
            ${activeTasks.map(task => `
              <div class="task-card" data-task-id="${task.id}">
                <div class="task-icon">${task.icon}</div>
                <div class="task-content">
                  <div class="task-title">${task.title}</div>
                  <div class="task-status">${task.status}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <button type="button" class="fab" id="addTaskBtn" aria-label="Add task">
          <span class="fab-icon">+</span>
        </button>
        
        <nav class="bottom-nav">
          <button class="nav-item active">
            <span class="nav-icon">🏠</span>
          </button>
          <button class="nav-item">
            <span class="nav-icon">🧭</span>
          </button>
          <button class="nav-item">
            <span class="nav-icon">✅</span>
          </button>
          <button class="nav-item">
            <span class="nav-text">LG</span>
          </button>
        </nav>
      </div>
    `;
  }

  renderAddTaskScreen() {
    return `
      <div class="screen add-task-screen">
        <div class="status-bar">
          <span class="time">14:57</span>
          <div class="status-icons">
            <span class="signal">📶</span>
            <span class="network">5G</span>
            <span class="battery">85</span>
          </div>
        </div>
        
        <header class="add-task-header">
          <button class="back-btn" id="backBtn">←</button>
          <h2>New Task</h2>
          <div></div>
        </header>
        
        <div class="add-task-content">
          <form id="taskForm">
            <div class="form-group">
              <label for="taskTitle">Task Title</label>
              <input type="text" id="taskTitle" name="title" required>
            </div>
            
            <div class="form-group">
              <label for="taskDescription">Description</label>
              <textarea id="taskDescription" name="description" rows="4"></textarea>
            </div>
            
            <div class="form-group">
              <label for="taskIcon">Icon</label>
              <select id="taskIcon" name="icon">
                <option value="📝">📝 Note</option>
                <option value="🔄">🔄 Review</option>
                <option value="⚡">⚡ Urgent</option>
                <option value="💡">💡 Idea</option>
                <option value="🎯">🎯 Goal</option>
              </select>
            </div>
            
            <button type="submit" class="submit-btn">Create Task</button>
          </form>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const addBtn = document.getElementById('addTaskBtn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.currentScreen = 'addTask';
        this.render();
        this.attachEventListeners();
      }, { once: true });
    }

    document.addEventListener('click', async (e) => {
      if (e.target.id === 'backBtn' || e.target.closest('#backBtn')) {
        this.currentScreen = 'home';
        this.render();
        this.attachEventListeners();
      }
      const taskCard = e.target.closest('.task-card');
      if (taskCard) {
        const taskId = taskCard.dataset.taskId;
        await this.updateTaskState(taskId, 'completed');
        await this.loadTasks();
        this.render();
        this.attachEventListeners();
      }
    });

    const form = document.getElementById('taskForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const taskData = {
          title: formData.get('title'),
          description: formData.get('description'),
          icon: formData.get('icon'),
          status: 'Created',
          state: 'active'
        };
        await this.createTask(taskData);
        this.currentScreen = 'home';
        this.render();
        this.attachEventListeners();
      });
    }
  }
}

const app = new DuckbillApp();