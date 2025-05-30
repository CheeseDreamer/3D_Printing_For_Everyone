import React, { useState } from 'react';
import appLogo from '../assets/logo.png'; 

function RegisterPage({ onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [actualPassword, setActualPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (actualPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    if (actualPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
    if (!username || !email || !actualPassword || !firstName || !lastName) {
        setError('Please fill in all required fields (Username, Email, Password, First Name, Last Name).');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, email, password: actualPassword, firstName, lastName,
          clientPhone: clientPhone || null, role: 'CLIENT'
        }),
      });
      const data = await response.json();
      setIsLoading(false);
      if (response.ok) {
        setSuccessMessage('Registration successful! You can now login.');
        if (onRegisterSuccess) onRegisterSuccess();
        setUsername(''); setEmail(''); setActualPassword(''); setConfirmPassword('');
        setFirstName(''); setLastName(''); setClientPhone('');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('An error occurred. Please check your connection and try again.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="auth-page-container"> 
      <form onSubmit={handleSubmit} className="auth-form"> 
        <img src={appLogo} alt="App Logo" className="logo-image" />
        <h2 className="auth-form-title">Register</h2> 
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <div className="input-group">
          <label htmlFor="reg-username">Username:</label>
          <input type="text" id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="reg-email">Email:</label>
          <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="reg-password">Password:</label>
          <input type="password" id="reg-password" value={actualPassword} onChange={(e) => setActualPassword(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="reg-confirm-password">Confirm Password:</label>
          <input type="password" id="reg-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="reg-firstName">First Name:</label>
          <input type="text" id="reg-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="reg-lastName">Last Name:</label>
          <input type="text" id="reg-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="reg-clientPhone">Phone (Optional):</label>
          <input type="tel" id="reg-clientPhone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
    </div>
  );
}

export default RegisterPage;