const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../db');
const { getJwtSecret } = require('../config');

const JWT_SECRET = getJwtSecret();

function normalizePermission(permission) {
  const normalized = String(permission ?? '').trim().toUpperCase();
  if (['ADMIN', 'ADMINISTRADOR', 'ADM', '1'].includes(normalized)) return 'admin';
  if (['PADRAO', 'TÉCNICO', 'TECNICO', '0'].includes(normalized)) return 'padrao';
  return null;
}

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const users = await executeQuery('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha inválida.' });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, permissao: user.permissao },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        permissao: user.permissao
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

async function createUser(req, res, permission) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    return res.status(400).json({
      message: 'Informe nome, email válido e senha com pelo menos 12 caracteres.'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await executeQuery(
      'INSERT INTO usuarios (nome, email, senha, permissao) VALUES (?, ?, ?, ?)',
      [nome, email, hashedPassword, permission]
    );
    return res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já existe um usuário com esse email.' });
    }
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ message: 'Erro ao criar usuário.' });
  }
}

exports.registerUser = async (req, res) => {
  const permission = normalizePermission(req.body && req.body.permissao);
  if (!permission) {
    return res.status(400).json({ message: 'Permissão deve ser Técnico ou Administrador.' });
  }
  return createUser(req, res, permission);
};

exports.createUser = async (req, res) => {
  const permission = normalizePermission(req.body && req.body.permissao);
  if (!permission) {
    return res.status(400).json({ message: 'Permissão deve ser Técnico ou Administrador.' });
  }
  return createUser(req, res, permission);
};
