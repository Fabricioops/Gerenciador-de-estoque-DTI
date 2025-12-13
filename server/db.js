// server/db.js
// Wrapper de conexão MySQL usando mysql2/promise
const mysql = require('mysql2/promise');

// Carrega .env em desenvolvimento se disponível (não obrigatório em produção)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv pode não estar instalado — ignorar se faltar
}
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'faps1234$@',
  database: process.env.DB_NAME || 'dti_estoque',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  queueLimit: 0,
};
//const dbConfig = {
  //host: process.env.DB_HOST || 'localhost',
  //user: process.env.DB_USER || 'estoque_user',
  //password: process.env.DB_PASSWORD || 'admin123',
 // database: process.env.DB_NAME || 'dti_estoque',
 // waitForConnections: true,
 // connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
 // queueLimit: 0,
 // connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,
 // acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT) || 10000,
//};


let pool = null;

/**
 * Cria (se necessário) e retorna o pool.
 * Em caso de falha, lança o erro para o chamador decidir o que fazer.
 */
async function connectDB() {
  if (pool) return pool;
  pool = mysql.createPool(dbConfig);
  try {
    // Verifica conexão mínima
    await pool.query('SELECT 1');
    console.log('Conectado ao MySQL com sucesso!');
    return pool;
  } catch (err) {
    pool = null;
    throw new Error(`Erro ao conectar ao MySQL: ${err.message}`);
  }
}

/**
 * Executa uma query SQL usando o pool. Faz lazy-init do pool se necessário.
 * Usa pool.execute para operações simples. Para transações, use getPool().getConnection().
 */
async function executeQuery(sql, params = []) {
  if (!sql || typeof sql !== 'string') {
    throw new TypeError('Parâmetro "sql" deve ser uma string não vazia.');
  }
  if (!pool) {
    await connectDB();
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Retorna o pool (pode ser null) — útil para transações/manual connection
 */
function getPool() {
  return pool;
}

/**
 * Health check simples
 */
async function ping() {
  if (!pool) await connectDB();
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows && rows[0] && rows[0].ok === 1;
}

module.exports = { connectDB, executeQuery, getPool, ping };
