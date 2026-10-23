document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('register-form');

    if (!form) return;

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

        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const isAdminCreation = isAdmin && Boolean(token);
        const payload = { nome, email, password: senha };

        if (isAdminCreation) {
            payload.permissao = permissionSelect.value;
        }

        try {

            const response = await fetch(
                isAdminCreation
                    ? '/api/auth/users'
                    : '/api/auth/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(isAdminCreation ? { Authorization: `Bearer ${token}` } : {})
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