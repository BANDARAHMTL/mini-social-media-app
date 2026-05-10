import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Spinner, EmptyState } from '../components/UI';
import api from '../api';

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
    <div className="page-wrapper" style={{ maxWidth: 900, display: 'flex', height: 'calc(100vh - 72px)', padding: '0 16px', gap: 16 }}>
      
      {/* Sidebar: Conversation List */}
      <div className="card" style={{ width: 300, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Messages</div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadingList ? <Spinner /> : conversations.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No active conversations</div>
          ) : (
            conversations.map(c => (
              <div key={c.contact_id} 
                   onClick={() => navigate(`/messages/${c.contact_id}`)}
                   style={{
                     display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
                     background: id === c.contact_id ? 'var(--bg-input)' : 'transparent',
                     borderBottom: '1px solid var(--border)'
                   }}>
                <Avatar username={c.contact_username} src={c.contact_pic} size={40} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.contact_username}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!id ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <EmptyState icon="💬" title="Select a conversation to start messaging" />
          </div>
        ) : (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
               <button onClick={() => navigate(`/profile/${id}`)} className="btn-secondary" style={{ padding: '4px 10px' }}>View Profile</button>
               Chatting
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingChat ? <Spinner /> : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>Say hi! 👋</div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender_id === me.id;
                  return (
                    <div key={m.id} style={{
                      display: 'flex', gap: 8,
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      flexDirection: isMine ? 'row-reverse' : 'row',
                      maxWidth: '75%'
                    }}>
                      <Avatar username={m.sender_username} src={m.sender_pic} size={28} />
                      <div style={{
                        background: isMine ? 'var(--accent)' : 'var(--bg-input)',
                        color: isMine ? '#fff' : 'var(--text)',
                        padding: '8px 14px', borderRadius: 16,
                        borderTopLeftRadius: isMine ? 16 : 4,
                        borderTopRightRadius: isMine ? 4 : 16,
                        fontSize: 14
                      }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                style={{ flex: 1 }} 
              />
              <button type="submit" className="btn-primary" disabled={sending || !newMessage.trim()}>Send</button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}
