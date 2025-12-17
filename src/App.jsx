import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
                      <h4>You're Ready to Make a Difference!</h4>
                      <p>Your voice matters in the fight for warehouse and retail data transparency.</p>
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
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Paid for by Citizens for Data Transparency</p>
        <p className="disclaimer">This is a fictional campaign for educational purposes.</p>
      </footer>

      <div className="decorative-stripe bottom"></div>
    </div>
  );
}

export default App;
