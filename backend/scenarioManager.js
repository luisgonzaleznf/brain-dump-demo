import { findScenario, getScenarioResponse, scenarios } from './scenarios.js';

class ScenarioManager {
  constructor() {
    // Store active conversations by session/user
    this.activeConversations = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Process a chat message and return appropriate response
  processMessage(sessionId, input, history = []) {
    // Clean up old sessions
    this.cleanupOldSessions();
    
    // Get or create session
    let session = this.activeConversations.get(sessionId);
    
    // Check if we're in an active scenario
    if (session && session.scenario) {
      return this.continueScenario(sessionId, input);
    }
    
    // Try to identify a new scenario
    const scenarioKey = findScenario(input);
    
    if (scenarioKey) {
      return this.startScenario(sessionId, scenarioKey, input);
    }
    
    // Default response if no scenario matches
    return {
      reply: this.getDefaultResponse(input),
      scenario: null,
      stage: null
    };
  }

  // Start a new scenario
  startScenario(sessionId, scenarioKey, input) {
    const scenario = scenarios[scenarioKey];
    const response = getScenarioResponse(scenarioKey, 'initial');
    
    if (!response) {
      return {
        reply: this.getDefaultResponse(input),
        scenario: null,
        stage: null
      };
    }
    
    // Process input if scenario has processInput function
    let processedInput = null;
    if (scenario.processInput) {
      processedInput = scenario.processInput(input);
    }
    
    // Get response (may be a function or string)
    let replyText = response.response;
    if (typeof response.response === 'function') {
      replyText = response.response({ processedInput, input });
    }
    
    // Create new session
    this.activeConversations.set(sessionId, {
      scenario: scenarioKey,
      stage: response.nextStage,
      startTime: Date.now(),
      context: {
        initialInput: input,
        responses: [input],
        processedInput: processedInput
      }
    });
    
    // Prepare task data if needed
    let taskData = null;
    if (response.createTask) {
      taskData = this.createTaskFromContext({
        ...this.activeConversations.get(sessionId).context,
        taskType: response.taskType
      });
    }
    
    return {
      reply: replyText,
      scenario: scenarioKey,
      stage: 'initial',
      createTask: response.createTask || false,
      taskData: taskData,
      taskType: response.taskType,
      showGameplan: response.showGameplan || false,
      showOptions: response.showOptions || false,
      optionsDelay: response.optionsDelay || 0,
      restaurantOptions: response.restaurantOptions || null,
      showDestinations: response.showDestinations || false,
      destinationOptions: response.destinationOptions || null,
      destinationsDelay: response.destinationsDelay || 0,
      showTaskChecklist: response.showTaskChecklist || false,
      suggestedTasks: response.suggestedTasks || null
    };
  }

  // Continue an existing scenario
  continueScenario(sessionId, input) {
    const session = this.activeConversations.get(sessionId);
    if (!session) {
      return {
        reply: this.getDefaultResponse(input),
        scenario: null,
        stage: null
      };
    }
    
    // Get response for current stage
    const response = getScenarioResponse(session.scenario, session.stage);
    
    if (!response) {
      // Scenario complete or error
      this.activeConversations.delete(sessionId);
      return {
        reply: "Thanks for sharing that with me. What else is on your mind?",
        scenario: session.scenario,
        stage: 'complete'
      };
    }
    
    // Store user response in context
    session.context.responses.push(input);
    
    // Update session stage
    if (response.nextStage === 'complete') {
      this.activeConversations.delete(sessionId);
    } else {
      session.stage = response.nextStage;
      session.lastActivity = Date.now();
    }
    
    // Check if we should create a task
    let taskData = null;
    if (response.createTask) {
      taskData = this.createTaskFromContext(session.context);
    }
    
    // Get response text (may be a function)
    let replyText = response.response;
    if (typeof response.response === 'function') {
      replyText = response.response(session.context);
    }
    
    return {
      reply: replyText,
      scenario: session.scenario,
      stage: session.stage,
      createTask: response.createTask || false,
      taskData: taskData,
      showGameplan: response.showGameplan || false,
      restaurantOptions: response.restaurantOptions || null
    };
  }

  // Create task data from conversation context
  createTaskFromContext(context) {
    const responses = context.responses;
    
    // Special handling for appointment cancellation
    if (context.taskType === 'appointment_cancellation' && context.processedInput) {
      const info = context.processedInput;
      return {
        title: `Cancel appointment${info.doctor ? ` with ${info.doctor}` : ''}`,
        description: context.initialInput,
        priority: 'high',
        deadline: info.date,
        source: 'brain_dump',
        taskType: 'appointment_cancellation',
        appointmentDetails: info
      };
    }
    
    // Special handling for restaurant booking
    if (context.taskType === 'restaurant_booking' && context.processedInput) {
      const info = context.processedInput;
      let title = 'Book restaurant';
      if (info.location) title += ` ${info.location}`;
      if (info.people) title += ` for ${info.people} people`;
      if (info.when && info.time) title += ` ${info.when} at ${info.time}`;
      
      return {
        title: title,
        description: context.initialInput,
        priority: 'medium',
        deadline: info.when === 'tonight' ? new Date().toISOString() : null,
        source: 'brain_dump',
        taskType: 'restaurant_booking',
        bookingDetails: info
      };
    }
    
    return {
      title: responses[1] || context.initialInput,
      description: responses.join(' → '),
      priority: responses[3] ? this.extractPriority(responses[3]) : 'medium',
      deadline: responses[2] ? this.extractDeadline(responses[2]) : null,
      source: 'brain_dump'
    };
  }

  // Extract priority from user input
  extractPriority(input) {
    const lower = input.toLowerCase();
    if (lower.includes('high') || lower.includes('urgent')) return 'high';
    if (lower.includes('low')) return 'low';
    return 'medium';
  }

  // Extract deadline from user input
  extractDeadline(input) {
    // Simple deadline extraction - can be enhanced
    const lower = input.toLowerCase();
    
    if (lower.includes('today')) {
      const today = new Date();
      today.setHours(23, 59, 59);
      return today.toISOString();
    }
    
    if (lower.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59);
      return tomorrow.toISOString();
    }
    
    if (lower.includes('week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString();
    }
    
    // Try to parse any date mentioned
    const dateMatch = input.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      const year = new Date().getFullYear();
      return new Date(year, month - 1, day).toISOString();
    }
    
    return null;
  }

