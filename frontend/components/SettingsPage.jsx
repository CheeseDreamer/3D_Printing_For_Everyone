import React from 'react';

const SettingsPage = ({ onNavigate, userData }) => {
    const settingsOptions = [
        // { id: 'my-orders', label: 'My Orders', targetPageId: 'orders-all' },
        { id: 'my-account-view', label: 'My Account Details', targetPageId: 'my-account', editMode: false },
        { id: 'edit-profile', label: 'Edit Profile Information', targetPageId: 'my-account', editMode: true },
        { id: 'my-balance-nav', label: 'My Balance & Transactions', targetPageId: 'my-balance' },
        { id: 'change-password-nav', label: 'Change Password', targetPageId: 'change-password' }
    ];

    return (
        <div className="settings-container">
            <ul className="settings-list">
                {settingsOptions.map(option => (
                    <li key={option.id} className="settings-item">
                        <button
                            onClick={() => onNavigate(option.targetPageId, option.label, option.editMode || false)}
                            className="settings-button"
                        >
                            {option.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SettingsPage;