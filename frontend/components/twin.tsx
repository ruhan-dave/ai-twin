'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Twin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          session_id: sessionId || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      if (!sessionId) {
        setSessionId(data.session_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
        color: 'white',
        padding: '24px 32px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={32} />
          </div>
          Dave's AI Twin
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#d1fae5',
          margin: '8px 0 0 64px',
          fontWeight: '400'
        }}>
          Your personal AI assistant
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            marginTop: '80px'
          }}>
            <div style={{
              width: '96px',
              height: '96px',
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <Bot size={56} color="white" />
            </div>
            <p style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 12px 0'
            }}>
              Hello! I'm Dave's AI Twin.
            </p>
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              margin: 0
            }}>
              Ask me anything to get started!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {message.role === 'assistant' && (
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <Bot size={28} color="white" />
                </div>
              </div>
            )}

            <div style={{
              maxWidth: '75%',
              padding: '16px 24px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              backgroundColor: message.role === 'user' 
                ? '#334155' 
                : '#f0fdf4',
              color: message.role === 'user' ? 'white' : '#1e293b',
              border: message.role === 'assistant' ? '1px solid #bbf7d0' : 'none'
            }}>
              <p style={{
                margin: 0,
                lineHeight: '1.6',
                fontSize: '16px',
                whiteSpace: 'pre-wrap'
              }}>
                {message.content}
              </p>
              <p style={{
                fontSize: '12px',
                marginTop: '8px',
                color: message.role === 'user' ? '#cbd5e1' : '#64748b',
                margin: '8px 0 0 0'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === 'user' && (
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <User size={28} color="white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <Bot size={28} color="white" />
              </div>
            </div>
            <div style={{
              padding: '16px 24px',
              borderRadius: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s infinite ease-in-out both'
                }} />
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.16s'
                }} />
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.32s'
                }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid #e2e8f0',
        backgroundColor: 'white',
        padding: '24px 32px',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '16px 20px',
              fontSize: '16px',
              backgroundColor: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              outline: 'none',
              color: '#1e293b',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '12px',
              border: 'none',
              cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
              opacity: (!input.trim() || isLoading) ? 0.5 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #047857 0%, #065f46 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseOut={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}