import React, { useState, useEffect, useRef } from 'react';

// const API_ROOT = "https://devmate-lxbp.onrender.com";
const API_ROOT = "http://127.0.0.1:8000";

// Auth Component
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginInfo, setLoginInfo] = useState('');
  const [signupInfo, setSignupInfo] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginInfo('');

    try {
      const res = await fetch(`${API_ROOT}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem("dev_token", data.access_token);
        localStorage.setItem("dev_user", data.username);
        onLogin(data.access_token, data.username);
      } else {
        const errorMsg = typeof data.detail === 'string' 
          ? data.detail 
          : Array.isArray(data.detail) 
            ? data.detail.map(err => err.msg || JSON.stringify(err)).join(', ')
            : "Login failed";
        setLoginInfo(errorMsg);
      }
    } catch (error) {
      setLoginInfo("Server error");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupInfo('');

    try {
      const res = await fetch(`${API_ROOT}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: signupUsername, 
          email: signupEmail,
          password: signupPassword 
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSignupInfo("Signup successful! Please Login.");
      } else {
        const errorMsg = typeof data.detail === 'string' 
          ? data.detail 
          : Array.isArray(data.detail) 
            ? data.detail.map(err => err.msg || JSON.stringify(err)).join(', ')
            : "Signup failed";
        setSignupInfo(errorMsg);
      }
    } catch (error) {
      setSignupInfo("Server error");
    }
  };

  return (
    <div style={styles.authContainer}>
      <h1 style={styles.authTitle}>DevMate Auth</h1>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tabButton, ...(mode === 'login' ? styles.tabButtonActive : {}) }}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          style={{ ...styles.tabButton, ...(mode === 'signup' ? styles.tabButtonActive : {}) }}
          onClick={() => setMode('signup')}
        >
          Signup
        </button>
      </div>

      {mode === 'login' ? (
        <div style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
            style={styles.input}
            required
          />
          <button onClick={handleLogin} style={styles.btn}>Login</button>
          {loginInfo && <p style={{ ...styles.info, color: 'red' }}>{loginInfo}</p>}
        </div>
      ) : (
        <div style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={signupUsername}
            onChange={(e) => setSignupUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSignup(e)}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSignup(e)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSignup(e)}
            style={styles.input}
            required
          />
          <button onClick={handleSignup} style={styles.btn}>Signup</button>
          {signupInfo && (
            <p style={{ ...styles.info, color: signupInfo.includes('successful') ? 'green' : 'red' }}>
              {signupInfo}
            </p>
          )}
        </div>
      )}

      <p style={styles.note}>Your session token will be securely saved in your browser.</p>
    </div>
  );
};

