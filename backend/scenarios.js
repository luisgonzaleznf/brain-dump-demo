export const scenarios = {
  // Scenario 1: Appointment Cancellation Flow
  appointmentCancellation: {
    name: 'Appointment Cancellation',
    triggers: ['cancel', 'appointment', 'dr.', 'doctor', 'reschedule'],
    processInput: (input) => {
      // Extract appointment details from input
      const dateMatch = input.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\s+\d{1,2}/i);
      const timeMatch = input.match(/\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)/i);
      const doctorMatch = input.match(/(?:Dr\.?|Doctor)\s+(\w+)/i);
      const feeMatch = input.match(/(?:no fee|fee|charge)/i);
      
      return {
        date: dateMatch ? dateMatch[0] : null,
        time: timeMatch ? timeMatch[0] : null,
        doctor: doctorMatch ? doctorMatch[0] : null,
        checkFee: feeMatch !== null,
        fullText: input
      };
    },
    conversations: [
      {
        stage: 'initial',
        response: (details) => {
          const info = details.processedInput;
          return `I'll help you cancel your appointment${info.doctor ? ` with ${info.doctor}` : ''}${info.date ? ` on ${info.date}` : ''}${info.time ? ` at ${info.time}` : ''}. Let me create a gameplan for you.`;
        },
        nextStage: 'complete',
        createTask: true,
        taskType: 'appointment_cancellation',
        showGameplan: true
      }
    ]
  },

  // Scenario 2: Restaurant Booking Flow
  restaurantBooking: {
    name: 'Restaurant Booking',
    triggers: ['book', 'restaurant', 'reservation', 'table', 'dinner', 'lunch', 'eat', 'dining'],
    processInput: (input) => {
      // Extract booking details from input
      const peopleMatch = input.match(/(\d+)[-–—]\s*(\d+)\s+people/i) || input.match(/(\d+)\s+people/i);
      const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)/i) || input.match(/(\d{1,2})\s*(?:a\.?m\.?|p\.?m\.?)/i);
      const tonightMatch = input.match(/tonight|today|this evening/i);
      const vegMatch = input.match(/veg|vegetarian|vegan/i);
      const locationMatch = input.match(/downtown|uptown|midtown|[A-Z][a-z]+\s+(?:area|district|neighborhood)/i);
      
      return {
        people: peopleMatch ? (peopleMatch[2] ? `${peopleMatch[1]}–${peopleMatch[2]}` : peopleMatch[1]) : null,
        time: timeMatch ? timeMatch[0] : null,
        when: tonightMatch ? tonightMatch[0] : null,
        dietary: vegMatch ? 'vegetarian-friendly' : null,
        location: locationMatch ? locationMatch[0] : null,
        fullText: input
      };
    },
    conversations: [
      {
        stage: 'initial',
        response: (details) => {
          const info = details.processedInput;
          let response = `I'll help you book a restaurant`;
          if (info.location) response += ` ${info.location}`;
          if (info.people) response += ` for ${info.people} people`;
          if (info.when && info.time) response += ` ${info.when} at ${info.time}`;
          if (info.dietary) response += ` (${info.dietary})`;
          response += '. Let me find some options for you.';
          return response;
        },
        nextStage: 'options',
        createTask: true,
        taskType: 'restaurant_booking',
        showOptions: true,
        optionsDelay: 3000,
        restaurantOptions: [
          {
            name: "Olive Garden Downtown",
            cuisine: "Italian",
            note: "Great vegetarian options, no online reservations"
          },
          {
            name: "The Green Table",
            cuisine: "Farm-to-table",
            note: "Fully vegetarian menu, call-only reservations"
          },
          {
            name: "Bistro Central",
            cuisine: "Contemporary American",
            note: "Excellent veg options, phone reservations only"
          }
        ]
      },
      {
        stage: 'selected',
        response: (details) => {
          return `Perfect choice! I'll handle the reservation at ${details.selectedRestaurant}. Since they don't accept online reservations, I'll need to call them directly.`;
        },
        nextStage: 'complete',
        showGameplan: true
      }
    ]
  },

  // Scenario 3: Original Task Creation Flow (renamed from Scenario 1)
  taskCreation: {
    name: 'Task Creation',
    triggers: ['remind', 'todo', 'task', 'need to', 'have to', 'must', 'deadline'],
    conversations: [
      {
        stage: 'initial',
        response: "I'll help you create a task for that. What exactly needs to be done?",
        nextStage: 'details'
      },
      {
        stage: 'details',
        response: "Got it! When do you need this completed by?",
        nextStage: 'deadline'
      },
      {
        stage: 'deadline',
        response: "Perfect! I've noted that down. Would you like to set a priority level? (High/Medium/Low)",
        nextStage: 'priority'
      },
      {
        stage: 'priority',
        response: "Task created successfully! I'll make sure you don't forget about this. Anything else on your mind?",
        nextStage: 'complete',
        createTask: true
      }
    ]
  },

  // Scenario 2: Emotional Support Flow
  emotionalSupport: {
    name: 'Emotional Support',
    triggers: ['stressed', 'anxious', 'overwhelmed', 'worried', 'tired', 'exhausted', 'frustrated'],
    conversations: [
      {
        stage: 'initial',
        response: "I hear you. It sounds like you're dealing with a lot right now. Take a deep breath with me. What's the main thing weighing on your mind?",
        nextStage: 'identify'
      },
      {
        stage: 'identify',
        response: "That does sound challenging. Let's break this down into smaller, manageable pieces. What's one small step you could take today?",
        nextStage: 'action'
      },
      {
        stage: 'action',
        response: "That's a great start! Remember, you don't have to tackle everything at once. Would you like me to create a gentle reminder for this?",
        nextStage: 'reminder'
      },
      {
        stage: 'reminder',
        response: "You've got this! I'm here whenever you need to talk things through. How are you feeling now?",
        nextStage: 'complete'
      }
    ]
  },

  // Scenario 3: Brainstorming Flow
  brainstorming: {
    name: 'Brainstorming',
    triggers: ['idea', 'thinking about', 'planning', 'what if', 'considering', 'wondering', 'project'],
    conversations: [
      {
        stage: 'initial',
        response: "That sounds interesting! Tell me more about this idea. What sparked your interest in it?",
        nextStage: 'explore'
      },
      {
        stage: 'explore',
        response: "I love where this is going! What would success look like for this? What's your ideal outcome?",
        nextStage: 'vision'
      },
      {
        stage: 'vision',
        response: "That's a compelling vision! What resources or support would you need to make this happen?",
        nextStage: 'resources'
      },
      {
        stage: 'resources',
        response: "Great thinking! Should we capture these ideas as action items so you don't lose this momentum?",
        nextStage: 'complete',
        createTask: true
      }
    ]
  },

  // Scenario 4: Daily Review Flow
  dailyReview: {
    name: 'Daily Review',
    triggers: ['today', 'accomplished', 'review', 'done', 'completed', 'achieved', 'progress'],
    conversations: [
      {
        stage: 'initial',
        response: "Let's reflect on your day! What's one thing you're proud of accomplishing today?",
        nextStage: 'wins'
      },
      {
        stage: 'wins',
        response: "That's wonderful! Celebrating these wins is important. Was there anything that didn't go as planned?",
        nextStage: 'challenges'
      },
      {
        stage: 'challenges',
        response: "Thanks for sharing that. Every challenge is a learning opportunity. What's one thing you want to focus on tomorrow?",
        nextStage: 'tomorrow'
      },
      {
        stage: 'tomorrow',
        response: "Excellent! You're setting yourself up for success. Would you like me to create a reminder for tomorrow's focus?",
        nextStage: 'complete',
        createTask: true
      }
    ]
  }
};

// Helper function to find matching scenario
export function findScenario(input) {
  const lowerInput = input.toLowerCase();
  
  for (const [key, scenario] of Object.entries(scenarios)) {
    for (const trigger of scenario.triggers) {
      if (lowerInput.includes(trigger)) {
        return key;
      }
    }
  }
  
  return null;
}

// Get response for a specific scenario and stage
export function getScenarioResponse(scenarioKey, stage = 'initial') {
  const scenario = scenarios[scenarioKey];
  if (!scenario) return null;
  
  const conversation = scenario.conversations.find(c => c.stage === stage);
  return conversation || null;
}