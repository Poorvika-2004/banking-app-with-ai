import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const API_URL = 'https://router.huggingface.co/v1/chat/completions';

const ChatBot = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I am connected via the Hugging Face API. How may I help you today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleInput = (e) => {
        setInputValue(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        const newMessages = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'Qwen/Qwen2.5-72B-Instruct',
                    messages: [
                        { role: 'system', content: 'You are a helpful and clear AI assistant.' },
                        { role: 'user', content: userText }
                    ],
                    max_tokens: 500,
                    temperature: 0.7,
                    top_p: 0.95
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText}. Details: ${errBody}`);
            }

            const data = await response.json();
            let aiResponse = "I couldn't generate a response. Please try again.";

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                aiResponse = data.choices[0].message.content.trim();
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);

        } catch (error) {
            console.error('Error fetching from HF:', error);
            setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Sorry, there was an error connecting to the API. The model might be loading or rate-limited. Please try again in a few moments.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chatbot-overlay">
            <div className="chatbot-header">
                <h3>DeepSeek 7B (Hugging Face Space)</h3>
                <button className="chatbot-close" onClick={onClose} title="Close Chat">×</button>
            </div>

            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <div className="chat-message-content">
                            <div className="chat-avatar">
                                {msg.role === 'user' ? (
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
                                )}
                            </div>
                            <div className="chat-text">
                                {msg.content.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i !== msg.content.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="chat-message ai">
                        <div className="chat-message-content">
                            <div className="chat-avatar">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
                            </div>
                            <div className="chat-text">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-area">
                <div className="input-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="chatbot-input"
                        placeholder="Message DeepSeek..."
                        rows="1"
                        value={inputValue}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <button
                        className="chatbot-send"
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
                <div className="disclaimer">
                    AI can make mistakes. Verify important information.
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
