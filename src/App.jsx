import { useState, useEffect, useRef } from 'react';
import { Home, Send, ListChecks, Plus, Mic, MicOff, ArrowLeft, Calendar, Zap, Lightbulb, Target, Stethoscope, ChevronRight } from 'lucide-react';
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

  const handleTaskClick = async (taskId) => {
    try {
      await fetch(`${apiUrl}/tasks/${taskId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'completed' })
      });
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
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
          history: messages 
        })
      });
      
      if (!response.ok) throw new Error('Chat API unavailable');
      
      const data = await response.json();
      const assistantMessage = { 
        role: 'assistant', 
        content: data.reply || 'I understand. How can I help you further?' 
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
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeTasks = tasks.filter(t => t.state === 'active');

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
                    62 credits
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
                      onClick={() => handleTaskClick(task.id)}
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
                    <div className="mt-20">
                      <span className="text-4xl text-slate-400 animate-pulse">|</span>
                    </div>
                  </div>
                ) : (
                  <div ref={chatListRef} className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
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