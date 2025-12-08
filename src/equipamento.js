// equipamento.js - script simples para carregar e mostrar equipamentos
// Comentários em português e direto ao ponto.

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#equip-table tbody');
  const msg = document.getElementById('msg');
  const refreshBtn = document.getElementById('refresh');
  const searchInput = document.getElementById('search');
  const back = document.getElementById('back');

  // Voltar para a página principal
  if (back) back.addEventListener('click', (e) => { /* deixa o link seguir */ });

  // Função para buscar dados do backend
  async function fetchEquipamentos() {
    msg.textContent = 'Carregando...';
    tableBody.innerHTML = '';
    try {
      const res = await fetch('http://localhost:3000/api/equipamentos');
      if (!res.ok) throw new Error('Erro ao buscar equipamentos: ' + res.status);
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('Resposta inválida do servidor');

      // Preenche tabela
      for (const r of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.id ?? ''}</td>
          <td>${r.patrimonio ?? ''}</td>
          <td>${r.modelo ?? ''}</td>
          <td>${r.marca ?? ''}</td>
          <td>${((r.tipo_equipamento ?? r.tipo) || '')}</td>
          <td>${((r.status_equipamento ?? r.status) || '')}</td>
        `;
        tableBody.appendChild(tr);
      }

      msg.textContent = rows.length + ' registros carregados';
    } catch (err) {
      console.error(err);
      msg.textContent = 'Erro: ' + (err.message || err);
    }
  }

  // Busca inicial
  fetchEquipamentos();

  // Botão atualizar
  if (refreshBtn) refreshBtn.addEventListener('click', fetchEquipamentos);

  // Pesquisa local (filtra linhas exibidas)
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = (searchInput.value || '').toLowerCase().trim();
      for (const tr of tableBody.querySelectorAll('tr')) {
        const txt = tr.textContent.toLowerCase();
        tr.style.display = q === '' || txt.includes(q) ? '' : 'none';
      }
    });
  }
});
