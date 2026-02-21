const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'supersecretkey'; // Use env variable in production

app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Codeness Bank App Backend is Running. Access the frontend at http://localhost:5173');
});

// Register
app.post('/register', async (req, res) => {
    const { customer_id, customer_name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (customer_id, customer_name, email, password, balance) VALUES (?, ?, ?, ?, ?)`,
            [customer_id, customer_name, email, hashedPassword, 1000.0],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                res.status(201).json({ message: 'User registered successfully', id: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/login', (req, res) => {
    const { customer_id, password } = req.body;
    db.get(`SELECT * FROM users WHERE customer_id = ?`, [customer_id], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ customer_id: user.customer_id, id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        const expiryTime = Date.now() + 3600000;

        db.run(`INSERT INTO tokens (token_value, customer_id, expiry_time) VALUES (?, ?, ?)`,
            [token, user.customer_id, expiryTime],
            (err) => {
                if (err) return res.status(500).json({ error: 'Token storage failed' });

                // Updated cookie settings for compatibility
                res.cookie('token', token, { httpOnly: true, maxAge: 3600000, sameSite: 'lax', secure: false });
                res.json({ message: 'Login successful', customer_name: user.customer_name });
            }
        );
    });
});

// Middleware to authenticate
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    console.log('Cookies received:', req.cookies); // Debug log
    if (!token) {
        console.log('No token found in cookies');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });

        // Check if token exists in DB and is not expired (extra security)
        db.get(`SELECT * FROM tokens WHERE token_value = ?`, [token], (err, row) => {
            if (err || !row) return res.status(403).json({ error: 'Token invalid or expired' });
            if (row.expiry_time < Date.now()) return res.status(403).json({ error: 'Token expired' });

            req.user = decoded;
            next();
        });
    });
};

// Check Balance
app.get('/balance', authenticate, (req, res) => {
    console.log('Balance check for user:', req.user.customer_id);
    db.get(`SELECT balance FROM users WHERE customer_id = ?`, [req.user.customer_id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ balance: row.balance });
    });
});

// Get User Profile
app.get('/profile', authenticate, (req, res) => {
    console.log('Profile fetch for user:', req.user.customer_id);
    db.get(`SELECT customer_id, customer_name, email, password, balance FROM users WHERE customer_id = ?`, [req.user.customer_id], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Also fetch their active token details for the UI
        db.get(`SELECT token_id, token_value, expiry_time FROM tokens WHERE customer_id = ? AND expiry_time > ? ORDER BY created_at DESC LIMIT 1`, [req.user.customer_id, Date.now()], (err, tokenData) => {
            if (err) return res.status(500).json({ error: 'Database error fetching token' });

            res.json({
                user,
                token: tokenData || null
            });
        });
    });
});

// Transfer Money
app.post('/transfer', authenticate, (req, res) => {
    const { to_customer_id, amount } = req.body;
    const from_customer_id = req.user.customer_id;

    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    db.serialize(() => {
        db.get(`SELECT balance FROM users WHERE customer_id = ?`, [from_customer_id], (err, sender) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });

            db.get(`SELECT customer_id FROM users WHERE customer_id = ?`, [to_customer_id], (err, receiver) => {
                if (err || !receiver) return res.status(404).json({ error: 'Recipient not found' });

                db.run(`UPDATE users SET balance = balance - ? WHERE customer_id = ?`, [amount, from_customer_id]);
                db.run(`UPDATE users SET balance = balance + ? WHERE customer_id = ?`, [amount, to_customer_id]);

                res.json({ message: 'Transfer successful' });
            });
        });
    });
});

// Admin: Get all users
app.get('/users', (req, res) => {
    // Including password field as requested by user
    db.all(`SELECT id, customer_id, customer_name, email, password, balance FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
