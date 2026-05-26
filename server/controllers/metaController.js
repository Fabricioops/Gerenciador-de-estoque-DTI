const { executeQuery } = require('../db');

async function ensureLocaisTable() {
  const sql = `CREATE TABLE IF NOT EXISTS Locais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT DEFAULT NULL,
    campus VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await executeQuery(sql);
}

async function ensureStatusesTable() {
  const sql = `CREATE TABLE IF NOT EXISTS Statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await executeQuery(sql);
}

exports.getLocais = async (req, res) => {
  try {
    await ensureLocaisTable();
    const rows = await executeQuery('SELECT id, nome, descricao, campus FROM Locais ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error('getLocais err', err);
    res.status(500).json({ message: 'Erro ao listar locais' });
  }
};

exports.createLocal = async (req, res) => {
  const { nome, descricao, campus } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ message: 'Nome do local é obrigatório' });
  try {
    await ensureLocaisTable();
    const sql = 'INSERT INTO Locais (nome, descricao, campus) VALUES (?, ?, ?)';
    const result = await executeQuery(sql, [nome.trim(), descricao || null, campus || null]);
    res.status(201).json({ id: result.insertId, nome: nome.trim(), descricao: descricao || null, campus: campus || null });
  } catch (err) {
    console.error('createLocal err', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Local já existe' });
    res.status(500).json({ message: 'Erro ao criar local' });
  }
};

exports.getStatuses = async (req, res) => {
  try {
    await ensureStatusesTable();
    const rows = await executeQuery('SELECT id, chave, label FROM Statuses ORDER BY label');
    res.json(rows);
  } catch (err) {
    console.error('getStatuses err', err);
    res.status(500).json({ message: 'Erro ao listar statuses' });
  }
};

exports.createStatus = async (req, res) => {
  const { chave, label } = req.body;
  if (!chave || !chave.trim() || !label || !label.trim()) return res.status(400).json({ message: 'Chave e label são obrigatórios' });
  try {
    await ensureStatusesTable();
    const result = await executeQuery('INSERT INTO Statuses (chave, label) VALUES (?, ?)', [chave.trim(), label.trim()]);
    res.status(201).json({ id: result.insertId, chave: chave.trim(), label: label.trim() });
  } catch (err) {
    console.error('createStatus err', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Status já existe' });
    res.status(500).json({ message: 'Erro ao criar status' });
  }
};
