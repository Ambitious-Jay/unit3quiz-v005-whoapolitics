import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import DataChart from './DataChart';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  
  // Auth form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchRegistrationStatus(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchRegistrationStatus = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setIsRegistered(userDoc.data().isRegistered || false);
      } else {
        await setDoc(doc(db, 'users', uid), { isRegistered: false });
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Error fetching registration status:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Auth error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setAuthError('This email is already registered. Try signing in.');
          break;
        case 'auth/weak-password':
          setAuthError('Password should be at least 6 characters.');
          break;
        case 'auth/invalid-email':
          setAuthError('Please enter a valid email address.');
          break;
        case 'auth/invalid-credential':
          setAuthError('Invalid email or password.');
          break;
        case 'auth/user-not-found':
          setAuthError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setAuthError('Incorrect password.');
          break;
        default:
          setAuthError('An error occurred. Please try again.');
      }
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsRegistered(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleRegistration = async () => {
    if (!user) return;
    setRegistrationLoading(true);
    try {
      const newStatus = !isRegistered;
      await setDoc(doc(db, 'users', user.uid), { isRegistered: newStatus });
      setIsRegistered(newStatus);
    } catch (error) {
      console.error('Error updating registration:', error);
    }
    setRegistrationLoading(false);
  };

  const switchAuthMode = () => {
    setIsSignUp(!isSignUp);
    setAuthError('');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="decorative-stripe top"></div>
      
      <header className="header">
        <div className="campaign-badge">
          <span className="star">★</span>
          <span className="year">2024</span>
        </div>
        <h1 className="title">WAREHOUSE & RETAIL</h1>
        <h2 className="subtitle">Data Reform Initiative</h2>
        <p className="tagline">"Transparency in Every Transaction"</p>
      </header>

      <main className="main-content">
        {!user ? (
          <section className="login-section">
            <div className="message-box">
              <h3>Fellow Citizens,</h3>
              <p>
                Our warehouses overflow while our communities struggle. Retail sales data 
                remains hidden behind corporate walls. It's time for <strong>change</strong>.
              </p>
              <p>
                Join our movement for data transparency. Register your voice. 
                Make warehouse and retail accountability a reality.
              </p>
            </div>
            
            <div className="auth-container">
              <div className="auth-tabs">
                <button 
                  className={`auth-tab ${!isSignUp ? 'active' : ''}`}
                  onClick={() => { setIsSignUp(false); setAuthError(''); }}
                >
                  Sign In
                </button>
                <button 
                  className={`auth-tab ${isSignUp ? 'active' : ''}`}
                  onClick={() => { setIsSignUp(true); setAuthError(''); }}
                >
                  Sign Up
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuth}>
                <h3 className="auth-title">
                  {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                </h3>
                
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                    required
                    minLength={6}
                  />
                </div>

                {authError && (
                  <div className="auth-error">
                    <span className="error-icon">⚠</span>
                    {authError}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="auth-submit-btn"
                  disabled={authLoading}
                >
                  {authLoading 
                    ? 'Processing...' 
                    : isSignUp 
                      ? 'Create Account' 
                      : 'Sign In'}
                </button>

                <p className="auth-switch">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button type="button" onClick={switchAuthMode}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </form>
            </div>
          </section>
        ) : (
          <section className="dashboard-section">
            <div className="user-welcome">
              <div className="user-avatar-placeholder">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <p className="welcome-text">Welcome, Supporter</p>
                <p className="user-name">{user.email}</p>
              </div>
              <button className="sign-out-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>

            <div className="registration-card">
              <div className="card-header">
                <h3>Voter Registration Status</h3>
                <div className={`status-badge ${isRegistered ? 'registered' : 'not-registered'}`}>
                  {isRegistered ? '✓ REGISTERED' : '○ NOT REGISTERED'}
                </div>
              </div>
              
              <div className="card-body">
                {isRegistered ? (
                  <div className="status-message success">
                    <div className="icon">🗳️</div>
                    <div>
                      <h4>Thank You for Registering!</h4>
                      <p>Your support means the world to us. Together, we'll bring transparency to warehouse and retail data.</p>
                    </div>
                  </div>
                ) : (
                  <div className="status-message pending">
                    <div className="icon">📋</div>
                    <div>
                      <h4>Complete Your Registration</h4>
                      <p>Stand with us for accountable commerce and transparent data practices.</p>
                    </div>
                  </div>
                )}

                <button 
                  className={`register-btn ${isRegistered ? 'unregister' : 'register'}`}
                  onClick={toggleRegistration}
                  disabled={registrationLoading}
                >
                  {registrationLoading 
                    ? 'Processing...' 
                    : isRegistered 
                      ? 'Withdraw Registration' 
                      : 'Register to Vote'}
                </button>
              </div>
            </div>

            <div className="issues-section">
              <h3>Our Platform</h3>
              <div className="issues-grid">
                <div className="issue-card">
                  <span className="issue-icon">📦</span>
                  <h4>Warehouse Accountability</h4>
                  <p>Mandatory public reporting of inventory levels and distribution metrics.</p>
                </div>
                <div className="issue-card">
                  <span className="issue-icon">🛒</span>
                  <h4>Retail Transparency</h4>
                  <p>Open access to sales data to ensure fair pricing for all citizens.</p>
                </div>
                <div className="issue-card">
                  <span className="issue-icon">📊</span>
                  <h4>Data Democracy</h4>
                  <p>Your right to know what's being sold, where, and for how much.</p>
                </div>
              </div>
            </div>

            <DataChart />
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Paid for by Citizens for Data Transparency</p>
        <p className="disclaimer">This is a fictional campaign for educational purposes.</p>
        <a 
          href="https://github.com/Ambitious-Jay/unit3quiz-v005-whoapolitics" 
          target="_blank" 
          rel="noopener noreferrer"
          className="github-link"
        >
          <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          View on GitHub
        </a>
      </footer>

      <div className="decorative-stripe bottom"></div>
    </div>
  );
}

export default App;
