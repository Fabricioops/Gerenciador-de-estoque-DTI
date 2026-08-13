const { executeQuery } = require('../db');

exports.listarMovimentacoes = async (req, res) => {
    try {

        const sql = `
            SELECT
    m.id,
    m.data_movimentacao,
    m.tipo_movimentacao,
    e.patrimonio,
    e.modelo,

    l1.nome AS origem,
    l2.nome AS destino,

    u.nome AS tecnico,

    m.observacao

    FROM movimentacoes m

    LEFT JOIN equipamentos e
    ON m.equipamento_id = e.id

    LEFT JOIN locais l1
    ON m.origem_id = l1.id

    LEFT JOIN locais l2
    ON m.destino_id = l2.id

    LEFT JOIN usuarios u
    ON m.usuario_id = u.id

    ORDER BY m.data_movimentacao DESC;
    `;

        const movimentacoes = await executeQuery(sql);

        res.status(200).json(movimentacoes);

    } catch (error) {

        console.error('Erro ao buscar movimentações:', error);

        res.status(500).json({
            message: 'Erro ao buscar movimentações'
        });

    }
};