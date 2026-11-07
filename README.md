# Gerenciador de Estoque DTI

Aplicação web para controlar o inventário de equipamentos de TI, seus locais,
status e movimentações. O projeto reúne uma interface em HTML, CSS e JavaScript
com uma API Node.js/Express e banco de dados MySQL.

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias e arquitetura](#tecnologias-e-arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Requisitos](#requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Configuração](#configuração)
- [Acesso inicial e usuários](#acesso-inicial-e-usuários)
- [Telas da aplicação](#telas-da-aplicação)
- [API HTTP](#api-http)
- [Banco de dados](#banco-de-dados)
- [Testes e diagnóstico](#testes-e-diagnóstico)
- [Produção e segurança](#produção-e-segurança)
- [Limitações conhecidas](#limitações-conhecidas)
- [Solução de problemas](#solução-de-problemas)

## Funcionalidades

- Autenticação de usuários por email e senha, com token JWT.
- Perfis de acesso de técnico (`padrao`) e administrador (`admin`).
- Cadastro, consulta, edição e exclusão lógica de equipamentos.
- Pesquisa e filtros de equipamentos por texto, status e local.
- Cadastro administrativo de locais e status.
- Registro de entradas, transferências e saídas no histórico de movimentações.
- Dashboard com totais, itens para descarte e gráficos por categoria e status.
- Filtros de movimentações por período, tipo e texto.
- Cadastro de usuários disponível somente para administradores autenticados.

## Tecnologias e arquitetura

- **Servidor:** Node.js, Express 5 e CommonJS.
- **Banco de dados:** MySQL, acessado pelo pool `mysql2/promise`.
- **Autenticação:** JSON Web Token (`jsonwebtoken`).
- **Senhas:** hash bcrypt (`bcryptjs`).
- **Interface:** HTML, CSS e JavaScript sem framework.
- **Gráficos:** Chart.js carregado por CDN na tela inicial.
- **Testes:** runner nativo `node:test`.

O Express serve os arquivos estáticos de `public/` e a API na mesma origem,
normalmente `http://localhost:3000`. As rotas da API são montadas em `/api`.
O servidor tenta conectar ao banco antes de começar a escutar requisições.

## Estrutura do projeto

```text
.
├── public/                     # Interface e arquivos estáticos
│   ├── index.html              # Login e dashboard
│   ├── equipamentos.html       # Gerenciamento de equipamentos
│   ├── movimentacoes.html      # Histórico de movimentações
│   ├── cadastro-usuario.html   # Formulário administrativo de usuários
│   ├── header.html             # Cabeçalho compartilhado
│   ├── *.css                   # Estilos das telas
│   ├── *.js                    # Lógica das telas
│   └── src/                    # Páginas auxiliares/legadas
├── server/
│   ├── index.js                # Inicialização do Express e rotas
│   ├── config.js               # Leitura e validação de configuração
│   ├── db.js                   # Pool MySQL e execução de consultas
│   ├── controllers/            # Regras dos endpoints
│   ├── middleware/             # Autenticação e autorização
│   ├── routes/                 # Mapeamento de endpoints
│   ├── gerarHash.js            # Utilitário para gerar hash de senha
│   └── *.test.js               # Testes automatizados
├── .env.example                # Exemplo local de variáveis de ambiente
├── package.json                # Scripts e dependências
└── README.md                   # Esta documentação
```

## Requisitos

- Node.js com suporte a `node:test` (Node.js 18 ou superior recomendado).
- npm.
- MySQL acessível pela máquina que executa a aplicação.
- Um banco já criado e com as tabelas principais preparadas (consulte
  [Banco de dados](#banco-de-dados)).

## Instalação e execução

Na raiz do repositório:

```bash
npm install
cp .env.example .env
```

Edite `.env` com os dados do seu ambiente e inicie a aplicação:

```bash
npm start
```

Quando a conexão com o MySQL for estabelecida, o servidor ficará disponível em:

- Aplicação: <http://localhost:3000/>
- Equipamentos: <http://localhost:3000/equipamentos.html>
- Movimentações: <http://localhost:3000/movimentacoes.html>
- Cadastro de usuário: <http://localhost:3000/cadastro-usuario.html>

Use o endereço servido pelo Express. As páginas fazem chamadas à API na mesma
origem ou, em alguns scripts existentes, diretamente a `localhost:3000`; abrir
os arquivos por `file://` ou servi-los em outra porta não é o fluxo suportado.

## Configuração

O servidor exige as variáveis abaixo. O arquivo `.env.example` contém valores
apenas para facilitar a configuração local; substitua-os pelos valores do seu
ambiente e não os reutilize em produção.

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `NODE_ENV` | Não | Ambiente da aplicação, por exemplo `development` ou `production`. |
| `DB_HOST` | Sim | Host ou endereço do servidor MySQL. |
| `DB_USER` | Sim | Usuário MySQL. |
| `DB_PASSWORD` | Sim | Senha do usuário MySQL. |
| `DB_NAME` | Sim | Nome do banco de dados. |
| `DB_CONN_LIMIT` | Não | Limite de conexões do pool; padrão `10`. |
| `DB_CONNECT_TIMEOUT` | Não | Tempo limite de conexão em milissegundos; padrão `10000`. |
| `JWT_SECRET` | Sim | Segredo para assinatura dos tokens; deve ter ao menos 32 caracteres. |

`DB_HOST`, `DB_USER` e `DB_NAME` não podem estar vazios. `DB_PASSWORD` é
obrigatória, mas pode ser vazia caso a configuração local do MySQL assim exija.
O segredo JWT é validado no carregamento dos módulos que o utilizam; se estiver
ausente ou tiver menos de 32 caracteres, a aplicação não inicia corretamente.

Gere um segredo aleatório para o ambiente e armazene-o em um gerenciador de
segredos. Não publique `.env` nem inclua credenciais ou segredos reais no
repositório. A porta da aplicação está definida como `3000` em
`server/index.js`; não há configuração de porta por variável de ambiente.

## Acesso inicial e usuários

O cadastro público está desativado. As rotas de criação de usuários requerem
token válido e perfil administrativo. Para provisionar o primeiro administrador:

1. Configure o banco e as variáveis de ambiente.
2. Gere um hash bcrypt de uma senha com pelo menos 12 caracteres:

   ```bash
   node server/gerarHash.js
   ```

   O utilitário solicita a senha sem exibi-la enquanto é digitada e imprime o
   hash. Também aceita uma senha pela entrada padrão.
3. Insira manualmente o primeiro administrador no banco por um procedimento
   administrativo seguro, usando o hash gerado no campo `senha`:

   ```sql
   INSERT INTO usuarios (nome, email, senha, permissao)
   VALUES ('<nome>', '<email>', '<hash-bcrypt-gerado>', 'admin');
   ```
4. Entre pela tela inicial. Depois do login, um administrador pode criar outros
   usuários pela tela **Usuários**.

Nunca grave senha em texto puro na coluna `senha`. Senhas criadas pela API são
armazenadas com bcrypt e custo 10. A senha enviada no cadastro pela API deve ter
no mínimo 12 caracteres.

## Telas da aplicação

### Login e dashboard

A rota `/` apresenta o formulário de login e, após autenticar, exibe o dashboard.
O dashboard apresenta total de equipamentos ativos, itens cujo status contém
`DESCART` e gráficos de contagem por tipo e por status. Os dados são atualizados
periodicamente enquanto a tela está visível.

O navegador guarda o token e os dados básicos do usuário em `localStorage` para
enviar credenciais nas chamadas protegidas e manter o estado entre páginas.
O token JWT expira em 8 horas.

### Equipamentos

Em `/equipamentos.html`, usuários autenticados podem pesquisar e filtrar
equipamentos, abrir detalhes, cadastrar, editar e solicitar exclusão. Os campos
enviados para a API são:

- `tipo_equipamento`, `marca`, `modelo`, `patrimonio`, `numero_serie`
- `numero_chamado`, `status_equipamento`, `local_id`
- `data_cadastro`, `observacao`, `tecnico`

O campo `tecnico` é obrigatório também no servidor. Os valores de status
predefinidos na interface são `FUNCIONANDO`, `PARA_DESCARTE`, `DESCARTE`,
`INVENTARIADO` e `QUEIMADO`. Administradores podem cadastrar novos locais e
status.

### Movimentações

Em `/movimentacoes.html`, o histórico pode ser filtrado por intervalo de datas,
tipo (`ENTRADA`, `SAIDA`, `TRANSFERENCIA`) e texto relacionado ao equipamento,
origem, destino, técnico ou observação. O filtro é aplicado no navegador sobre
os registros retornados pela API.

### Usuários

Em `/cadastro-usuario.html`, administradores podem cadastrar usuários com nome,
email, senha e permissão. A página oculta a opção para criar administrador
quando não há usuário administrativo local; o controle efetivo de autorização é
feito também pela API.

### Páginas auxiliares

`/src/equipamentos.html` é uma tela auxiliar/legada de listagem simples. O
dashboard principal está embutido em `/` e `/src/dashboard.html` é apenas um
fallback estático.

## API HTTP

Todas as rotas abaixo são montadas sob `/api`. Nas rotas protegidas, envie:

```http
Authorization: Bearer <token>
```

Corpos JSON devem usar `Content-Type: application/json`. As respostas de erro
normalmente contêm um objeto `{ "message": "..." }`.

### Autenticação — `/api/auth`

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `POST /login` | Público | Autentica com `{ "email": "...", "senha": "..." }`. Retorna token e dados básicos do usuário. |
| `GET /me` | Token | Retorna o conteúdo do usuário associado ao token. |
| `POST /register` | Administrador | Cria usuário com `{ "nome", "email", "password", "permissao" }`. |
| `POST /users` | Administrador | Mesmo fluxo de criação de usuário de `/register`. |

Permissões reconhecidas como administrador incluem `admin`, `administrador`,
`adm` e `1`. A permissão de técnico/padrão é armazenada como `padrao`.

### Equipamentos — `/api/equipamentos`

Todas as rotas exigem token válido.

| Método e caminho | Descrição |
|---|---|
| `GET /` | Lista até 1000 equipamentos não excluídos, em ordem decrescente de ID. |
| `POST /` | Cria equipamento e registra uma movimentação de entrada. |
| `PUT /:id` | Atualiza os dados do equipamento; se o local mudar, registra transferência. |
| `DELETE /:id` | Registra saída e marca o equipamento como excluído, sem apagar seu registro. |

As operações `POST` e `PUT` recebem os campos de equipamento descritos em
[Equipamentos](#equipamentos). Patrimônio duplicado retorna `409`; equipamento
inexistente retorna `404`. A exclusão lógica usa `equipamentos.excluido = 1`.

### Dashboard — `/api/dashboard`

Todas as rotas exigem token válido.

| Método e caminho | Resposta/descrição |
|---|---|
| `GET /counts` | `{ "total": número, "inStock": número, "discard": número }`. |
| `GET /summary` | `{ "total": número }`. |
| `GET /equipamentos/category` | Lista `{ "category": tipo, "count": número }`. |
| `GET /equipamentos/status` | Lista `{ "status": status, "count": número }`. |

As contagens ignoram equipamentos marcados como excluídos. A contagem para
descarte identifica status que contenham o texto `DESCART`.

### Metadados — `/api/meta`

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `GET /locais` | Público | Lista locais em ordem alfabética. |
| `POST /locais` | Administrador | Cria local com `nome` e, opcionalmente, `descricao` e `campus`. |
| `GET /statuses` | Público | Lista status cadastrados. |
| `POST /statuses` | Administrador | Cria status com `chave` e `label`. |

As listas são usadas para preencher filtros e formulários. A API cria as tabelas
`locais` e `statuses` caso ainda não existam; a criação requer permissões DDL
adequadas para o usuário do banco.

### Movimentações — `/api/movimentacoes`

| Método e caminho | Acesso | Descrição |
|---|---|---|
| `GET /` | Token | Lista o histórico, do mais recente ao mais antigo, com dados do equipamento, origem, destino e usuário. |

A API não oferece endpoints para editar ou apagar movimentações. Entradas,
transferências e saídas são geradas junto às operações de equipamento.

## Banco de dados

O projeto usa MySQL e consultas parametrizadas para os valores enviados à API.
Não há migrações nem criação automática das tabelas principais; prepare-as antes
de iniciar a aplicação. O código pressupõe que existam:

### `usuarios`

Campos usados: `id`, `nome`, `email`, `senha` e `permissao`. `email` deve ser
único para evitar cadastros duplicados. A coluna `senha` guarda o hash bcrypt.

### `equipamentos`

Campos usados: `id`, `tipo_equipamento`, `marca`, `modelo`, `patrimonio`,
`numero_serie`, `numero_chamado`, `status_equipamento`, `local_id`,
`data_cadastro`, `observacao`, `tecnico` e `excluido`. O código espera que
`excluido` use `0` para ativo e `1` para excluído. O tratamento de duplicidade
de patrimônio pressupõe uma restrição de unicidade no banco.

### `movimentacoes`

Campos usados: `id`, `equipamento_id`, `tipo_movimentacao`, `origem_id`,
`destino_id`, `data_movimentacao`, `usuario_id` e `observacao`. As consultas
relacionam `origem_id` e `destino_id` com `locais`, `equipamento_id` com
`equipamentos` e `usuario_id` com `usuarios`.

### `locais` e `statuses`

São criadas sob demanda por `GET` ou `POST` em `/api/meta`. `locais` usa
`id`, `nome`, `descricao`, `campus` e `created_at`; `nome` é único. `statuses`
usa `id`, `chave`, `label` e `created_at`; `chave` é única.

As definições completas de tipos, nulabilidade, chaves estrangeiras e índices
das tabelas principais não estão versionadas neste repositório. Ajuste o schema
à sua instalação e mantenha os campos consultados pelo código. A ordem de
registro de alterações e movimentações também não está protegida por uma
transação explícita no código atual.

## Testes e diagnóstico

Execute os testes automatizados:

```bash
npm test
```

O script atual executa os testes de configuração, autenticação, middleware de
autorização e rotas de autenticação. Ele não executa testes de integração com
um banco de dados real nem testes de interface.

Para verificar conectividade e fazer uma consulta diagnóstica:

```bash
node server/test-db.js
```

Esse utilitário tenta conectar ao MySQL, executa `SELECT 1` e tenta consultar
até cinco registros da tabela `Equipamentos`. A segunda consulta é apenas
diagnóstica: a tabela pode não existir com esse nome/capitalização na instalação.

## Produção e segurança

- Configure `NODE_ENV=production` e injete variáveis de ambiente por um
  gerenciador de segredos.
- Use HTTPS e restrinja o acesso de rede ao servidor e ao MySQL.
- Troque todos os valores de exemplo; nunca versione `.env`.
- Use `JWT_SECRET` aleatório e exclusivo, com no mínimo 32 caracteres.
- Não habilite cadastro público. O cadastro de usuários requer token e
  permissão administrativa.
- Use senhas fortes; a API exige no mínimo 12 caracteres e salva hash bcrypt.
- Faça backups regulares do banco, incluindo o histórico de movimentações.
- Restrinja as permissões do usuário MySQL ao necessário; a criação automática
  de `locais` e `statuses` requer privilégio para criar tabelas.
- O middleware CORS está configurado sem uma lista explícita de origens. Em
  produção, revise essa política e configure-a conforme a origem autorizada.

## Limitações conhecidas

- A porta do servidor é fixa em `3000`.
- Alguns scripts do navegador usam URLs absolutas para `http://localhost:3000`;
  para publicar em outro host, ajuste a configuração de API no frontend.
- As tabelas principais do banco precisam ser provisionadas externamente; o
  repositório não contém migrações nem dados iniciais.
- Os filtros do histórico são aplicados no cliente após carregar todos os
  registros de movimentação.
- A sessão é mantida pelo navegador com `localStorage`; sair remove o token e os
  dados locais do usuário.
- Chart.js e Font Awesome são obtidos por CDN; a disponibilidade das telas que
  os usam depende do acesso a esses serviços externos.
- A gravação de equipamento e sua movimentação correspondente usa consultas
  separadas, sem transação explícita.

## Solução de problemas

### O servidor não inicia

- Confira se todas as variáveis obrigatórias estão definidas e se `JWT_SECRET`
  tem ao menos 32 caracteres.
- Verifique host, usuário, senha, nome do banco e disponibilidade do MySQL.
- Confirme que as tabelas principais e os campos esperados existem.
- O servidor só começa a escutar depois de validar a conexão com o banco.

### Login não funciona

- Confirme que o usuário existe em `usuarios` e que `senha` contém um hash
  bcrypt válido, não a senha em texto puro.
- Confira a permissão (`admin` ou `padrao`) e os dados de conexão do banco.
- Gere tokens usando a configuração atual de `JWT_SECRET`; trocar o segredo
  invalida tokens já emitidos.

### A API responde `401` ou `403`

- Para `401`, confira o cabeçalho `Authorization: Bearer <token>` e se o token
  ainda está dentro das 8 horas de validade.
- Para `403`, a operação exige perfil administrativo.
- Faça login novamente se o token expirou ou foi invalidado.

### Locais/status não aparecem ou não podem ser criados

- Verifique se o servidor consegue executar DDL para criar `locais` e `statuses`.
- Para criar registros, faça a requisição com token de administrador.
- Consulte os logs do servidor para identificar erros de permissão ou conexão.
