document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    if (!form) return;

<<<<<<< HEAD
    const permissionSelect = document.getElementById('permissao');
    let user = {};
    try {
        user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
        console.error('Não foi possível ler os dados do usuário.', error);
    }
    const permission = String(user.permissao ?? '').trim().toUpperCase();
    const isAdmin = ['ADMIN', 'ADMINISTRADOR', 'ADM', '1', 'TRUE'].includes(permission);
    const token = localStorage.getItem('token');

    if (isAdmin && token && permissionSelect) {
        permissionSelect.add(new Option('Administrador', 'admin'));
    }

    form.addEventListener('submit', async (event) => {
=======
    let user;
    try {
        user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
        user = {};
    }
    const token = localStorage.getItem('token');
    if (!token || String(user.permissao || '').toLowerCase() !== 'admin') {
        window.location.replace('/');
        return;
    }
>>>>>>> 9c4cd8c (Reforça segurança do cadastro, configura segredos e adiciona testes automatizados)

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const isAdminCreation = isAdmin && Boolean(token);
        const payload = { nome, email, password: senha };

        if (isAdminCreation) {
            payload.permissao = permissionSelect.value;
        }

        try {
            const response = await fetch(
<<<<<<< HEAD
                isAdminCreation
                    ? '/api/auth/users'
                    : '/api/auth/register',
=======
                '/api/auth/register',
>>>>>>> 9c4cd8c (Reforça segurança do cadastro, configura segredos e adiciona testes automatizados)
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
<<<<<<< HEAD
                        ...(isAdminCreation ? { Authorization: `Bearer ${token}` } : {})
=======
                        Authorization: `Bearer ${token}`
>>>>>>> 9c4cd8c (Reforça segurança do cadastro, configura segredos e adiciona testes automatizados)
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Usuário cadastrado com sucesso!');
                window.location.href = '/';
            } else {
                alert(data.message || 'Erro ao cadastrar usuário, email ou senha inválidos');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com o servidor');
        }
    });
});