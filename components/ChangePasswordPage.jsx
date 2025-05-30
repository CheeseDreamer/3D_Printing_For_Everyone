import React, { useState } from 'react';

const ChangePasswordPage = ({ onChangePasswordAttempt }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatNewPassword, setRepeatNewPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!currentPassword || !newPassword || !repeatNewPassword) {
            setMessage({ text: 'All fields are required.', type: 'error' });
            return;
        }
        if (newPassword !== repeatNewPassword) {
            setMessage({ text: 'New passwords do not match.', type: 'error' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
            return;
        }

        try {
            const success = await onChangePasswordAttempt(currentPassword, newPassword);
            if (success) {
                setMessage({ text: 'Password changed successfully!', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
                setRepeatNewPassword('');
            } else {
                setMessage({ text: 'Failed to change password. Current password might be incorrect or an error occurred.', type: 'error' });
            }
        } catch (error) {
             setMessage({ text: error.message || 'An unexpected error occurred.', type: 'error' });
        }
    };

    return (
        <div className="change-password-container form-container">
            {message.text && (
                <div className={`message-box ${message.type === 'error' ? 'error-box' : 'success-box'}`}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="repeatNewPassword">Repeat New Password</label>
                    <input
                        type="password"
                        id="repeatNewPassword"
                        value={repeatNewPassword}
                        onChange={(e) => setRepeatNewPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="submit-button form-button">
                    Change Password
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordPage;