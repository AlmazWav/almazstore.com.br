const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT_HTTPS = 443;
const PORT_HTTP = 80;

app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../recuperacao')));

// Initialize Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            cpf TEXT,
            email TEXT,
            payment_status TEXT,
            payment_token TEXT,
            payment_method TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Mock Payment Gateway Processing
const mockPaymentProcess = (type, data) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (type === 'credit_card') {
                resolve({ success: true, token: 'tok_' + Math.random().toString(36).substr(2) });
            } else if (type === 'pix') {
                resolve({ success: true, qr_code: '00020126580014br.gov.bcb.pix...', token: 'pix_' + Math.random().toString(36).substr(2) });
            }
        }, 1000);
    });
};

// API: Checkout
app.post('/api/checkout', async (req, res) => {
    const { name, cpf, email, method, cardData } = req.body;
    
    const paymentResult = await mockPaymentProcess(method, cardData);
    
    if (paymentResult.success) {
        const token = paymentResult.token;
        const status = method === 'pix' ? 'pending' : 'approved';
        
        db.run(`INSERT INTO customers (name, cpf, email, payment_status, payment_token, payment_method) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, cpf, email, status, token, method],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID, ...paymentResult });
            }
        );
    } else {
        res.status(400).json({ success: false, message: 'Payment failed' });
    }
});

// API: Admin Get Customers
app.get('/api/admin/customers', (req, res) => {
    db.all(`SELECT * FROM customers ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Admin Refund
app.post('/api/admin/refund', (req, res) => {
    const { id } = req.body;
    db.get(`SELECT * FROM customers WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Customer not found' });
        
        db.run(`UPDATE customers SET payment_status = 'refunded' WHERE id = ?`, [id], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            res.json({ success: true, message: 'Refund processed' });
        });
    });
});

// --- HTTPS Setup ---
const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'key.pem');
const certPath = path.join(sslDir, 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    };

    // HTTPS server (main)
    https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
        console.log(`✅ HTTPS Server running on https://localhost:${PORT_HTTPS}`);
    });

    // HTTP redirect to HTTPS
    const redirectApp = express();
    redirectApp.all('/{*splat}', (req, res) => {
        res.redirect(`https://${req.hostname}${req.url}`);
    });
    http.createServer(redirectApp).listen(PORT_HTTP, () => {
        console.log(`🔀 HTTP redirect running on http://localhost:${PORT_HTTP} -> HTTPS`);
    });
} else {
    console.log('⚠️  SSL certificates not found. Run "node generate-ssl.js" first.');
    console.log('   Starting in HTTP mode on port 3000...');
    app.listen(3000, () => {
        console.log(`Server running on http://localhost:3000`);
    });
}
