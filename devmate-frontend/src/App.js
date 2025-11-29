import React, { useState, useEffect, useRef } from 'react';

// const API_ROOT = "https://devmate-lxbp.onrender.com";
const API_ROOT = "https://devmate-lxbp.onrender.com";

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
      <svg viewBox="0 0 160 180" width="180" height="180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom: '20px'}}>
        <defs>
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5"/>
            <stop offset="100%" stopColor="#9333EA"/>
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B"/>
            <stop offset="100%" stopColor="#FCD34D"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="80" cy="80" r="66" stroke="url(#mainGradient)" strokeWidth="1.8" opacity="1"/>
        <circle cx="80" cy="80" r="42" stroke="url(#accentGradient)" strokeWidth="2.5" opacity="1">
          <animate attributeName="r" values="42; 60; 42" dur="3.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1; 0; 1" dur="3.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="80" r="9" fill="url(#accentGradient)" filter="url(#glow)">
          <animate attributeName="r" values="9; 11; 9" dur="2s" repeatCount="indefinite"/>
        </circle>
        <g transform="translate(80,80) scale(1.1)">
          <path d="M -28 -22 Q 0 -40 28 -22 L 28 22 Q 0 40 -28 22 Z" 
                stroke="url(#mainGradient)" strokeWidth="5" fill="none" opacity="0.9"/>
          <path d="M -18 20 L -6 -10 L 0 10 L 6 -10 L 18 20" 
                stroke="url(#accentGradient)" strokeWidth="4" fill="none" opacity="0.9"/>
        </g>
        <g transform="translate(80,22) scale(0.85)">
          <path d="M -7 -5 L -12 0 L -7 5 M 7 -5 L 12 0 L 7 5"
                stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke" values="#4F46E5;#6366F1;#4F46E5" dur="2.6s" repeatCount="indefinite"/>
          </path>
        </g>
        <g transform="translate(138,80) scale(0.85)">
          <path d="M -6 -8 H 6 V 8 H -6 M -6 -8 L -10 -6 V 6 H -6"
                stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke" values="#F59E0B;#FBBF24;#F59E0B" dur="2.4s" repeatCount="indefinite"/>
          </path>
        </g>
        <g transform="translate(80,133) scale(0.85)">
          <path d="M -8 -10 H 8 V 10 H -8 Z M -5 -6 H -1 M 1 -6 H 5 M -5 -2 H -1 M 1 -2 H 5 M -3 3 H 3"
                stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke" values="#9333EA;#A855F7;#9333EA" dur="2.2s" repeatCount="indefinite"/>
          </path>
        </g>
        <g transform="translate(29,80) scale(0.85)">
          <circle cx="0" cy="0" r="4" stroke="#10B981" strokeWidth="2" fill="none"/>
          <path d="M 0 -8 V -12 M 0 8 V 12 M -8 0 H -12 M 8 0 H 12 M -6 -6 L -9 -9 M 6 -6 L 9 -9 M -6 6 L -9 9 M 6 6 L 9 9"
                stroke="#10B981" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="stroke" values="#10B981;#34D399;#10B981" dur="3.2s" repeatCount="indefinite"/>
          </path>
        </g>
        <path d="M80 32 L80 58 M110 80 L92 80 M80 122 L80 102 M50 80 L68 80"
              stroke="#cbd5e1" strokeWidth="1.2" opacity="1"/>
      </svg>
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
          <div style={styles.logoContainer}>
            <svg viewBox="0 0 160 180" width="100" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mainGradientSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5"/>
                  <stop offset="100%" stopColor="#9333EA"/>
                </linearGradient>
                <linearGradient id="accentGradientSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B"/>
                  <stop offset="100%" stopColor="#FCD34D"/>
                </linearGradient>
                <filter id="glowSidebar">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle cx="80" cy="80" r="66" stroke="url(#mainGradientSidebar)" strokeWidth="1.8" opacity="1"/>
              <circle cx="80" cy="80" r="42" stroke="url(#accentGradientSidebar)" strokeWidth="2.5" opacity="1">
                <animate attributeName="r" values="42; 60; 42" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1; 0; 1" dur="3.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="80" cy="80" r="9" fill="url(#accentGradientSidebar)" filter="url(#glowSidebar)">
                <animate attributeName="r" values="9; 11; 9" dur="2s" repeatCount="indefinite"/>
              </circle>
              <g transform="translate(80,80) scale(1.1)">
                <path d="M -28 -22 Q 0 -40 28 -22 L 28 22 Q 0 40 -28 22 Z" 
                      stroke="url(#mainGradientSidebar)" strokeWidth="5" fill="none" opacity="0.9"/>
                <path d="M -18 20 L -6 -10 L 0 10 L 6 -10 L 18 20" 
                      stroke="url(#accentGradientSidebar)" strokeWidth="4" fill="none" opacity="0.9"/>
              </g>
              <g transform="translate(80,22) scale(0.85)">
                <path d="M -7 -5 L -12 0 L -7 5 M 7 -5 L 12 0 L 7 5"
                      stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke" values="#4F46E5;#6366F1;#4F46E5" dur="2.6s" repeatCount="indefinite"/>
                </path>
              </g>
              <g transform="translate(138,80) scale(0.85)">
                <path d="M -6 -8 H 6 V 8 H -6 M -6 -8 L -10 -6 V 6 H -6"
                      stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke" values="#F59E0B;#FBBF24;#F59E0B" dur="2.4s" repeatCount="indefinite"/>
                </path>
              </g>
              <g transform="translate(80,133) scale(0.85)">
                <path d="M -8 -10 H 8 V 10 H -8 Z M -5 -6 H -1 M 1 -6 H 5 M -5 -2 H -1 M 1 -2 H 5 M -3 3 H 3"
                      stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke" values="#9333EA;#A855F7;#9333EA" dur="2.2s" repeatCount="indefinite"/>
                </path>
              </g>
              <g transform="translate(29,80) scale(0.85)">
                <circle cx="0" cy="0" r="4" stroke="#10B981" strokeWidth="2" fill="none"/>
                <path d="M 0 -8 V -12 M 0 8 V 12 M -8 0 H -12 M 8 0 H 12 M -6 -6 L -9 -9 M 6 -6 L 9 -9 M -6 6 L -9 9 M 6 6 L 9 9"
                      stroke="#10B981" strokeWidth="2" strokeLinecap="round">
                  <animate attributeName="stroke" values="#10B981;#34D399;#10B981" dur="3.2s" repeatCount="indefinite"/>
                </path>
              </g>
              <path d="M80 32 L80 58 M110 80 L92 80 M80 122 L80 102 M50 80 L68 80"
                    stroke="#cbd5e1" strokeWidth="1.2" opacity="1"/>
            </svg>
            <h2 style={styles.sidebarTitle}>DevMate</h2>
          </div>
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
          <div style={styles.watermarkContainer}>
            <svg viewBox="0 0 160 180" style={styles.watermarkSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mainGradientWatermark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5"/>
                  <stop offset="100%" stopColor="#9333EA"/>
                </linearGradient>
                <linearGradient id="accentGradientWatermark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B"/>
                  <stop offset="100%" stopColor="#FCD34D"/>
                </linearGradient>
                <filter id="glowWatermark">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle cx="80" cy="80" r="66" stroke="url(#mainGradientWatermark)" strokeWidth="1.8" opacity="1"/>
              <circle cx="80" cy="80" r="42" stroke="url(#accentGradientWatermark)" strokeWidth="2.5" opacity="1">
                <animate attributeName="r" values="42; 60; 42" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1; 0; 1" dur="3.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="80" cy="80" r="9" fill="url(#accentGradientWatermark)" filter="url(#glowWatermark)">
                <animate attributeName="r" values="9; 11; 9" dur="2s" repeatCount="indefinite"/>
              </circle>
              <g transform="translate(80,80) scale(1.1)">
                <path d="M -28 -22 Q 0 -40 28 -22 L 28 22 Q 0 40 -28 22 Z" 
                      stroke="url(#mainGradientWatermark)" strokeWidth="5" fill="none" opacity="0.9"/>
                <path d="M -18 20 L -6 -10 L 0 10 L 6 -10 L 18 20" 
                      stroke="url(#accentGradientWatermark)" strokeWidth="4" fill="none" opacity="0.9"/>
              </g>
              <g transform="translate(80,22) scale(0.85)">
                <path d="M -7 -5 L -12 0 L -7 5 M 7 -5 L 12 0 L 7 5"
                      stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke" values="#4F46E5;#6366F1;#4F46E5" dur="2.6s" repeatCount="indefinite"/>
                </path>
              </g>
              <g transform="translate(138,80) scale(0.85)">
                <path d="M -6 -8 H 6 V 8 H -6 M -6 -8 L -10 -6 V 6 H -6"
                      stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke" values="#F59E0B;#FBBF24;#F59E0B" dur="2.4s" repeatCount="indefinite"/>
                </path>
              </g>
              <g transform="translate(80,133) scale(0.85)">
                <path d="M -8 -10 H 8 V 10 H -8 Z M -5 -6 H -1 M 1 -6 H 5 M -5 -2 H -1 M 1 -2 H 5 M -3 3 H 3"
                      stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke" values="#9333EA;#A855F7;#9333EA" dur="2.2s" repeatCount="indefinite"/>
                </path>
              </g>
              <g transform="translate(29,80) scale(0.85)">
                <circle cx="0" cy="0" r="4" stroke="#10B981" strokeWidth="2" fill="none"/>
                <path d="M 0 -8 V -12 M 0 8 V 12 M -8 0 H -12 M 8 0 H 12 M -6 -6 L -9 -9 M 6 -6 L 9 -9 M -6 6 L -9 9 M 6 6 L 9 9"
                      stroke="#10B981" strokeWidth="2" strokeLinecap="round">
                  <animate attributeName="stroke" values="#10B981;#34D399;#10B981" dur="3.2s" repeatCount="indefinite"/>
                </path>
              </g>
              <path d="M80 32 L80 58 M110 80 L92 80 M80 122 L80 102 M50 80 L68 80"
                    stroke="#cbd5e1" strokeWidth="1.2" opacity="1"/>
            </svg>
          </div>
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
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '500px',
    height: '500px',
    opacity: 0.2,
    pointerEvents: 'none',
    zIndex: 0,
  },
  watermarkSvg: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: '100px',
    position: 'relative',
    zIndex: 1,
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    margin: '6px 0',
    maxWidth: '70%',
    lineHeight: '1.6',
    fontSize: '15px',
    position: 'relative',
    zIndex: 1,
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
