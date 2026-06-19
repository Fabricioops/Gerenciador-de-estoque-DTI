document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('register-form');

    if (!form) return;

    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const permissao = document.getElementById('permissao').value;

        try {

            const response = await fetch(
                'http://localhost:3000/api/auth/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome,
                        email,
                        password: senha,
                        permissao
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                alert('Usuário cadastrado com sucesso!');

                window.location.href = '/';

            } else {

                alert(data.message || 'Erro ao cadastrar usuário');

            }

        } catch (error) {

            console.error(error);

            alert('Erro ao conectar com o servidor');

        }

    });

});