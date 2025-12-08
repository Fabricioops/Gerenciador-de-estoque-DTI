// server/index.js
// Modificações recentes (explicação):
// - Agora o servidor serve os arquivos estáticos do frontend (pasta `src`) via Express.
// - A rota raiz `/` foi alterada para enviar o arquivo `src/index.html`, garantindo
//   que frontend e backend rodem na mesma origem (http://localhost:3000) em dev.
// - As rotas da API de dashboard foram registradas em `/api/dashboard`.
// Essas alterações resolvem o erro de 404 ao redirecionar para `/dashboard.html` e
// permitem o fluxo single-origin (evitando problemas de localStorage entre portas).
const express = require('express');
const cors = require('cors');

const path = require('path');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { connectDB, executeQuery } = require("./db"); // Certifique-se de importar executeQuery


const app = express();
const PORT = 3000; // Porta do backend

// Middlewares
app.use(cors()); // Permite requisições de outras origens (do seu frontend)
app.use(express.json()); // Permite que o Express entenda JSON no corpo das requisições
// Log simples de todas as requisições (útil para depuração)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
    next();
});

// Rotas da API
app.use('/api/auth', authRoutes); 
// Servir arquivos estáticos do frontend (pasta src) na raiz
app.use(express.static(path.join(__dirname, '..', 'src')));
// Rotas de dashboard (API)
app.use('/api/dashboard', dashboardRoutes);
// Rotas de equipamentos (API) - lista e operações relacionadas
const equipamentoRoutes = require('./routes/equipamentoRoutes');
app.use('/api/equipamentos', equipamentoRoutes);

// Rota de teste
app.get('/', (req, res) => {
    // Serve the frontend index.html from the src folder so the app can be
    // accessed at http://localhost:3000/ (same origin as the API).
    res.sendFile(path.join(__dirname, '..', 'src', 'index.html'));
});

// Inicia o servidor após conectar ao banco de dados
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Servidor backend rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error("Não foi possível iniciar o servidor.", error);
    }
}


startServer();