  // Default response when no scenario matches
  getDefaultResponse(input) {
    const responses = [
      `I understand you're thinking about "${input}". Would you like to explore this further?`,
      `That's interesting. Tell me more about "${input}".`,
      `I'm here to help you process that thought. What aspect of this is most important to you?`,
      `Let's dive deeper into that. What's the next step you're considering?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Clean up old sessions
  cleanupOldSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.activeConversations) {
      if (now - session.startTime > this.sessionTimeout) {
        this.activeConversations.delete(sessionId);
      }
    }
  }

  // Handle destination selection for ski trip
  selectDestination(sessionId, destinationName) {
    const session = this.activeConversations.get(sessionId);
    if (!session || session.scenario !== 'skiTripPlanning') {
      return {
        reply: "I couldn't find your trip planning session.",
        scenario: null,
        stage: null
      };
    }
    
    // Store selected destination in context
    session.context.selectedDestination = destinationName;
    
    // Move to next stage
    const response = getScenarioResponse('skiTripPlanning', 'destinations');
    if (!response) {
      return {
        reply: "There was an error with your selection.",
        scenario: session.scenario,
        stage: session.stage
      };
    }
    
    // Update session
    session.stage = response.nextStage;
    
    return {
      reply: response.response,
      scenario: session.scenario,
      stage: session.stage,
      showTaskChecklist: response.showTaskChecklist || false,
      suggestedTasks: response.suggestedTasks || null
    };
  }

  // Handle task selection for ski trip
  selectTripTasks(sessionId, selectedTasks) {
    const session = this.activeConversations.get(sessionId);
    if (!session || session.scenario !== 'skiTripPlanning') {
      return {
        reply: "I couldn't find your trip planning session.",
        scenario: null,
        stage: null
      };
    }
    
    // Store selected tasks in context
    session.context.selectedTasks = selectedTasks;
    
    // Move to final stage
    const response = getScenarioResponse('skiTripPlanning', 'tasks');
    if (!response) {
      return {
        reply: "There was an error creating your tasks.",
        scenario: session.scenario,
        stage: session.stage
      };
    }
    
    // Get response text
    let replyText = response.response;
    if (typeof response.response === 'function') {
      replyText = response.response({ selectedTasks });
    }
    
    // Mark session as complete
    this.activeConversations.delete(sessionId);
    
    return {
      reply: replyText,
      scenario: session.scenario,
      stage: 'complete',
      tasksToCreate: selectedTasks,
      selectedDestination: session.context.selectedDestination
    };
  }

  // Handle restaurant selection
  selectRestaurant(sessionId, restaurantName) {
    const session = this.activeConversations.get(sessionId);
    if (!session || session.scenario !== 'restaurantBooking') {
      return {
        reply: "I couldn't find your restaurant booking session.",
        scenario: null,
        stage: null
      };
    }
    
    // Store selected restaurant in context
    session.context.selectedRestaurant = restaurantName;
    
    // Move to selected stage
    const response = getScenarioResponse('restaurantBooking', 'selected');
    if (!response) {
      return {
        reply: "There was an error with your selection.",
        scenario: session.scenario,
        stage: session.stage
      };
    }
    
    // Get response text
    let replyText = response.response;
    if (typeof response.response === 'function') {
      replyText = response.response({ selectedRestaurant: restaurantName });
    }
    
    // Update session
    session.stage = response.nextStage;
    if (response.nextStage === 'complete') {
      this.activeConversations.delete(sessionId);
    }
    
    return {
      reply: replyText,
      scenario: session.scenario,
      stage: session.stage,
      showGameplan: response.showGameplan || false,
      taskType: 'restaurant_booking'
    };
  }

  // Get session info (for debugging)
  getSessionInfo(sessionId) {
    return this.activeConversations.get(sessionId) || null;
  }

  // Clear all sessions (for testing)
  clearAllSessions() {
    this.activeConversations.clear();
  }
}

export default ScenarioManager;