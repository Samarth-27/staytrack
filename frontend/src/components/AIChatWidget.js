import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const AIChatWidget = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI Copilot. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userMessage, sessionId })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        const detail = data.message || 'Request could not be processed';
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `You have encountered an error: ${detail}. Please correct your details and try again.` 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'You have encountered an error: Network connection to server failed. Please verify your connection or correct your request details and try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        className="ai-chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          backgroundColor: 'var(--primary-color, #4361ee)', color: 'white',
          border: 'none', borderRadius: '50%', width: '60px', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 1000,
          transition: 'transform 0.2s'
        }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {isOpen && (
        <div 
          className="ai-chat-window glass-panel"
          style={{
            position: 'fixed', bottom: '100px', right: '24px',
            width: '380px', height: '500px',
            backgroundColor: 'var(--surface-color, #1e1e2d)',
            borderRadius: '16px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            zIndex: 1000, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div className="ai-chat-header" style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={24} color="#4361ee" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>AI Copilot</h3>
          </div>
          
          <div className="ai-chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: '10px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                {msg.role === 'assistant' && <div style={{width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'rgba(67,97,238,0.2)', display:'flex', alignItems:'center', justifyContent:'center'}}><Bot size={16} color="#4361ee"/></div>}
                <div style={{
                  backgroundColor: msg.role === 'user' ? '#4361ee' : 'rgba(255,255,255,0.05)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                  color: '#fff', fontSize: '0.95rem', lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{display:'flex', gap:'10px', alignSelf:'flex-start'}}>
                <div style={{width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'rgba(67,97,238,0.2)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <Loader2 size={16} color="#4361ee" className="spinner" style={{ animation: 'spin 1s linear infinite' }}/>
                </div>
                <div style={{backgroundColor:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'12px', color:'#aaa'}}>Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything..."
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)',
                color: '#fff', outline: 'none'
              }}
            />
            <button type="submit" disabled={isLoading} style={{
              backgroundColor: '#4361ee', color: '#fff', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1
            }}>
              <Send size={18} />
            </button>
          </form>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
