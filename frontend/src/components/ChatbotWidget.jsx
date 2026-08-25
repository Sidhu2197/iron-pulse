import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './ChatbotWidget.css';
import { Bot, X, Send, Sparkles, Minimize2, GripHorizontal } from 'lucide-react';

const QUICK_PROMPTS = [
    'Good morning!',
    'How do I track workouts?',
    'What is Recovery AI?',
    'How is BMI calculated?',
];

const API_URL = 'https://hugging-face-fine-tuned-inference.vercel.app/chat';
const API_TIMEOUT = 60000; // 1 minute timeout

async function getBotResponse(userText, conversationHistory) {
    try {
        // Convert conversation history to API format
        const history = conversationHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userText,
                history: history
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.reply || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error) {
        console.error('Chatbot API Error:', error);
        
        if (error.name === 'AbortError') {
            return "⏱️ The response took too long. The free tier API might be experiencing high traffic. Please try again in a moment.";
        }
        
        // Fallback to rule-based responses on API failure
        const text = userText.toLowerCase().trim();
        if (text.includes('good morning') || text.includes('morning')) {
            return "Good morning! ☀️ Ready to crush your workout goals today? Let me know if you need help logging workouts, planning meals, or calculating recovery!";
        }
        if (text.includes('good afternoon') || text.includes('afternoon')) {
            return "Good afternoon! 🌤️ Hope your day is going strong! Remember to stay hydrated and hit your daily macro targets.";
        }
        if (text.includes('good evening') || text.includes('evening')) {
            return "Good evening! 🌆 Great time to review your daily dashboard stats or log your evening workout!";
        }
        if (text.includes('good night') || text.includes('night') || text.includes('sleep')) {
            return "Good night! 🌙 Rest well and recharge your muscles! Quality sleep is vital for optimal recovery and readiness.";
        }
        if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('welcome')) {
            return "Hello there! 👋 Welcome to IronPulse. I am your AI assistant here to guide you with workouts, nutrition, recovery, and fitness stats.";
        }
        if (text.includes('workout') || text.includes('exercise') || text.includes('plan')) {
            return "🏋️ You can generate tailored workout plans or log daily exercises in the Workout section!";
        }
        if (text.includes('food') || text.includes('meal') || text.includes('diet') || text.includes('macro')) {
            return "🥗 Visit the Food Plan page to calculate your target macronutrients and generate custom meal recommendations.";
        }
        if (text.includes('recovery') || text.includes('soreness') || text.includes('readiness')) {
            return "⚡ Check out Recovery AI! Enter your sleep, heart rate, and soreness levels to calculate your daily readiness index.";
        }
        if (text.includes('bmi')) {
            return "📊 Use our 2-panel BMI Calculator to determine your Body Mass Index and view tailored advice.";
        }

        return "� I'm having trouble connecting to the AI service. Please check your connection and try again.";
    }
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: "Hello! 👋 Welcome to IronPulse AI Assistant. How can I help with your fitness, nutrition, or recovery today?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const widgetRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    // Close on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (widgetRef.current && !widgetRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSendMessage = async (textToSend) => {
        const text = textToSend || input;
        if (!text.trim()) return;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInput('');
        setIsTyping(true);

        // Get conversation history excluding the current user message
        const conversationHistory = messages;

        try {
            const botReplyText = await getBotResponse(userMsg.text, conversationHistory);
            const botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: botReplyText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: "❌ Something went wrong. Please try again.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSendMessage();
    };

    return (
        <div className="chatbot-widget-container" ref={widgetRef}>
            {/* Expandable Draggable Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-window"
                        drag
                        dragMomentum={false}
                        dragElastic={0.05}
                        initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                        className="chatbot-window glass-card draggable-window"
                    >
                        {/* Header (Drag Handle) */}
                        <div className="chatbot-header drag-handle" title="Drag to move widget anywhere">
                            <div className="header-info">
                                <div className="bot-avatar">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="bot-name">
                                        IronPulse AI Assistant
                                        <GripHorizontal size={14} className="drag-grip-icon" />
                                    </h3>
                                    <span className="bot-status"><span className="status-dot" /> Online</span>
                                </div>
                            </div>

                            <div className="header-actions">
                                <button
                                    className="icon-btn"
                                    onClick={() => setIsOpen(false)}
                                    title="Minimize"
                                >
                                    <Minimize2 size={16} />
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={() => setIsOpen(false)}
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div className="chatbot-body">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
                                >
                                    {msg.sender === 'bot' && (
                                        <div className="bubble-avatar">
                                            <Sparkles size={14} />
                                        </div>
                                    )}
                                    <div className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                                        <div className="bubble-content">{msg.text}</div>
                                        <div className="bubble-time">{msg.time}</div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="chat-bubble-row bot-row">
                                    <div className="bubble-avatar">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="chat-bubble bot-bubble">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        <div className="quick-prompts">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    className="quick-prompt-btn"
                                    onClick={() => handleSendMessage(prompt)}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <form className="chatbot-input-area" onSubmit={handleFormSubmit}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="chat-input"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                className="send-btn"
                                disabled={isTyping || !input.trim()}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="chatbot-toggle-btn glass-card"
                    title="Open AI Assistant"
                >
                    <Bot size={24} />
                </motion.button>
            )}
        </div>
    );
}
