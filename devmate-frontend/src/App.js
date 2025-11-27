import React, { useState, useEffect, useRef } from 'react';

const API_ROOT = "https://devmate-lxbp.onrender.com";

// Auth Component
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
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
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem("dev_token", data.access_token);
        localStorage.setItem("dev_user", loginUsername);
        onLogin(data.access_token, loginUsername);
      } else {
        setLoginInfo(data.detail || "Login failed");
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
        body: JSON.stringify({ username: signupUsername, password: signupPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setSignupInfo("Signup successful! Please Login.");
      } else {
        setSignupInfo(data.detail || "Signup failed");
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
            type="text"
            placeholder="Username"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
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
            placeholder="Create Username"
            value={signupUsername}
            onChange={(e) => setSignupUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSignup(e)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Create Password"
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
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

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

    try {
      const res = await fetch(`${API_ROOT}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await res.json();
      const ai = data.messages?.slice(-1)[0]?.content || "No response from AI";
      const aiMsg = { role: 'assistant', content: ai };
      setMessages([...newMessages, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = { role: 'assistant', content: "Error connecting to server" };
      setMessages([...newMessages, errorMsg]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>DevMate</h1>

      <div style={styles.nav}>
        <button onClick={() => {}} style={styles.navLink}>Home</button>
        <span style={styles.username}>{username}</span>
        <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div ref={chatRef} style={styles.chatContainer}>
        {messages.map((msg, idx) => (
          <Message key={idx} text={msg.content} sender={msg.role === 'user' ? 'user' : 'ai'} />
        ))}
      </div>

      <div style={styles.inputRow}>
        <input
          type="text"
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={styles.textInput}
        />
        <button onClick={sendMessage} style={styles.sendBtn}>Send</button>
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
  container: {
    width: '97%',
    height: '90vh',
    margin: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: '0 0 10px 0',
  },
  nav: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '10px',
  },
  navLink: {
    color: '#0366d6',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0,
  },
  username: {
    marginLeft: 'auto',
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    background: '#0366d6',
    color: '#fff',
    cursor: 'pointer',
  },
  chatContainer: {
    flex: 1,
    border: '1px solid #ddd',
    padding: '12px',
    borderRadius: '8px',
    background: '#ffffff',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  message: {
    padding: '12px',
    borderRadius: '6px',
    margin: '6px 0',
    maxWidth: '70%',
    lineHeight: '1.6',
  },
  userMessage: {
    background: '#0366d6',
    color: '#fff',
    marginLeft: 'auto',
  },
  aiMessage: {
    background: '#eef2ff',
    color: '#111',
    marginRight: 'auto',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  textInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  sendBtn: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: 'none',
    background: '#0366d6',
    color: '#fff',
    cursor: 'pointer',
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