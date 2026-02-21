import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        customer_id: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/login`, formData, {
                withCredentials: true
            });
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Login failed. Check credentials.');
        }
    };

    return (
        <div className="glass-panel form-container">
            <h2>Welcome Back</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="customer_id"
                    placeholder="Customer ID"
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                />
                <button type="submit" style={{ width: '100%' }}>Login</button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                New to Codeness Bank App? <Link to="/register" className="nav-link">Register</Link>
            </p>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Link to="/admin" className="nav-link" style={{ fontSize: '0.8rem' }}>Admin Access</Link>
            </div>
        </div>
    );
};

export default Login;
