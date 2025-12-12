import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

// const API_ROOT = "http://localhost:8000";
const API_ROOT = https://devmate-lxbp.onrender.com

const Logo = ({ width = 100, height = 100, gradientId = "" }) => (
  <svg viewBox="0 0 160 180" width={width} height={height} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`mainGradient${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5"/>
        <stop offset="100%" stopColor="#9333EA"/>
      </linearGradient>
      <linearGradient id={`accentGradient${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#FCD34D"/>
      </linearGradient>
      <filter id={`glow${gradientId}`}>
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="80" cy="80" r="66" stroke={`url(#mainGradient${gradientId})`} strokeWidth="1.8" opacity="1"/>
    <circle cx="80" cy="80" r="42" stroke={`url(#accentGradient${gradientId})`} strokeWidth="2.5" opacity="1">
      <animate attributeName="r" values="42; 60; 42" dur="3.8s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1; 0; 1" dur="3.8s" repeatCount="indefinite" />
    </circle>
    <circle cx="80" cy="80" r="9" fill={`url(#accentGradient${gradientId})`} filter={`url(#glow${gradientId})`}>
      <animate attributeName="r" values="9; 11; 9" dur="2s" repeatCount="indefinite"/>
    </circle>
    <g transform="translate(80,80) scale(1.1)">
      <path d="M -28 -22 Q 0 -40 28 -22 L 28 22 Q 0 40 -28 22 Z" 
            stroke={`url(#mainGradient${gradientId})`} strokeWidth="5" fill="none" opacity="0.9"/>
      <path d="M -18 20 L -6 -10 L 0 10 L 6 -10 L 18 20" 
            stroke={`url(#accentGradient${gradientId})`} strokeWidth="4" fill="none" opacity="0.9"/>
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
);

const CodeBlock = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeElement = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === 'code'
  );
  const className = codeElement?.props?.className || '';
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  let codeContent = '';
  if (codeElement) {
    const children = codeElement.props.children;
    codeContent = typeof children === 'string' ? children : React.Children.toArray(children).join('');
  }
  const handleCopy = async () => {
    if (!codeContent) return;
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        {language && <span className="code-language">{language}</span>}
        <button onClick={handleCopy} className="copy-code-btn" title="Copy code">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      {language ? (
        <SyntaxHighlighter language={language} style={oneLight} customStyle={{ margin: 0, borderRadius: 0, padding: '12px 16px', background: '#ffffff', fontSize: '14px', lineHeight: '1.5', color: '#383a42' }} PreTag="div">
          {codeContent}
        </SyntaxHighlighter>
      ) : (
        <pre {...props} style={{ margin: 0, borderRadius: 0, padding: '12px 16px', background: '#ffffff', color: '#000000' }}>{children}</pre>
      )}
    </div>
  );
};

