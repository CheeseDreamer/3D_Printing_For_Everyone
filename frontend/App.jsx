import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeftMenu from './components/LeftMenu';
import SettingsPage from './components/SettingsPage';
import MyAccountPage from './components/MyAccountPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import CombinedOrdersPage from './components/CombinedOrdersPage';
import MyBalancePage from './components/MyBalancePage';
import FileUploader from './components/FileUploader';
import PrintSettings from './components/PrintSettings';
import FilamentSelection from './components/FilamentSelection';
import PreviewAndSupport from './components/PreviewAndSupport';

import './App.css';             
import './components/AuthForm.css'; 
import './Dashboard.css';       

const HomeIcon = () => <span>🏠</span>;
const OrderIcon = () => <span>📦</span>;
const SettingsIcon = () => <span>⚙️</span>;
 const AccountIcon = () => <span>👤</span>; 
 const BalanceIcon = () => <span>💰</span>; 
 const PasswordIcon = () => <span>🔑</span>; 
const NewOrderIcon = () => <span>➕</span>;


function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authPage, setAuthPage] = useState('login');
  
  const [activePageId, setActivePageId] = useState('dashboard-home');
  const [currentPageLabel, setCurrentPageLabel] = useState('Dashboard');
  const [expandedParentId, setExpandedParentId] = useState(null);
  const [isAccountEditMode, setIsAccountEditMode] = useState(false);

  const [userOrders, setUserOrders] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);

  const [newOrderStep, setNewOrderStep] = useState(0);
  const [newOrderData, setNewOrderData] = useState({
    file: null, fileName: '', printerType: '', printQuality: '',
    filaments: [], needsSupport: false,
  });
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [availablePrinters, setAvailablePrinters] = useState([]);

  const menuItems = [
    { id: 'new-order-start', label: 'New Order', icon: <NewOrderIcon />, parentId: null },
    {
      id: 'orders', label: 'My Orders', icon: <OrderIcon />, parentId: null,
      subItems: [
        { id: 'orders-all', label: 'All Orders', parentId: 'orders' },
      ]
    },
    { id: 'my-balance', label: 'My Balance', icon: <BalanceIcon />, parentId: null }, 
    { id: 'settings', label: 'Settings', icon: <SettingsIcon />, parentId: null },
  ];

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:5001/api/user/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setLoggedInUser(prev => ({ ...prev, ...data }));
      } else {
        console.error("Failed to fetch user profile", await response.text());
        
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
    }
  }, []);

  useEffect(() => {
    if (loggedInUser && loggedInUser.userId && (loggedInUser.balance === undefined || loggedInUser.phone === undefined)) {
        fetchUserProfile(loggedInUser.userId);
    }
  }, [loggedInUser, fetchUserProfile]);

  const handleLoginSuccess = (userData) => {
    setLoggedInUser(userData);
    setActivePageId('new-order-start'); 
    setCurrentPageLabel('Create New Order');
    setNewOrderStep(1); 
  };

  const handleRegisterSuccess = () => {
    setAuthPage('login');
    alert("Registration successful! Please login.");
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setAuthPage('login');
    setActivePageId('dashboard-home');
    setNewOrderStep(0);
    setNewOrderData({ file: null, fileName: '', printerType: '', printQuality: '', filaments: [], needsSupport: false });
    setUserOrders([]);
    setUserTransactions([]);
    setExpandedParentId(null);
  };

  const handleMenuItemClick = (item, parentIdIfSubItem) => {
    setIsAccountEditMode(false);
    
    if (item.id !== 'new-order-start' && newOrderStep > 0) { 
        setNewOrderStep(0); 
        setNewOrderData({ file: null, fileName: '', printerType: '', printQuality: '', filaments: [], needsSupport: false });
    }

    if (item.subItems) {
      setExpandedParentId(prev => (prev === item.id ? null : item.id));
    } else {
      setActivePageId(item.id);
      setCurrentPageLabel(item.label);
      if (!parentIdIfSubItem && item.id !== 'settings') { 
          setExpandedParentId(null);
      }
    }

    if (item.id === 'new-order-start') {
      setNewOrderStep(1);
      setActivePageId('new-order-flow');
      setCurrentPageLabel('Create New Order');
      setExpandedParentId(null); 
    }
  };

  const navigateFromSettings = (targetPageId, label, editMode = false) => {
    setActivePageId(targetPageId);
    setCurrentPageLabel(label);
    setIsAccountEditMode(editMode);
    setExpandedParentId('settings');
  };

  const handleUpdateUserData = async (updatedData) => {
    if (!loggedInUser || !loggedInUser.userId) return false;
    try {
        const response = await fetch(`http://localhost:5001/api/user/profile?userId=${loggedInUser.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });
        const result = await response.json();
        if (response.ok) {
            fetchUserProfile(loggedInUser.userId); 
            
            return true;
        } else {
            
            throw new Error(result.error || "Failed to update profile."); 
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        
        throw error; 
    }
  };

  const handleChangePasswordAttempt = async (currentPassword, newPassword) => {
    if (!loggedInUser || !loggedInUser.userId) return false; 
    try {
        const response = await fetch(`http://localhost:5001/api/user/change-password?userId=${loggedInUser.userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const result = await response.json();
        if (response.ok) {
            return true;
        } else {
            throw new Error(result.error || "Failed to change password.");
        }
    } catch (error) {
        console.error("Error changing password:", error);
        throw error;
    }
  };
  
  useEffect(() => {
    const fetchOrders = async () => {
        if (loggedInUser?.userId && (activePageId === 'orders-all' || activePageId === 'my-balance')) {
            try {
                
                const response = await fetch(`http://localhost:5001/api/orders?userId=${loggedInUser.userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserOrders(data);
                } else {
                    console.error("Failed to fetch orders", await response.text());
                    setUserOrders([]);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
                setUserOrders([]);
            }
        }
    };
    fetchOrders();
  }, [loggedInUser, activePageId]);

   useEffect(() => {
    const fetchTransactions = async () => {
        if (loggedInUser?.userId && activePageId === 'my-balance') {
            try {
                const response = await fetch(`http://localhost:5001/api/transactions?userId=${loggedInUser.userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserTransactions(data);
                } else {
                    console.error("Failed to fetch transactions", await response.text());
                    setUserTransactions([]);
                }
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setUserTransactions([]);
            }
        }
    };
    fetchTransactions();
  }, [loggedInUser, activePageId]);

  const handleCancelOrder = async (orderId) => {
    if (!loggedInUser?.userId) return;
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;

    try {
        const response = await fetch(`http://localhost:5001/api/orders/${orderId}/cancel?userId=${loggedInUser.userId}`, {
            method: 'POST',
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Order cancelled successfully.");
            fetchUserProfile(loggedInUser.userId);
            setUserOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status: 'CANCELLED', cancelledAt: new Date().toISOString()} : o ));
            fetchTransactions(); 
        } else {
            alert(`Error: ${result.error || "Failed to cancel order."}`);
        }
    } catch (error) {
        console.error("Error cancelling order:", error);
        alert("An error occurred while cancelling the order.");
    }
  };

  useEffect(() => {
    const fetchInitialOrderData = async () => {
        if (newOrderStep === 1 && loggedInUser) {
            try {
                const [materialsRes, printersRes] = await Promise.all([
                    fetch('http://localhost:5001/api/materials'),
                    fetch('http://localhost:5001/api/printers')
                ]);
                if (materialsRes.ok) setAvailableMaterials(await materialsRes.json());
                else console.error("Failed to fetch materials");

                if (printersRes.ok) setAvailablePrinters(await printersRes.json());
                else console.error("Failed to fetch printers");
            } catch (error) {
                console.error("Error fetching initial order data:", error);
            }
        }
    };
    fetchInitialOrderData();
  }, [newOrderStep, loggedInUser]);

  const handleFileSelected = (file) => setNewOrderData(prev => ({ ...prev, file: file, fileName: file ? file.name : '' }));
  const handlePrintSettingsChange = (type, quality) => setNewOrderData(prev => ({ ...prev, printerType: type, printQuality: quality }));
  const handleFilamentToggle = (materialName) => setNewOrderData(prev => ({ ...prev, filaments: [materialName] })); 
  const handleSupportChange = (needsSupport) => setNewOrderData(prev => ({ ...prev, needsSupport }));
  const goToNewOrderStep = (stepNumber) => setNewOrderStep(stepNumber);

  const handleFinishOrder = async () => {
    if (!loggedInUser?.userId) { alert("Login required."); return; }
    if (!newOrderData.file || !newOrderData.printerType || !newOrderData.printQuality || newOrderData.filaments.length === 0) {
        alert("Please complete all order steps."); return;
    }
    const selectedMaterialInfo = availableMaterials.find(m => m.material_name === newOrderData.filaments[0]);
    const orderPayload = {
        fileName: newOrderData.fileName,
        printerType: newOrderData.printerType,
        printQuality: newOrderData.printQuality,
        materialName: selectedMaterialInfo?.material_name || newOrderData.filaments[0],
        materialColor: selectedMaterialInfo?.material_color || null,
        
    };
    try {
        const response = await fetch(`http://localhost:5001/api/orders?userId=${loggedInUser.userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
        });
        const result = await response.json();
        if (response.ok) {
            alert(`Order placed! ID: ${result.orderId}. New balance: €${result.newBalance.toFixed(2)}`);
            setNewOrderStep(0);
            setNewOrderData({ file: null, fileName: '', printerType: '', printQuality: '', filaments: [], needsSupport: false });
            fetchUserProfile(loggedInUser.userId);
            setActivePageId('orders-all');
            setCurrentPageLabel('My Orders');
        } else {
            alert(`Error: ${result.error || "Failed to place order."}`);
        }
    } catch (error) {
        console.error("Error placing order:", error);
        alert("An error occurred while placing order.");
    }
  };

  if (!loggedInUser) {
    return (
      <div className="App"> 
        {authPage === 'login' && (
          <>
            <LoginPage onLoginSuccess={handleLoginSuccess} />
            <p className="auth-switch-text">
              Don't have an account?{' '}
              <button onClick={() => setAuthPage('register')}>Register here</button>
            </p>
          </>
        )}
        {authPage === 'register' && (
          <>
            <RegisterPage onRegisterSuccess={handleRegisterSuccess} />
            <p className="auth-switch-text">
              Already have an account?{' '}
              <button onClick={() => setAuthPage('login')}>Login here</button>
            </p>
          </>
        )}
      </div>
    );
  }

  let currentPageComponent;
  if (newOrderStep > 0) {
      switch (newOrderStep) {
          case 1: currentPageComponent = <FileUploader onFileSelected={handleFileSelected} onNextStep={() => goToNewOrderStep(2)} initialFile={newOrderData.file ? {name: newOrderData.fileName} : null} />; break;
          case 2: currentPageComponent = <PrintSettings selectedPrinterType={newOrderData.printerType} selectedPrintQuality={newOrderData.printQuality} onPrinterTypeChange={(type) => handlePrintSettingsChange(type, newOrderData.printQuality)} onPrintQualityChange={(quality) => handlePrintSettingsChange(newOrderData.printerType, quality)} onPreviousStep={() => goToNewOrderStep(1)} onNext={() => goToNewOrderStep(3)} availablePrinters={availablePrinters} />; break;
          case 3: currentPageComponent = <FilamentSelection selectedFilaments={newOrderData.filaments} onFilamentToggle={handleFilamentToggle} onPreviousStep={() => goToNewOrderStep(2)} onNextStep={() => goToNewOrderStep(4)} selectionLimit={1} currentPrinterType={newOrderData.printerType} availableMaterials={availableMaterials} />; break;
          case 4: currentPageComponent = <PreviewAndSupport selectedFile={newOrderData.file} needsSupport={newOrderData.needsSupport} onSupportChange={handleSupportChange} onPreviousStep={() => goToNewOrderStep(3)} onSkip={handleFinishOrder} onFinish={handleFinishOrder} />; break;
          default: setNewOrderStep(0); currentPageComponent = <p>Welcome {loggedInUser.firstName}! Select an option.</p>;
      }
  } else {
      switch (activePageId) {
          case 'dashboard-home': currentPageComponent = <p>Welcome {loggedInUser.firstName}! This is your dashboard. Select an option from the menu or start a new order.</p>; break;
          case 'settings': currentPageComponent = <SettingsPage userData={loggedInUser} onNavigate={navigateFromSettings} />; break;
          case 'my-account': currentPageComponent = <MyAccountPage userData={loggedInUser} onUpdateUserData={handleUpdateUserData} initialEditMode={isAccountEditMode} onNavigate={navigateFromSettings} />; break;
          case 'change-password': currentPageComponent = <ChangePasswordPage onChangePasswordAttempt={handleChangePasswordAttempt} />; break;
          case 'orders-all': currentPageComponent = <CombinedOrdersPage orders={userOrders} onCancelOrder={handleCancelOrder} />; break;
          case 'my-balance': currentPageComponent = <MyBalancePage currentUser={loggedInUser} transactionHistory={userTransactions} />; break;
          default: currentPageComponent = <p>Page: {currentPageLabel}. Content under construction.</p>;
      }
  }

  return (
    <div className="dashboard-layout">
      <LeftMenu
        items={menuItems}
        activeItemId={activePageId}
        expandedParentId={expandedParentId}
        onItemClick={handleMenuItemClick}
      />
      <main className="dashboard-main-content">
        <div className="page-header">
          <h2>{newOrderStep > 0 ? 'Create New Order' : currentPageLabel}</h2>
          {loggedInUser && (
            <div className="user-info">
              <span>{loggedInUser.username}</span>
              <button onClick={handleLogout} style={{marginLeft: '15px', background: '#777', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Logout</button>
            </div>
          )}
        </div>
        {currentPageComponent}
      </main>
    </div>
  );
}

export default App;