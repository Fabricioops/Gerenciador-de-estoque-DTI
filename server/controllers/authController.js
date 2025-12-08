// server/controllers/authController.js (CORRIGIDO PARA MYSQL)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../db'); // Importamos a função executeQuery

// Segredo para o JWT. Em um projeto real, use uma variável de ambiente!
const JWT_SECRET = 'seu_segredo_super_secreto';

exports.login = async (req, res) => {
    const { email, senha } = req.body; // O nome da variável aqui deve ser 'senha'

    if (!email || !senha) { // Verificando 'senha'
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        // Sintaxe de query para MySQL, usando '?' como placeholder
        const sqlQuery = 'SELECT * FROM Usuarios WHERE email = ?';
        const users = await executeQuery(sqlQuery, [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = users[0];

        // Compara a senha enviada com a senha criptografada no banco
        // ATENÇÃO: Se você inseriu a senha manualmente no banco, ela não está criptografada.
        

        //const isPasswordValid = await bcrypt.compare(senha, user.senha);

        const isPasswordValid = (senha === user.senha); // Comparação direta (não seguro, apenas para teste)--------------------------------
        

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Senha inválida.' });
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
                nome: user.nome,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

// Função para criar um usuário (exemplo) - TAMBÉM CORRIGIDA PARA MYSQL
exports.registerUser = async (req, res) => {
    const { nome, email, password, permissao } = req.body;

    try {
        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sqlQuery = 'INSERT INTO Usuarios (nome, email, senha, permissao) VALUES (?, ?, ?, ?)';
        await executeQuery(sqlQuery, [nome, email, hashedPassword, permissao]);
        
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
};
