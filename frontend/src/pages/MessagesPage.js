import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner, EmptyState } from '../components/UI';
import api from '../api';
import './MessagesPage.css';

export default function MessagesPage() {
  const { id } = useParams(); // The user we are chatting with
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Poll intervals
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000); // refresh list every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (id) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // refresh chat every 3s
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const { data } = await api.get('/messages');
      setConversations(data);
      setLoadingList(false);
    } catch {}
  };

  const loadMessages = async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/messages/${id}`);
      setMessages(data);
      setLoadingChat(false);
    } catch {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !id) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${id}`, { content: newMessage });
      setMessages(prev => [...prev, {
        id: data.id, sender_id: me.id, receiver_id: id, content: data.content,
        created_at: new Date().toISOString(), sender_username: me.username, sender_pic: me.profile_pic
      }]);
      setNewMessage('');
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="page-wrapper messages-page">
      
      {/* Sidebar: Conversation List */}
      <div className="card messages-sidebar">
        <div className="messages-sidebar-header">Messages</div>
        <div className="messages-sidebar-list">
          {loadingList ? <Spinner /> : conversations.length === 0 ? (
            <div className="messages-empty-state">No active conversations</div>
          ) : (
            conversations.map(c => (
              <div key={c.contact_id} 
                   onClick={() => navigate(`/messages/${c.contact_id}`)}
                   className={`messages-contact-item ${id === c.contact_id ? 'active' : ''}`}>
                <Avatar username={c.contact_username} src={c.contact_pic} size={40} />
                <div className="messages-contact-name">{c.contact_username}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="card messages-main">
        {!id ? (
          <div className="messages-no-chat">
            <EmptyState icon="💬" title="Select a conversation to start messaging" />
          </div>
        ) : (
          <>
            <div className="messages-chat-header">
               <button onClick={() => navigate(`/profile/${id}`)} className="btn-secondary" style={{ padding: '4px 10px' }}>View Profile</button>
               Chatting
            </div>
            
            <div className="messages-chat-area">
              {loadingChat ? <Spinner /> : messages.length === 0 ? (
                <div className="messages-chat-empty">Say hi! 👋</div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender_id === me.id;
                  return (
                    <div key={m.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                      <Avatar username={m.sender_username} src={m.sender_pic} size={28} />
                      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="messages-form">
              <input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                className="messages-input"
              />
              <button type="submit" className="btn-primary" disabled={sending || !newMessage.trim()}>Send</button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}
