const jwt = require('jsonwebtoken');

const JWT_SECRET = 'seu_segredo_super_secreto';

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token ausente ou formato inválido' });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // log para diagnóstico
    console.log('verifyToken: auth header present, token length=', token.length);
    console.log('verifyToken: payload=', payload);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Não autorizado' });
  const raw = req.user.permissao;
  const perm = (raw === undefined || raw === null) ? '' : String(raw).toUpperCase();
  const numeric = Number(raw);
  const isAdmin = (
    perm === 'ADMIN' ||
    perm === 'ADMINISTRADOR' ||
    perm === 'ADM' ||
    perm === '1' ||
    numeric === 1 ||
    raw === true
  );
  if (!isAdmin) {
    console.warn('requireAdmin: acesso negado para permissao=', raw);
    return res.status(403).json({ message: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
