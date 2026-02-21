import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const HF_TOKEN = 'YOUR_HUGGINGFACE_TOKEN_HERE'; // Replace with your actual token
const API_URL = 'https://router.huggingface.co/v1/chat/completions';

const ChatBot = ({ onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I am connected via the Hugging Face API. How may I help you today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        const newMessages = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

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
                        { role: 'system', content: 'You are a helpful and clear AI assistant for a secure internet banking app.' },
                        { role: 'user', content: userText }
                    ],
                    max_tokens: 500,
                    temperature: 0.7,
                    top_p: 0.95
                })
            });

            if (!response.ok) {
                throw new Error('API Error');
            }

            const data = await response.json();
            let aiResponse = "I couldn't generate a response. Please try again.";

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                aiResponse = data.choices[0].message.content.trim();
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);

        } catch (error) {
            console.error('Error fetching from HF:', error);
            setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Sorry, there was an error connecting to the API. Please try again.' }]);
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
                <h3>🤖 DeepSeek AI Help</h3>
                <button className="chatbot-close" onClick={onClose}>&times;</button>
            </div>

            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <div className="chat-avatar">
                            {msg.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="chat-bubble">
                            {msg.content.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i !== msg.content.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="chat-message ai">
                        <div className="chat-avatar">🤖</div>
                        <div className="chat-bubble">
                            <div className="typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input-area">
                <input
                    type="text"
                    className="chatbot-input"
                    placeholder="Ask about your account..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <button
                    className="chatbot-send"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                >
                    ➔
                </button>
            </div>
        </div>
    );
};

export default ChatBot;
