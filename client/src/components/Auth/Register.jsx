import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        customer_id: '',
        customer_name: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/register`, formData);
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            console.error(error);
            alert('Registration failed. Try again.');
        }
    };

    return (
        <div className="glass-panel form-container">
            <h2>Join Codeness Bank App</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="customer_id"
                    placeholder="Customer ID"
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="customer_name"
                    placeholder="Full Name"
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
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
                <button type="submit" style={{ width: '100%' }}>Create Account</button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                Already have an account? <Link to="/login" className="nav-link">Login</Link>
            </p>
        </div>
    );
};

export default Register;
