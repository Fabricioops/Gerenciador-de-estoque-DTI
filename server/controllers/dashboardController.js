// Controle de dashboard: expõe endpoints para obter dados usados pelos gráficos
// e pelos cards no frontend. Essas rotas foram criadas para preencher os
// gráficos que antes apareciam vazios no dashboard.
// Endpoints adicionados:
//  - GET /api/dashboard/equipamentos/category  -> [{ category, count }, ...]
//  - GET /api/dashboard/equipamentos/status    -> [{ status, count }, ...]
//  - GET /api/dashboard/summary                 -> { total }
// Cada função abaixo realiza uma consulta SQL ao MySQL usando executeQuery.
const { executeQuery } = require('../db');

exports.getCategoryCounts = async (req, res) => {
  try {
    const sql = `SELECT tipo_equipamento AS category, COUNT(*) AS count FROM Equipamentos GROUP BY tipo_equipamento`;
    const rows = await executeQuery(sql); // mandou a consulta pro banco espera resposta
    res.json(rows);
  } catch (err) {
    console.error('Erro getCategoryCounts:', err);
    res.status(500).json({ message: 'Erro ao obter contagem por categoria' });
  }
};

exports.getStatusCounts = async (req, res) => {
  try {
    const sql = `SELECT status_equipamento AS status, COUNT(*) AS count FROM Equipamentos GROUP BY status_equipamento`;
    const rows = await executeQuery(sql);
    res.json(rows);
  } catch (err) {
    console.error('Erro getStatusCounts:', err);
    res.status(500).json({ message: 'Erro ao obter contagem por status' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const totalRows = await executeQuery('SELECT COUNT(*) AS total FROM Equipamentos');
    const total = totalRows && totalRows[0] ? totalRows[0].total : 0;
    res.json({ total });
  } catch (err) {
    console.error('Erro getSummary:', err);
    res.status(500).json({ message: 'Erro ao obter summary' });
  }
};

// Retorna contagens úteis para os cards: total (itens em estoque) e itens para descarte.
exports.getCounts = async (req, res) => {
  try {
    // total
    const totalRows = await executeQuery('SELECT COUNT(*) AS total FROM Equipamentos');
    const total = totalRows && totalRows[0] ? totalRows[0].total : 0;

    // contador de itens para descarte: tentamos identificar pela coluna de status
    // que contenha a palavra 'DESCART' (ex: 'PARA DESCARTE', 'DESCARTE').
    // Ajuste a condição caso seu banco use outro termo.
    const discardRows = await executeQuery("SELECT COUNT(*) AS discard FROM Equipamentos WHERE status_equipamento LIKE '%DESCART%'");
    const discard = discardRows && discardRows[0] ? discardRows[0].discard : 0;

    res.json({ total, inStock: total, discard });
  } catch (err) {
    console.error('Erro getCounts:', err);
    res.status(500).json({ message: 'Erro ao obter contagens' });
  }
};