const Message = ({ text, sender }) => {
  const [downloading, setDownloading] = useState(false);
  const linkMatch = text.match(/(https?:\/\/[^\s)]+\.supabase\.co[^\s)]+)/i);
  if (linkMatch) {
    const url = linkMatch[1];
    const filename = url.split("/").pop().split("?")[0];
    let cleanText = text.replace(/\[Download[^\]]*\]\([^)]+\)/g, '').replace(url, '').trim();
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
      <div className={`message ${sender === 'user' ? 'user-message' : 'ai-message'}`}>
        <div className="message-text">
          {sender === 'ai' ? (
            <ReactMarkdown components={{ pre: ({ children, ...props }) => {
              const codeChild = React.Children.toArray(children).find(child => React.isValidElement(child) && child.type === 'code');
              if (codeChild && codeChild.props.className) return <CodeBlock {...props}>{children}</CodeBlock>;
              return <pre {...props}>{children}</pre>;
            }}}>{cleanText}</ReactMarkdown>
          ) : cleanText}
        </div>
        <button onClick={handleDownload} disabled={downloading} className="download-btn">
          {downloading ? 'Downloading...' : `📥 Download ${filename}`}
        </button>
      </div>
    );
  }
  return (
    <div className={`message ${sender === 'user' ? 'user-message' : 'ai-message'}`}>
      <div className="message-text">
        {sender === 'ai' ? (
          <ReactMarkdown components={{ pre: ({ children, ...props }) => {
            const codeChild = React.Children.toArray(children).find(child => React.isValidElement(child) && child.type === 'code');
            if (codeChild && codeChild.props.className) return <CodeBlock {...props}>{children}</CodeBlock>;
            return <pre {...props}>{children}</pre>;
          }}}>{text}</ReactMarkdown>
        ) : text}
      </div>
    </div>
  );
};

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
        const errorMsg = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail.map(err => err.msg || JSON.stringify(err)).join(', ') : "Login failed";
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
        body: JSON.stringify({ username: signupUsername, email: signupEmail, password: signupPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSignupInfo("Signup successful! Please Login.");
      } else {
        const errorMsg = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail.map(err => err.msg || JSON.stringify(err)).join(', ') : "Signup failed";
        setSignupInfo(errorMsg);
      }
    } catch (error) {
      setSignupInfo("Server error");
    }
  };

  return (
    <div className="auth-container">
      <Logo width={180} height={180} gradientId="Auth" />
      <h1 className="auth-title">DevMate Auth</h1>
      <div className="auth-tabs">
        <button className={`tab-button ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Login</button>
        <button className={`tab-button ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Signup</button>
      </div>
      {mode === 'login' ? (
        <div className="auth-form">
          <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)} className="auth-input" required />
          <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)} className="auth-input" required />
          <button onClick={handleLogin} className="auth-btn">Login</button>
          {loginInfo && <p className="auth-info error">{loginInfo}</p>}
        </div>
      ) : (
        <div className="auth-form">
          <input type="text" placeholder="Username" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSignup(e)} className="auth-input" required />
          <input type="email" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSignup(e)} className="auth-input" required />
          <input type="password" placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSignup(e)} className="auth-input" required />
          <button onClick={handleSignup} className="auth-btn">Signup</button>
          {signupInfo && <p className={`auth-info ${signupInfo.includes('successful') ? 'success' : 'error'}`}>{signupInfo}</p>}
        </div>
      )}
      <p className="auth-note">Your session token will be securely saved in your browser.</p>
    </div>
  );
};

