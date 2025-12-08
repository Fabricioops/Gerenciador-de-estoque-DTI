const { executeQuery } = require('../db');

// Controller simples para listar equipamentos
exports.list = async (req, res) => {
  try {
    const sql = 'SELECT * FROM Equipamentos LIMIT 500';
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
    const {
      tipo_equipamento, marca, modelo, patrimonio, numero_serie,
      status_equipamento, local_id, data_cadastro, observacao
    } = req.body;

    const sql = `INSERT INTO Equipamentos (tipo_equipamento, marca, modelo, patrimonio, numero_serie, status_equipamento, local_id, data_cadastro, observacao)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const result = await executeQuery(sql, [tipo_equipamento, marca, modelo, patrimonio, numero_serie, status_equipamento, local_id || null, data_cadastro || null, observacao || null]);

    // result pode ser um objeto OkPacket com insertId
    const insertId = result && result.insertId ? result.insertId : null;
    res.status(201).json({ id: insertId, message: 'Equipamento criado' });
  } catch (err) {
    // Retornamos a mensagem de erro no JSON apenas para depuração em dev.
    console.error('Erro create equipamento:', err);
    res.status(500).json({ message: 'Erro ao criar equipamento', error: err && err.message ? err.message : String(err) });
  }
};

// Atualiza um equipamento existente
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      tipo_equipamento, marca, modelo, patrimonio, numero_serie,
      status_equipamento, local_id, data_cadastro, observacao
    } = req.body;

    const sql = `UPDATE Equipamentos SET tipo_equipamento = ?, marca = ?, modelo = ?, patrimonio = ?, numero_serie = ?, status_equipamento = ?, local_id = ?, data_cadastro = ?, observacao = ? WHERE id = ?`;
    const result = await executeQuery(sql, [tipo_equipamento, marca, modelo, patrimonio, numero_serie, status_equipamento, local_id || null, data_cadastro || null, observacao || null, id]);

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
    const sql = 'DELETE FROM Equipamentos WHERE id = ?';
    const result = await executeQuery(sql, [id]);
    res.json({ affectedRows: result && result.affectedRows ? result.affectedRows : 0, message: 'Equipamento removido' });
  } catch (err) {
    console.error('Erro delete equipamento:', err);
    res.status(500).json({ message: 'Erro ao remover equipamento' });
  }
};
