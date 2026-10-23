const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../db');

<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET;
=======
// Segredo para o JWT. Em um projeto real, use uma variável de ambiente!
const JWT_SECRET = process.env.JWT_SECRET || (
    process.env.NODE_ENV === 'production'
        ? null
        : 'dti-estoque-dev-secret-change-me'
);
>>>>>>> 168e6481e4e66abb5719a504bd5ca7928b55142f

function normalizePermission(permission) {
    const normalized = String(permission ?? '').trim().toUpperCase();
    if (['ADMIN', 'ADMINISTRADOR', 'ADM', '1'].includes(normalized)) return 'admin';
    if (['PADRAO', 'TÉCNICO', 'TECNICO', '0'].includes(normalized)) return 'padrao';
    return null;
}

async function createUser(req, res, permission) {
    const body = req.body || {};
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = body.password;

    if (!nome || !email || typeof password !== 'string' || !password) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sqlQuery = 'INSERT INTO Usuarios (nome, email, senha, permissao) VALUES (?, ?, ?, ?)';
        await executeQuery(sqlQuery, [nome, email, hashedPassword, permission]);

        return res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Já existe um usuário com esse email.' });
        }
        return res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
}

exports.login = async (req, res) => {
    const { email, senha } = req.body; // O nome da variável aqui deve ser 'senha'

    if (!email || !senha) { // Verificando 'senha'
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        // Sintaxe de query para MySQL, usando '?' como placeholder
        const sqlQuery = 'SELECT * FROM usuarios WHERE email = ?';
        const users = await executeQuery(sqlQuery, [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = users[0];

        // Compara a senha enviada com a senha criptografada no banco
        // ATENÇÃO: Se você inseriu a senha manualmente no banco, ela não está criptografada.
        

        //const isPasswordValid = await bcrypt.compare(senha, user.senha);
        const isPasswordValid = await bcrypt.compare(
        senha,
        user.senha
        );

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET não configurado em produção');
        }

        // Gera o token JWT
        const token = jwt.sign(
            { id: user.id, nome: user.nome, permissao: user.permissao },
            JWT_SECRET,
            { expiresIn: '8h' } // Token expira em 8 horas
        );

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token,
            user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            permissao: user.permissao
}
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.registerUser = async (req, res) => {
<<<<<<< HEAD
    return createUser(req, res, 'padrao');
};

exports.createUser = async (req, res) => {
    const permission = normalizePermission(req.body && req.body.permissao);
    if (!permission) {
        return res.status(400).json({ message: 'Permissão deve ser Técnico ou Administrador.' });
    }

    return createUser(req, res, permission);
=======
    const { nome, email, password, permissao } = req.body;

    try {
        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sqlQuery = 'INSERT INTO usuarios (nome, email, senha, permissao) VALUES (?, ?, ?, ?)';
        await executeQuery(sqlQuery, [nome, email, hashedPassword, permissao]);
        
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
>>>>>>> 168e6481e4e66abb5719a504bd5ca7928b55142f
};
