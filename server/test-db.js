// Script de teste atualizado para usar o wrapper MySQL do projeto
// Explicação das alterações:
// - O script usa `connectDB` e `executeQuery` do módulo `server/db.js` para
//   validar que a conexão com o MySQL está funcionando e que a tabela
//   `Equipamentos` pode ser consultada.
// - Serve apenas para desenvolvimento/diagnóstico; não faz alterações no banco.
const { connectDB, executeQuery } = require('./db');

(async () => {
  try {
    console.log('Conectando ao MySQL...');
    await connectDB();

    // Ping simples
    const ping = await executeQuery('SELECT 1 AS ok');
    console.log('Ping result:', ping);

    // Tenta consultar a tabela Equipamentos (se existir)
    try {
      const rows = await executeQuery('SELECT * FROM Equipamentos LIMIT 5');
      console.log('Dados Equipamentos (até 5):', rows);
    } catch (err) {
      console.warn('Não foi possível consultar a tabela Equipamentos (pode não existir):', err.message || err);
    }

    process.exit(0);
  } catch (err) {
    console.error('Erro ao testar conexão MySQL:', err);
    process.exit(1);
  }
})();
