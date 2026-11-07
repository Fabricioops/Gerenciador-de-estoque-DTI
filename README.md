# Gerenciador-de-estoque-DTI

Estrutura reorganizada para padrão Node:

- `server/` : código do backend (Express)
- `public/` : arquivos estáticos do frontend (HTML, CSS, JS)

Para iniciar o servidor em desenvolvimento:

```bash
npm install
cp .env.example .env
# Preencha DB_HOST, DB_USER, DB_PASSWORD, DB_NAME e JWT_SECRET.
npm start
```

O frontend estará disponível em http://localhost:3000/

## Configuração de produção

Configure `NODE_ENV=production`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e
`JWT_SECRET` no ambiente de execução. O servidor não usa credenciais de banco nem
segredo JWT padrão em nenhum ambiente; `JWT_SECRET` precisa ter pelo menos 32
caracteres.
Use um gerenciador de segredos e HTTPS. Não versione o arquivo `.env`.

O cadastro público foi desabilitado. Somente administradores autenticados podem
cadastrar usuários, e a senha deve ter pelo menos 12 caracteres. Para provisionar
o primeiro administrador, gere um hash bcrypt com `node server/gerarHash.js` e
insira o usuário por um procedimento administrativo seguro no banco, usando o
hash como valor da coluna `senha` e `admin` como valor da coluna `permissao`. O
utilitário lê a senha sem exibi-la no terminal.

Exemplo de instrução SQL (substitua todos os valores entre `<...>` antes de
executar e nunca use uma senha em texto puro na coluna `senha`):

```sql
INSERT INTO usuarios (nome, email, senha, permissao)
VALUES ('<nome>', '<email>', '<hash-bcrypt-gerado>', 'admin');
```

## Testes

Execute os testes automatizados com:

```bash
npm test
```

Os testes validam configuração segura, proteção das rotas de cadastro,
autorização administrativa, validação de dados e armazenamento de senha com hash.