// Chat Component
const ChatPage = ({ token, username, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_ROOT}/conversations`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMessage = (text) => {
    text = text.replace(/(\d+)\.\s+(\*\*[^*]+\*\*:?)/g, '\n$1. $2');
    text = text.replace(/(\d+\.\s+[^\n]+)/g, '\n$1');
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  };

  const Message = ({ text, sender }) => {
    const linkMatch = text.match(/(https?:\/\/[^\s)]+\.supabase\.co[^\s)]+)/i);
    const [downloading, setDownloading] = useState(false);

    if (linkMatch) {
      const url = linkMatch[1];
      const filename = url.split("/").pop().split("?")[0];
      let cleanText = text.replace(/\[Download[^\]]*\]\([^)]+\)/g, '').replace(url, '').trim();

      if (sender === 'ai') {
        cleanText = formatMessage(cleanText);
      }

      const handleDownload = async () => {
        setDownloading(true);
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error("Download failed");
          const blob = await r.blob();
          const fileUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(fileUrl);
        } catch (err) {
          console.error(err);
          alert("Error downloading file");
        }
        setDownloading(false);
      };

      return (
        <div style={{ ...styles.message, ...(sender === 'user' ? styles.userMessage : styles.aiMessage) }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{cleanText}</div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={styles.downloadBtn}
          >
            {downloading ? 'Downloading...' : `📥 Download ${filename}`}
          </button>
        </div>
      );
    }

    const formattedText = sender === 'ai' ? formatMessage(text) : text;

    return (
      <div style={{ ...styles.message, ...(sender === 'user' ? styles.userMessage : styles.aiMessage) }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>{formattedText}</div>
      </div>
    );
  };

  const sendMessage = async () => {
    const val = userInput.trim();
    if (!val) return;

    const userMsg = { role: 'user', content: val };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      const payload = {
        messages: newMessages
      };
      
      // If we have a current conversation, include its ID
      if (currentConversationId) {
        payload.conversation_id = currentConversationId;
      }

      const res = await fetch(`${API_ROOT}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        // Update messages with the full response from backend
        setMessages(data.messages || []);
        
        // Set the conversation ID if it's a new conversation
        if (data.conversation_id && !currentConversationId) {
          setCurrentConversationId(data.conversation_id);
        }
        
        // Refresh conversation history
        fetchConversations();
      } else {
        const errorMsg = typeof data.detail === 'string' 
          ? data.detail 
          : Array.isArray(data.detail) 
            ? data.detail.map(err => err.msg || JSON.stringify(err)).join(', ')
            : "Error from server";
        const errorMsgObj = { role: 'assistant', content: `Error: ${errorMsg}` };
        setMessages([...newMessages, errorMsgObj]);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = { role: 'assistant', content: "Error connecting to server" };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = (conv) => {
    setMessages(conv.messages || []);
    setCurrentConversationId(conv._id);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConversationPreview = (conv) => {
    const msgs = conv.messages || [];
    if (msgs.length === 0) return { userMsg: 'Empty conversation', aiMsg: '' };
    
    const userMsg = msgs.find(m => m.role === 'user')?.content || 'No user message';
    const aiMsg = msgs.find(m => m.role === 'assistant')?.content || 'No AI response';
    
    return {
      userMsg: userMsg.length > 40 ? userMsg.substring(0, 40) + '...' : userMsg,
      aiMsg: aiMsg.length > 40 ? aiMsg.substring(0, 40) + '...' : aiMsg
    };
  };

  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <div style={{...styles.sidebar, ...(sidebarOpen ? {} : styles.sidebarClosed)}}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>DevMate</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        {sidebarOpen && (
          <>
            <button onClick={startNewChat} style={styles.newChatBtn}>
              ➕ New Chat
            </button>
            
            <div style={styles.conversationsList}>
              <h3 style={styles.conversationsHeader}>History</h3>
              {conversations.length === 0 ? (
                <p style={styles.noConversations}>No conversations yet</p>
              ) : (
                conversations.map((conv) => {
                  const preview = getConversationPreview(conv);
                  const userMsgCount = conv.messages?.filter(m => m.role === 'user').length || 0;
                  const isActive = currentConversationId === conv._id;
                  
                  return (
                    <div 
                      key={conv._id} 
                      style={{
                        ...styles.conversationCard,
                        ...(isActive ? styles.conversationCardActive : {})
                      }}
                      onClick={() => loadConversation(conv)}
                    >
                      <div style={styles.conversationDate}>
                        {new Date(conv.updated_at || conv.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div style={styles.conversationContent}>
                        <div style={styles.conversationUser}>
                          <span style={styles.roleLabel}>You:</span> {preview.userMsg}
                        </div>
                        <div style={styles.conversationAi}>
                          <span style={styles.roleLabel}>AI:</span> {preview.aiMsg}
                        </div>
                      </div>
                      <div style={styles.conversationMeta}>
                        {conv.messages?.length || 0} msgs • {userMsgCount} from you
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainContent}>
        <div style={styles.topBar}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={styles.openSidebarBtn}>
              ☰
            </button>
          )}
          <div style={styles.userInfo}>
            <span style={styles.username}>{username}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>

        <div ref={chatRef} style={styles.chatContainer}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <h2>Welcome to DevMate! 👋</h2>
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <Message key={idx} text={msg.content} sender={msg.role === 'user' ? 'user' : 'ai'} />
            ))
          )}
          {loading && (
            <div style={styles.loadingIndicator}>AI is thinking...</div>
          )}
        </div>

        <div style={styles.inputRow}>
          <input
            type="text"
            placeholder="Type your message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={styles.textInput}
            disabled={loading}
          />
          <button onClick={sendMessage} style={styles.sendBtn} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('dev_token');
    const savedUser = localStorage.getItem('dev_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsername(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('dev_token');
    localStorage.removeItem('dev_user');
    setToken('');
    setUsername('');
    setIsAuthenticated(false);
  };

  return (
    <div style={styles.body}>
      {isAuthenticated ? (
        <ChatPage token={token} username={username} onLogout={handleLogout} />
      ) : (
        <AuthPage onLogin={handleLogin} />
      )}
    </div>
  );
}

// Styles
const styles = {
  body: {
    fontFamily: 'Inter, Arial, sans-serif',
    margin: 0,
    background: '#f7fafc',
    width: '100%',
    minHeight: '100vh',
  },
  appContainer: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: '280px',
    background: '#202123',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    borderRight: '1px solid #4d4d4f',
  },
  sidebarClosed: {
    width: '0px',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid #4d4d4f',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  toggleBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px',
  },
  newChatBtn: {
    margin: '16px',
    padding: '12px',
    background: '#343541',
    color: '#fff',
    border: '1px solid #565869',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
  conversationsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 12px',
  },
  conversationsHeader: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#8e8ea0',
    textTransform: 'uppercase',
    padding: '8px 4px',
    margin: '8px 0',
  },
  noConversations: {
    color: '#8e8ea0',
    fontSize: '13px',
    padding: '8px',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  conversationCard: {
    background: '#343541',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  conversationCardActive: {
    background: '#40414f',
    border: '1px solid #565869',
  },
  conversationDate: {
    fontSize: '11px',
    color: '#8e8ea0',
    marginBottom: '6px',
  },
  conversationContent: {
    marginBottom: '6px',
  },
  conversationUser: {
    fontSize: '13px',
    color: '#ececf1',
    marginBottom: '4px',
    lineHeight: '1.4',
  },
  conversationAi: {
    fontSize: '12px',
    color: '#b4b4b4',
    lineHeight: '1.4',
  },
  roleLabel: {
    fontWeight: '600',
    color: '#19c37d',
  },
  conversationMeta: {
    fontSize: '11px',
    color: '#8e8ea0',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
  },
  topBar: {
    padding: '12px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fff',
  },
  openSidebarBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#202123',
    padding: '4px 8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: 'auto',
  },
  username: {
    fontWeight: '600',
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: '#0366d6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  chatContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
  },
  emptyState: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: '100px',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    margin: '6px 0',
    maxWidth: '70%',
    lineHeight: '1.6',
    fontSize: '15px',
  },
  userMessage: {
    background: '#0366d6',
    color: '#fff',
    marginLeft: 'auto',
  },
  aiMessage: {
    background: '#f3f4f6',
    color: '#111',
    marginRight: 'auto',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
  },
  textInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
  },
  sendBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#0366d6',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
  },
  downloadBtn: {
    marginTop: '8px',
    padding: '8px 16px',
    background: '#007bff',
    borderRadius: '6px',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
  },
  loadingIndicator: {
    padding: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  authContainer: {
    width: '100%',
    minHeight: '90vh',
    padding: '40px',
    background: '#ffffff',
    borderRadius: '0',
    boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  authTitle: {
    margin: '0 0 20px',
    fontSize: '32px',
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
  },
  tabButton: {
    padding: '10px 20px',
    background: '#e5e7eb',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  tabButtonActive: {
    background: '#0366d6',
    color: '#fff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '360px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
  },
  btn: {
    padding: '12px',
    background: '#0366d6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  info: {
    fontSize: '14px',
    marginTop: '5px',
  },
  note: {
    marginTop: '15px',
    fontSize: '14px',
    color: '#666',
  },
};
