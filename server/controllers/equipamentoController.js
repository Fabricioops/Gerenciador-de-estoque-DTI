const { executeQuery } = require('../db');

// Controller simples para listar equipamentos
exports.list = async (req, res) => {
  try {
    const sql = `
  SELECT *
  FROM Equipamentos
  WHERE excluido = 0
  ORDER BY id DESC
  LIMIT 1000
   `;
    const rows = await executeQuery(sql);
    res.json(rows);
  } catch (err) {
    console.error('Erro list equipamentos:', err);
    res.status(500).json({ message: 'Erro ao listar equipamentos' });
  }
};

// Cria um novo equipamento
exports.create = async (req, res) => {
  try {
    console.log('Create payload recebido:', req.body);
    const {
      tipo_equipamento, marca, modelo, patrimonio, numero_serie, numero_chamado,
      status_equipamento, local_id, data_cadastro, observacao, tecnico
    } = req.body;
    
    // Validação: campo `tecnico` obrigatório
    if (!tecnico || (typeof tecnico === 'string' && tecnico.trim() === '')) {
      return res.status(400).json({ message: 'O campo tecnico é obrigatório' });
    }
    const sql = `INSERT INTO Equipamentos (tipo_equipamento, marca, modelo, patrimonio, numero_serie, numero_chamado, status_equipamento, local_id, data_cadastro, observacao, tecnico)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      tipo_equipamento,
      marca,
      modelo,
      patrimonio,
      numero_serie,
      numero_chamado || null,
      status_equipamento,
      local_id || null,
      data_cadastro || null,
      observacao || null,
      tecnico && typeof tecnico === 'string' ? tecnico.trim() : tecnico
    ];
    console.log('Executando INSERT:', sql, 'params:', params);
   const result = await executeQuery(sql, params);

    // id do equipamento recém criado
   const equipamentoId = result.insertId;

   // usuário logado
   const usuarioId = req.user.id;

  // registra a entrada
  await executeQuery(
`
INSERT INTO movimentacoes
(
    equipamento_id,
    tipo_movimentacao,
    origem_id,
    destino_id,
    data_movimentacao,
    usuario_id,
    observacao
)
VALUES (?, ?, ?, ?, NOW(), ?, ?)
`,
[
    equipamentoId,
    'ENTRADA',
    null,
    local_id,
    usuarioId,
    'Cadastro do equipamento'
]);

    // result pode ser um objeto OkPacket com insertId
    const insertId = result && result.insertId ? result.insertId : null;
    res.status(201).json({ id: insertId, message: 'Equipamento criado' });
  } catch (err) {
  console.error(err);

  // 👉 tratamento de patrimônio duplicado
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'Já existe um equipamento com esse patrimônio'
    });
  }

  // 👉 erro genérico
  res.status(500).json({
    message: 'Erro interno ao salvar equipamento'
  });
}

};

// Atualiza um equipamento existente
exports.update = async (req, res) => {
  try {
  const id = req.params.id;
  const usuarioId = req.user.id;           /////  o id do usuario logado 
  // Busca o local atual antes da atualização
  // Busca todas as informações do equipamento antes de excluir
// Busca todas as informações do equipamento antes de excluir
const equipamento = await executeQuery(
  `
  SELECT
    id,
    modelo,
    patrimonio,
    local_id
  FROM Equipamentos
  WHERE id = ?
  `,
  [id]
);
console.log("Equipamento antes da exclusão:", equipamento);
    const localAntigo = equipamento.length > 0
  ? equipamento[0].local_id
  : null;
    console.log('Update payload recebido:', req.body, 'id:', id);
    const {
      tipo_equipamento, marca, modelo, patrimonio, numero_serie, numero_chamado,
      status_equipamento, local_id, data_cadastro, observacao, tecnico
    } = req.body;
    
    // Validação: campo `tecnico` obrigatório
    if (!tecnico || (typeof tecnico === 'string' && tecnico.trim() === '')) {
      return res.status(400).json({ message: 'O campo tecnico é obrigatório' });
    }
    const sql = `UPDATE Equipamentos SET tipo_equipamento = ?, marca = ?, modelo = ?, patrimonio = ?, numero_serie = ?, numero_chamado = ?, status_equipamento = ?, local_id = ?, data_cadastro = ?, observacao = ?, tecnico = ? WHERE id = ?`;
    const params = [
      tipo_equipamento,
      marca,
      modelo,
      patrimonio,
      numero_serie,
      numero_chamado || null,
      status_equipamento,
      local_id || null,
      data_cadastro || null,
      observacao || null,
      tecnico && typeof tecnico === 'string' ? tecnico.trim() : tecnico,
      id
    ];
    console.log('Executando UPDATE:', sql, 'params:', params);
    const result = await executeQuery(sql, params);              ////////////////movimentaçao captura
    // Se o local foi alterado, registra uma movimentação
if (localAntigo != local_id) {
    const usuarioId = req.user.id;  /// salvando o id do usuário logado 
await executeQuery(
`INSERT INTO movimentacoes
(
equipamento_id,
tipo_movimentacao,
origem_id,
destino_id,
data_movimentacao,
usuario_id,
observacao
)
VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
[
    id,
    'TRANSFERENCIA',
    localAntigo,
    local_id,
    usuarioId,
    null
]
);

}

    res.json({ affectedRows: result && result.affectedRows ? result.affectedRows : 0, message: 'Equipamento atualizado' });
  } catch (err) {
    console.error('Erro update equipamento:', err);
    res.status(500).json({ message: 'Erro ao atualizar equipamento' });
  }
};

// Remove um equipamento
exports.remove = async (req, res) => {
  try {

    const id = req.params.id;
    const usuarioId = req.user.id;

    // Busca o local atual do equipamento
    const equipamento = await executeQuery(
      'SELECT local_id FROM Equipamentos WHERE id = ?',
      [id]
    );

    if (equipamento.length === 0) {
      return res.status(404).json({
        message: 'Equipamento não encontrado'
      });
    }

    const localOrigem = equipamento[0].local_id;

    // Registra a movimentação de saída
    await executeQuery(
      `INSERT INTO movimentacoes
      (
        equipamento_id,
        tipo_movimentacao,
        origem_id,
        destino_id,
        data_movimentacao,
        usuario_id,
        observacao
      )
      VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
      [
        id,
        'SAIDA',
        localOrigem,
        null,
        usuarioId,
        'Equipamento excluído'
      ]
    );

    // Remove o equipamento      //soft delete - move para coluna de excluidos
    const sql = `
    UPDATE Equipamentos   
    SET excluido = 1
    WHERE id = ?
   `;

   const result = await executeQuery(sql, [id]);

    res.json({
      affectedRows: result && result.affectedRows ? result.affectedRows : 0,
      message: 'Equipamento removido'
    });

  } catch (err) {

    console.error('Erro delete equipamento:', err);

    res.status(500).json({
      message: 'Erro ao remover equipamento'
    });

  }
};