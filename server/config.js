function getJwtSecret(env = process.env) {
  const secret = env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.trim().length < 32) {
    throw new Error('JWT_SECRET deve conter pelo menos 32 caracteres.');
  }
  return secret.trim();
}

function getDatabaseConfig(env = process.env) {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter(key => typeof env[key] !== 'string' || env[key].trim() === '');
  if (missing.length) {
    throw new Error(`Variáveis obrigatórias de banco ausentes: ${missing.join(', ')}`);
  }

  return {
    host: env.DB_HOST.trim(),
    user: env.DB_USER.trim(),
    password: env.DB_PASSWORD,
    database: env.DB_NAME.trim(),
    waitForConnections: true,
    connectionLimit: Number(env.DB_CONN_LIMIT) || 10,
    queueLimit: 0,
    connectTimeout: Number(env.DB_CONNECT_TIMEOUT) || 10000
  };
}

module.exports = { getJwtSecret, getDatabaseConfig };
