import React, { useState, useEffect } from 'react';

const MyAccountPage = ({ userData, onUpdateUserData, initialEditMode = false, onNavigate }) => {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', username: '', email: '', phone: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' }); 

    useEffect(() => {
        if (userData) {
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                username: userData.username || '',
                email: userData.email || '',
                phone: userData.phone || '' 
            });
        }
    }, [userData]);

    useEffect(() => {
        setIsEditing(initialEditMode);
        setMessage({text: '', type: ''}); 
    }, [initialEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({text: '', type: ''});
        const success = await onUpdateUserData(formData); 
        if (success) {
            setIsEditing(false);
            setMessage({text: 'Profile updated successfully!', type: 'success'});
            if (initialEditMode && onNavigate) {
                 setTimeout(() => {
                    onNavigate('my-account', 'My Account', false);
                }, 1500);
            }
        } else {
            setMessage({text: 'Failed to update profile. Please check the data.', type: 'error'});
        }
    };

    const handleCancelEdit = () => {
        if (userData) setFormData({
            firstName: userData.firstName || '', lastName: userData.lastName || '',
            username: userData.username || '', email: userData.email || '',
            phone: userData.phone || ''
        });
        setIsEditing(false);
        setMessage({text: '', type: ''});
        if (initialEditMode && onNavigate) {
            onNavigate('my-account', 'My Account', false);
        }
    };

    if (!userData) {
        return <p>Loading user data...</p>;
    }

    return (
        <div className="my-account-container form-container">

            {message.text && (
                <div className={`message-box ${message.type === 'error' ? 'error-box' : 'success-box'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="my-account-form">
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} readOnly={!isEditing} className={!isEditing ? 'read-only-input' : ''} />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} readOnly={!isEditing} className={!isEditing ? 'read-only-input' : ''} />
                </div>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={formData.username} readOnly className="disabled-input" />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} readOnly={!isEditing} className={!isEditing ? 'read-only-input' : ''} />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} readOnly={!isEditing} className={!isEditing ? 'read-only-input' : ''} />
                </div>

                <div className="action-buttons">
                    {isEditing ? (
                        <>
                            <button type="button" onClick={handleCancelEdit} className="form-button cancel-button">
                                Cancel
                            </button>
                            <button type="submit" className="form-button save-button">
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={() => { setIsEditing(true); setMessage({text:'', type:''}); }} className="form-button edit-button">
                            Edit Profile
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default MyAccountPage;