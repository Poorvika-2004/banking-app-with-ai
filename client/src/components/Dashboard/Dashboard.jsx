import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChatBot from './ChatBot';

const Dashboard = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [balance, setBalance] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [userToken, setUserToken] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'profile'
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [transferData, setTransferData] = useState({ to_customer_id: '', amount: '' });
    const navigate = useNavigate();

    useEffect(() => {
        handleFetchProfile();
        handleCheckBalance(false); // Auto-fetch silently on load
    }, []);

    const handleFetchProfile = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/profile`, {
                withCredentials: true
            });
            setUserProfile(res.data.user);
            setUserToken(res.data.token);
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 401) {
                console.log("Unauthorized access to profile");
            }
        }
    };

    const handleCheckBalance = async (showModal = true) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/balance`, {
                withCredentials: true
            });
            setBalance(res.data.balance);
            if (showModal) {
                setShowBalanceModal(true);
            }
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 401) {
                console.log("Unauthorized access to dashboard");
            } else {
                alert('Failed to fetch balance');
            }
        }
    };

    const handleTransferChange = (e) => {
        setTransferData({ ...transferData, [e.target.name]: e.target.value });
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/transfer`, transferData, {
                withCredentials: true
            });
            alert('Transfer successful!');
            handleCheckBalance(false); // Refresh balance silently
            setTransferData({ to_customer_id: '', amount: '' });
            if (activeTab === 'profile') {
                handleFetchProfile(); // Refresh profile balance too
            }
        } catch (error) {
            console.error(error);
            alert('Transfer failed: ' + (error.response?.data?.error || 'Unknown error'));
        }
    };

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate('/login');
    }

    return (
        <div style={{ display: 'flex', width: '100%', maxWidth: '1200px', minHeight: '600px', gap: '2rem' }}>
            {/* Sidebar */}
            <div className="glass-panel sidebar" style={{ display: 'flex', flexDirection: 'column', padding: '2rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        👤
                    </div>
                    {userProfile && (
                        <>
                            <h3 style={{ margin: 0 }}>{userProfile.customer_name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userProfile.email}</p>
                            <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>USER</span>
                        </>
                    )}
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <button
                        className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        👤 Profile
                    </button>
                    <div style={{ flex: 1 }}></div>
                    <button onClick={() => navigate('/admin')} className="sidebar-btn" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        ⚙️ Admin Panel
                    </button>
                    <button onClick={handleLogout} className="sidebar-btn" style={{ fontSize: '0.8rem', color: '#ff4d4d', opacity: 0.8 }}>
                        🚪 Logout
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                    <h2 style={{ margin: 0 }}>CODE BANK APP <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>| Secure Internet Banking</span></h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {userProfile && <span style={{ opacity: 0.8 }}>Welcome, {userProfile.customer_name}</span>}
                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            style={{
                                background: 'linear-gradient(135deg, var(--secondary), var(--accent))',
                                border: 'none',
                                borderRadius: '50%',
                                width: '45px',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            title="Open AI Assistant"
                        >
                            💬
                        </button>
                    </div>
                </div>

                {activeTab === 'dashboard' && (
                    <div className="dashboard-grid">
                        <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <h3>My Account</h3>
                            <div style={{ margin: '2rem 0', textAlign: 'center' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {balance !== null ? `₹${balance.toFixed(2)}` : '---'}
                                </span>
                                <p style={{ color: 'var(--text-muted)' }}>Current Balance</p>
                            </div>
                            <button onClick={() => handleCheckBalance(true)} style={{ width: '100%' }}>Check Balance</button>
                        </div>

                        <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <h3>Transfer Money</h3>
                            <form onSubmit={handleTransfer}>
                                <input
                                    type="text"
                                    name="to_customer_id"
                                    placeholder="Recipient Customer ID"
                                    value={transferData.to_customer_id}
                                    onChange={handleTransferChange}
                                    required
                                />
                                <input
                                    type="number"
                                    name="amount"
                                    placeholder="Amount"
                                    value={transferData.amount}
                                    onChange={handleTransferChange}
                                    required
                                    min="1"
                                />
                                <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))' }}>
                                    Transfer Funds
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && userProfile && (
                    <div className="glass-panel profile-container" style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Account Information</h3>

                        <div className="profile-grid">
                            <div className="profile-row">
                                <span className="profile-label">👤 Full Name</span>
                                <span className="profile-value">{userProfile.customer_name}</span>
                            </div>
                            <div className="profile-row">
                                <span className="profile-label">✉️ Email Address</span>
                                <span className="profile-value">{userProfile.email}</span>
                            </div>
                            <div className="profile-row">
                                <span className="profile-label">🆔 Customer ID</span>
                                <span className="profile-value">{userProfile.customer_id}</span>
                            </div>
                            <div className="profile-row">
                                <span className="profile-label">🔑 Password Hash</span>
                                <span className="profile-value hash-text" title={userProfile.password}>
                                    {userProfile.password.substring(0, 15)}...
                                </span>
                            </div>
                            <div className="profile-row">
                                <span className="profile-label">💰 Account Balance</span>
                                <span className="profile-value highlight-green">₹ {userProfile.balance.toFixed(2)}</span>
                            </div>
                        </div>

                        {userToken && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Active Session (JWT Token Storage)</h4>
                                <div className="profile-row" style={{ padding: '0.5rem 0', border: 'none' }}>
                                    <span className="profile-label" style={{ fontSize: '0.8rem' }}>Token ID</span>
                                    <span className="profile-value" style={{ fontSize: '0.8rem' }}>{userToken.token_id}</span>
                                </div>
                                <div className="profile-row" style={{ padding: '0.5rem 0', border: 'none' }}>
                                    <span className="profile-label" style={{ fontSize: '0.8rem' }}>Token Value</span>
                                    <span className="profile-value hash-text" style={{ fontSize: '0.8rem' }} title={userToken.token_value}>
                                        {userToken.token_value.substring(0, 20)}...
                                    </span>
                                </div>
                                <div className="profile-row" style={{ padding: '0.5rem 0', border: 'none' }}>
                                    <span className="profile-label" style={{ fontSize: '0.8rem' }}>Valid Until</span>
                                    <span className="profile-value" style={{ fontSize: '0.8rem', color: '#4ade80' }}>
                                        {new Date(userToken.expiry_time).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showBalanceModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ background: '#1e293b', minWidth: '300px', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Your Balance</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', margin: '1rem 0' }}>
                            ₹{balance !== null ? balance.toFixed(2) : '0.00'}
                        </p>
                        <button onClick={() => setShowBalanceModal(false)} style={{ marginTop: '1rem', width: '100%' }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* ChatBot Overlay */}
            {isChatOpen && <ChatBot onClose={() => setIsChatOpen(false)} />}
        </div>
    );
};

export default Dashboard;

