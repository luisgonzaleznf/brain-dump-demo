import { useState, useEffect, useRef } from 'react';
import { Home, Send, ListChecks, Plus, Mic, MicOff, ArrowLeft, Calendar, Zap, Lightbulb, Target, Stethoscope, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'stethoscope'
  });
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showGameplan, setShowGameplan] = useState(false);
  const [credits, setCredits] = useState(62);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const [taskMessages, setTaskMessages] = useState([]);
  const [taskInputText, setTaskInputText] = useState('');
  const recognitionRef = useRef(null);
  const chatListRef = useRef(null);
  const apiUrl = 'http://localhost:3001/api';

  useEffect(() => {
    loadTasks();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  const loadTasks = async () => {
    try {
      const response = await fetch(`${apiUrl}/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const iconMap = {
        'stethoscope': '🩺',
        'calendar': '📅',
        'zap': '⚡',
        'lightbulb': '💡',
        'target': '🎯'
      };
      
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          icon: iconMap[formData.icon],
          status: 'Created',
          state: 'active'
        })
      });
      await response.json();
      await loadTasks();
      setCurrentScreen('home');
      setFormData({ title: '', description: '', icon: 'stethoscope' });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setCurrentScreen('taskDetail');
  };

  const sendTaskMessage = () => {
    if (!taskInputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      role: 'user',
      content: taskInputText.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    
    setTaskMessages(prev => [...prev, newMessage]);
    setTaskInputText('');
    
    // Simulate a response after a short delay
    setTimeout(() => {
      const response = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Got it! I\'ll help you with that.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setTaskMessages(prev => [...prev, response]);
    }, 1000);
  };

  const handleTaskInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTaskMessage();
    }
  };

  const getIconComponent = (iconType) => {
    const icons = {
      '🩺': Stethoscope,
      '📅': Calendar,
      '⚡': Zap,
      '💡': Lightbulb,
      '🎯': Target,
      '🔄': Stethoscope
    };
    const IconComponent = icons[iconType] || Stethoscope;
    return <IconComponent className="h-6 w-6 text-slate-500" />;
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = recognition;
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input isn't supported in this browser.");
      return;
    }
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    const userMessage = { role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);
    
    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: userMessage.content, 
          history: messages,
          sessionId: sessionId 
        })
      });
      
      if (!response.ok) throw new Error('Chat API unavailable');
      
      const data = await response.json();
      
      // Store session ID if provided
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Show task creation notification if task was created
      let messageContent = data.reply || 'I understand. How can I help you further?';
      if (data.taskCreated) {
        // If it's an appointment cancellation, navigate to task detail with gameplan
        if (data.taskType === 'appointment_cancellation' && data.showGameplan) {
          setSelectedTask(data.taskCreated);
          setShowGameplan(true);
          setCurrentScreen('taskDetail');
        } else {
          messageContent += `\n\n✅ Task created: "${data.taskCreated.title}"`;
        }
        // Reload tasks to show the new one
        loadTasks();
      }
      
      const assistantMessage = { 
        role: 'assistant', 
        content: messageContent,
        scenario: data.scenario,
        stage: data.stage
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I heard: "${userMessage.content}". Let me help you organize your thoughts into actionable tasks.`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeTasks = tasks.filter(t => t.state === 'active');

  const renderTaskDetailScreen = () => (
    <motion.div
      key="taskDetail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-gray-50 relative"
    >
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-sm">Feedback</span>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{selectedTask?.title || 'Test'}</h2>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-6 py-3 border-b border-gray-200">
        <div className="flex gap-8">
          <button className="pb-2 border-b-2 border-black font-semibold">Chat</button>
          <button className="pb-2 text-gray-400">Summary</button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 pb-24 overflow-y-auto">
        <div className="text-gray-400 text-sm mb-4">Today</div>
        
        {/* Early Access Message */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
          <div className="flex items-start gap-2">
            <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">Early Access:</span> We're excited to introduce our new tech! AI gets the ball rolling, so a human can jump in to execute. Have feedback? <a href="#" className="text-blue-600 underline">Share it here</a>, or email{' '}
                <a href="mailto:feedback@getduckbill.com" className="text-blue-600 underline">feedback@getduckbill.com</a>.
              </p>
              <p className="text-xs text-gray-400 mt-1">at 04:05 pm</p>
            </div>
          </div>
        </div>

        {/* Gameplan Button as separate bubble */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <button
            onClick={() => setShowGameplan(true)}
            className={`w-full px-6 py-3 rounded-xl font-semibold transition-all text-center ${
              selectedPlan === 'urgent' 
                ? 'bg-purple-500 text-white' 
                : selectedPlan === 'flexible'
                ? 'bg-sky-100 text-sky-900'
                : selectedPlan === 'email'
                ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                : 'bg-yellow-300 text-gray-900 hover:bg-yellow-400'
            }`}
          >
            {selectedPlan 
              ? `Gameplan: ${
                  selectedPlan === 'urgent' ? 'Call - Urgent' :
                  selectedPlan === 'flexible' ? 'Call - Flexible' :
                  'Email'
                }`
              : 'Gameplan'
            }
          </button>
        </div>

        {/* Chat Messages */}
        {taskMessages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Gameplan Popup */}
      <AnimatePresence>
        {showGameplan && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { velocity, offset }) => {
              if (offset.y > 100 || velocity.y > 500) {
                setShowGameplan(false);
              }
            }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 pb-32"
            style={{ maxHeight: '75vh' }}
          >
            <button 
              onClick={() => setShowGameplan(false)}
              className="w-full py-2 mb-2 cursor-grab active:cursor-grabbing"
            >
              <div className="w-12 h-1.5 bg-gray-400 rounded-full mx-auto hover:bg-gray-500 transition-colors"></div>
            </button>
            
            <h3 className="text-2xl font-bold mb-2">Gameplan</h3>
            <p className="text-gray-600 mb-4">Choose how you'd like to handle this:</p>
            
            <div className="space-y-3">
              {/* Call Urgent Option */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (credits >= 6) {
                      setCredits(credits - 6);
                      setSelectedPlan('urgent');
                      setShowGameplan(false);
                      // Handle urgent call action
                    }
                  }}
                  className="w-full p-4 rounded-2xl bg-purple-500 text-white flex items-center justify-between hover:bg-purple-600 transition-colors"
                >
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg">Call - Urgent</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTooltip(showTooltip === 'urgent' ? null : 'urgent');
                        }}
                        className="p-1 hover:bg-purple-400 rounded-full transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm opacity-90">Complete within 2 hours</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">6 credits</div>
                  </div>
                </button>
                {showTooltip === 'urgent' && (
                  <div className="absolute left-0 right-0 -top-20 mx-2 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                    <div className="relative">
                      We'll call up to 7 times and handle up to 2 follow-up calls if we need additional info from you.
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Flexible Option */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (credits >= 2) {
                      setCredits(credits - 2);
                      setSelectedPlan('flexible');
                      setShowGameplan(false);
                      // Handle flexible call action
                    }
                  }}
                  className="w-full p-4 rounded-2xl bg-sky-100 text-sky-900 flex items-center justify-between hover:bg-sky-200 transition-colors"
                >
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg">Call - Flexible</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTooltip(showTooltip === 'flexible' ? null : 'flexible');
                        }}
                        className="p-1 hover:bg-sky-200 rounded-full transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm">Complete within 3 working days</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">2 credits</div>
                  </div>
                </button>
                {showTooltip === 'flexible' && (
                  <div className="absolute left-0 right-0 -top-20 mx-2 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                    <div className="relative">
                      We'll make multiple call attempts over 3 days and handle follow-ups if needed to ensure completion.
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Option */}
              <div className="relative">
                <button
                  onClick={() => {
                    setSelectedPlan('email');
                    setShowGameplan(false);
                    // Handle email action
                  }}
                  className="w-full p-4 rounded-2xl bg-yellow-50 text-yellow-900 flex items-center justify-between hover:bg-yellow-100 transition-colors"
                >
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg">Email</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTooltip(showTooltip === 'email' ? null : 'email');
                        }}
                        className="p-1 hover:bg-yellow-100 rounded-full transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm">Send automated email</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600">Free</div>
                  </div>
                </button>
                {showTooltip === 'email' && (
                  <div className="absolute left-0 right-0 -top-20 mx-2 p-3 bg-gray-900 text-white text-sm rounded-lg z-10">
                    <div className="relative">
                      Our trusted AI assistant Billy will handle this entire email thread for you automatically.
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area - Fixed position at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 z-10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={taskInputText}
            onChange={(e) => setTaskInputText(e.target.value)}
            onKeyDown={handleTaskInputKeyDown}
            placeholder="What is it?"
            className="flex-1 px-4 py-3 rounded-full bg-gray-100 outline-none text-gray-700 placeholder-gray-500"
          />
          <button 
            onClick={sendTaskMessage}
            className="p-2.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full bg-neutral-100 p-6 md:grid md:place-items-center">
      <div className="relative mx-auto h-[844px] w-[390px] overflow-hidden rounded-[2.2rem] border border-neutral-200 bg-white shadow-2xl">
        <AnimatePresence mode="wait">
          {currentScreen === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-[32px] font-extrabold leading-none tracking-tight text-slate-900 lowercase">duckbill</div>
                  <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner">
                    {credits} credits
                  </button>
                </div>

                <div className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                  Active
                </div>

                <div className="mt-3 space-y-3">
                  {activeTasks.map((task, index) => (
                    <motion.button
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.1 }}
                      onClick={() => handleTaskClick(task)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md focus:outline-none"
                    >
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100">
                        {getIconComponent(task.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold tracking-tight text-slate-900">
                          {task.title}
                        </div>
                        <div className="mt-0.5 text-sm text-slate-500">{task.status}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                onClick={() => setCurrentScreen('mind')}
                className="absolute bottom-32 right-6 grid h-16 w-16 place-items-center rounded-full bg-black text-white shadow-xl"
                aria-label="Add"
              >
                <Plus className="h-8 w-8" />
              </motion.button>
            </motion.div>
          ) : currentScreen === 'taskDetail' ? (
            renderTaskDetailScreen()
          ) : currentScreen === 'mind' ? (
            <motion.div
              key="mind"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentScreen('home')}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div className="text-xl font-bold text-slate-900">Brain Dump</div>
                  <div className="w-10"></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center pt-20">
                    <h1 className="text-5xl font-extrabold text-slate-800 text-center">What's on your mind?</h1>
                    <div className="mt-16 px-6 relative w-full max-w-md">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder=""
                        autoFocus
                        className="text-2xl font-semibold text-slate-800 bg-transparent outline-none border-none appearance-none resize-none w-full text-center overflow-hidden"
                        style={{ 
                          caretColor: 'transparent',
                          color: inputText ? '#1e293b' : 'transparent',
                          minHeight: '200px',
                          lineHeight: '1.3',
                          overflow: 'hidden'
                        }}
                        rows="5"
                      />
                      {!inputText && (
                        <span className="text-2xl font-light text-slate-400 animate-pulse absolute top-0 left-1/2 -translate-x-1/2">|</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div ref={chatListRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-base ${
                              msg.role === 'user'
                                ? 'bg-black text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isSending && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-3">
                            <span className="inline-block animate-pulse">thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 pt-3 mt-auto">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 rounded-full bg-slate-100 text-base outline-none"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!inputText.trim() || isSending}
                          className="p-2 rounded-full bg-black text-white disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end px-6 py-6 pb-32">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-5 rounded-full transition-all transform ${
                    isRecording
                      ? 'bg-red-500 text-white scale-110'
                      : 'bg-yellow-200 text-black hover:bg-yellow-300 hover:scale-105 border-2 border-black'
                  }`}
                >
                  {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="addTask"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentScreen('home')}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div className="text-xl font-bold text-slate-900">New Task</div>
                  <div className="w-10"></div>
                </div>

                <form onSubmit={createTask} className="mt-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-400 focus:outline-none resize-none"
                      rows="4"
                      placeholder="Enter description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Icon
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { value: 'stethoscope', icon: Stethoscope },
                        { value: 'calendar', icon: Calendar },
                        { value: 'zap', icon: Zap },
                        { value: 'lightbulb', icon: Lightbulb },
                        { value: 'target', icon: Target }
                      ].map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData({...formData, icon: value})}
                          className={`p-3 rounded-xl border ${
                            formData.icon === value
                              ? 'border-slate-400 bg-slate-100'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-6 w-6 text-slate-600 mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-black text-white font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Create Task
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-6 pb-8 pt-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-slate-100 p-3">
              <Home className="h-6 w-6 text-slate-900" />
            </div>

            <button 
              className="p-3"
              onClick={() => setCurrentScreen('mind')}
            >
              <Send className="h-6 w-6 text-slate-500" />
            </button>

            <button 
              className="p-3"
              onClick={() => setCurrentScreen('addTask')}
            >
              <ListChecks className="h-6 w-6 text-slate-500" />
            </button>

            <button className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-700">
              LG
            </button>
          </div>

          <div className="pointer-events-none mx-auto mt-4 h-1.5 w-28 rounded-full bg-slate-300" />
        </nav>
      </div>
    </div>
  );
}