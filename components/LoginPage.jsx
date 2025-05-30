
import React, { useState } from 'react';

import appLogo from '../assets/logo.png'; 

function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!identifier || !password) {
      setError('Please enter both email/username and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [identifier.includes('@') ? 'email' : 'username']: identifier,
          password,
        }),
      });
      const data = await response.json();
      setIsLoading(false);
      if (response.ok) {
        if (onLoginSuccess) onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('An error occurred. Please check your connection and try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="auth-page-container"> 
      <form onSubmit={handleSubmit} className="auth-form"> 
        <img src={appLogo} alt="App Logo" className="logo-image" />
        <h2 className="auth-form-title">Login</h2> 
        {error && <p className="error-message">{error}</p>} 
        <div className="input-group">
          <label htmlFor="identifier">Email or Username:</label>
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
    </div>
  );
}

export default LoginPage;