const ChatPage = ({ token, username, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      setIsRecording(true);
  
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
  
      // Connect WS
      wsRef.current = new WebSocket(`ws://localhost:8000/voice/ws?token=${token}`);
  
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
  
        if (data.type === "transcript") {
          setMessages(prev => [...prev, { role: "user", content: data.text }]);
        }
  
        if (data.type === "assistant_text") {
          setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
        }
  
        if (data.type === "assistant_audio") {
          try {
            const audioBase64 = data.audio;
            const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBytes], { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
        
            const audio = new Audio(audioUrl);
            audio.play().catch(err => console.error("Audio play error:", err));
        
          } catch (err) {
            console.error("Failed to play audio:", err);
          }
        }
        
      };
  
      // Handle RECONNECT state
      wsRef.current.onopen = () => {
        console.log("Voice WebSocket connected.");
      };
  
      // Send audio every 200ms
      // mediaRecorderRef.current.ondataavailable = (event) => {
      //   if (event.data && event.data.size > 0) {
      //     event.data.arrayBuffer().then((buffer) => {
      //       if (wsRef.current?.readyState === WebSocket.OPEN) {
      //         wsRef.current.send(buffer);  // <<--- IMPORTANT: SEND BINARY
      //       }
      //     });
      //   }
      // };

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const buffer = await event.data.arrayBuffer();   // convert blob → arraybuffer
          wsRef.current.send(buffer);                  // send binary bytes
        }
      };
      
  
      mediaRecorderRef.current.start(200);
    } catch (err) {
      console.error("Mic error:", err);
      setIsRecording(false);
    }
  };
  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "end" }));
    }
  };
  

  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const MAX_ROWS = 10;

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_ROOT}/conversations`, { headers: { "Authorization": `Bearer ${token}` } });
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
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const uploadNotice = { role: "assistant", content: `⏳ Uploading **${file.name}**...` };
    setMessages(prev => [...prev, uploadNotice]);
    try {
      const res = await fetch(`${API_ROOT}/upload`, { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) {
        const successMsg = { role: "assistant", content: data.message || `📄 File **${file.name}** uploaded successfully.\nYou can now ask me anything from this file.` };
        setMessages(prev => [...prev.slice(0, -1), successMsg]);
      } else {
        const failMsg = { role: "assistant", content: `❌ Upload failed: ${data.detail || "Unknown error"}` };
        setMessages(prev => [...prev.slice(0, -1), failMsg]);
      }
    } catch (err) {
      console.error(err);
      const errMsg = { role: "assistant", content: "❌ Error uploading file." };
      setMessages(prev => [...prev.slice(0, -1), errMsg]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = MAX_ROWS * lineHeight;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    const val = userInput;
    if (!val) return;
    const userMsg = { role: 'user', content: val };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);
    try {
      const payload = { messages: newMessages };
      if (currentConversationId) payload.conversation_id = currentConversationId;
      const res = await fetch(`${API_ROOT}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        if (data.conversation_id && !currentConversationId) setCurrentConversationId(data.conversation_id);
        fetchConversations();
      } else {
        const errorMsg = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail.map(err => err.msg || JSON.stringify(err)).join(', ') : "Error from server";
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

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      const res = await fetch(`${API_ROOT}/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        if (currentConversationId === conversationId) {
          setMessages([]);
          setCurrentConversationId(null);
        }
        fetchConversations();
      } else {
        const data = await res.json();
        alert(`Failed to delete conversation: ${data.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      alert("Error deleting conversation. Please try again.");
    }
  };

  return (
    <div className="app-container">
      <div className={`sidebar ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <Logo width={100} height={100} gradientId="Sidebar" />
            <h2 className="sidebar-title">DevMate</h2>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="toggle-btn">{sidebarOpen ? '◀' : '▶'}</button>
        </div>
        {sidebarOpen && (
          <>
            <button onClick={startNewChat} className="new-chat-btn">➕ New Chat</button>
            <div className="conversations-list">
              <h3 className="conversations-header">History</h3>
              {conversations.length === 0 ? (
                <p className="no-conversations">No conversations yet</p>
              ) : (
                conversations.map((conv) => {
                  const preview = getConversationPreview(conv);
                  const userMsgCount = conv.messages?.filter(m => m.role === 'user').length || 0;
                  const isActive = currentConversationId === conv._id;
                  return (
                    <div key={conv._id} className={`conversation-card ${isActive ? 'active' : ''}`} onClick={() => loadConversation(conv)}>
                      <div className="conversation-header-row">
                        <div className="conversation-date">
                          {new Date(conv.updated_at || conv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <button className="delete-conversation-btn" onClick={(e) => handleDeleteConversation(conv._id, e)} title="Delete conversation">🗑️</button>
                      </div>
                      <div className="conversation-content">
                        <div className="conversation-user"><span className="role-label">You:</span> {preview.userMsg}</div>
                        <div className="conversation-ai"><span className="role-label">AI:</span> {preview.aiMsg}</div>
                      </div>
                      <div className="conversation-meta">{conv.messages?.length || 0} msgs • {userMsgCount} from you</div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
      <div className="main-content">
        <div className="top-bar">
          {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="open-sidebar-btn">☰</button>}
          <div className="user-info">
            <span className="username">{username}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
        <div ref={chatRef} className="chat-container">
          <div className="watermark-container"><Logo width={500} height={500} gradientId="Watermark" /></div>
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2>Welcome to DevMate! 👋</h2>
              <p>Start a conversation by typing a message below.</p>
              <p className="hint">💡 You can also upload files (PDF, images, text) using the 📎 button</p>
            </div>
          ) : (
            messages.map((msg, idx) => <Message key={idx} text={msg.content} sender={msg.role === 'user' ? 'user' : 'ai'} />)
          )}
          {loading && <div className="loading-indicator">AI is thinking...</div>}
        </div>
        <div className="input-container">
          <textarea ref={textareaRef} className="chat-textarea" placeholder="Type a message..." rows={1} value={userInput} onKeyDown={handleKeyDown} onChange={handleInputChange} disabled={loading}></textarea>
          <div className="input-actions">
            <label className="upload-btn">📎<input type="file" style={{ display: "none" }} onChange={handleFileUpload} /></label>
            <button className="send-icon" onClick={sendMessage} disabled={loading}>➤</button>
          </div>
          <button className={`mic-btn ${isRecording ? 'mic-recording' : 'mic-idle'}`} onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}>🎤</button>
        </div>
      </div>
    </div>
  );
};

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
    <div className="app">
      {isAuthenticated ? <ChatPage token={token} username={username} onLogout={handleLogout} /> : <AuthPage onLogin={handleLogin} />}
    </div>
  );
}
