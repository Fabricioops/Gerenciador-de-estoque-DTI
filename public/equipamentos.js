// ===============================
// Variáveis globais
// ===============================
let equipments = [];
let filteredEquipments = [];
let currentEditingId = null;

// ===============================
// Configuração da API
// ===============================
const API_BASE_URL = 'http://localhost:3000/api';

// ===============================
// Inicialização da página
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const init = () => {
        loadUserInfo();
        setupEventListeners();
        loadEquipments();
        setDefaultDate();
    };

    // Caso exista controle de carregamento do header
    if (window.headerReady && typeof window.headerReady.then === 'function') {
        window.headerReady.then(init).catch(init);
    } else {
        init();
    }
});

// ===============================
// Usuário logado
// ===============================
function loadUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const el = document.getElementById('user-name');
        if (el && user.nome) {
            el.textContent = user.nome;
        }
        // Mostra controles de admin no frontend (botão +Status)
        try {
            const addStatusBtn = document.getElementById('add-status-btn');
            if (addStatusBtn) {
                if (user.permissao && String(user.permissao).toUpperCase() === 'ADMIN') addStatusBtn.style.display = 'inline-block';
                else addStatusBtn.style.display = 'none';
            }
        } catch (e) {}
    } catch {
        // ignora erro
    }
}

// ===============================
// Event listeners
// ===============================
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterEquipments, 300));
    }

    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.addEventListener('change', filterEquipments);

    const localFilter = document.getElementById('local-filter');
    if (localFilter) {
        localFilter.addEventListener('change', (e) => {
            if (e.target.value === '__add_local__') {
                openMetaModal('local', e.target);
            } else {
                filterEquipments();
            }
        });
    }

    const localSelect = document.getElementById('local_id');
    if (localSelect) {
        localSelect.addEventListener('change', (e) => {
            if (e.target.value === '__add_local__') {
                openMetaModal('local', e.target);
            }
        });
    }

    const form = document.getElementById('equipment-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    const addStatusBtn = document.getElementById('add-status-btn');
    if (addStatusBtn) addStatusBtn.addEventListener('click', () => openMetaModal('status', null));

    const equipmentModal = document.getElementById('equipment-modal');
    if (equipmentModal) {
        equipmentModal.addEventListener('click', e => {
            if (e.target === equipmentModal) closeModal();
        });
    }

    const detailsModal = document.getElementById('details-modal');
    if (detailsModal) {
        detailsModal.addEventListener('click', e => {
            if (e.target === detailsModal) closeDetailsModal();
        });
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeDetailsModal();
        }
    });
}

// ===============================
// Utilidades
// ===============================
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function setDefaultDate() {
    const input = document.getElementById('data_cadastro');
    if (!input) return;
    input.value = new Date().toISOString().split('T')[0];
}

// Modal / criação de meta (local / status)
let metaPendingSelect = null;

function openMetaModal(type, selectEl = null) {
    metaPendingSelect = selectEl;
    const modal = document.getElementById('meta-modal');
    const title = document.getElementById('meta-modal-title');
    const typeInput = document.getElementById('meta-type');
    const localFields = document.getElementById('meta-local-fields');
    const statusFields = document.getElementById('meta-status-fields');

    typeInput.value = type;
    if (type === 'local') {
        title.textContent = 'Adicionar Local';
        localFields.style.display = '';
        statusFields.style.display = 'none';
        document.getElementById('meta-local-nome').value = '';
    } else if (type === 'status') {
        title.textContent = 'Adicionar Status';
        localFields.style.display = 'none';
        statusFields.style.display = '';
        document.getElementById('meta-status-chave').value = '';
        document.getElementById('meta-status-label').value = '';
    }

    modal.classList.add('active');
}

function closeMetaModal() {
    const modal = document.getElementById('meta-modal');
    modal.classList.remove('active');
    // Se um select estava no estado add, reseta
    try {
        if (metaPendingSelect && metaPendingSelect.value === '__add_local__') metaPendingSelect.value = '';
    } catch (e) {}
    metaPendingSelect = null;
}

async function submitMetaForm() {
    const type = document.getElementById('meta-type').value;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.permissao || String(user.permissao).toUpperCase() !== 'ADMIN') {
        showToast('Apenas administradores podem criar', 'error');
        closeMetaModal();
        return;
    }

    if (type === 'local') {
        const nome = document.getElementById('meta-local-nome').value?.trim();
        const descricao = document.getElementById('meta-local-descricao').value?.trim();
        const campus = document.getElementById('meta-local-campus').value?.trim();
        if (!nome) return showToast('Nome do local é obrigatório', 'error');
        // tenta criar via API
        try {
            const res = await fetch(`${API_BASE_URL}/meta/locais`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ nome, descricao, campus })
            });
            if (res.ok) {
                const created = await res.json();
                addLocalOptionToSelects(created.id, created.nome || nome);
                if (metaPendingSelect) metaPendingSelect.value = String(created.id);
                showToast('Local criado', 'success');
                closeMetaModal();
                filterEquipments();
                return;
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.message || 'Erro ao criar local', 'error');
                return;
            }
        } catch (err) {
            console.warn('API create local failed', err);
            // fallback local
            const syntheticId = -Date.now();
            addLocalOptionToSelects(syntheticId, nome);
            if (metaPendingSelect) metaPendingSelect.value = String(syntheticId);
            showToast('Local adicionado localmente (sem persistência)', 'info');
            closeMetaModal();
            filterEquipments();
            return;
        }
    }

    if (type === 'status') {
        const chave = document.getElementById('meta-status-chave').value?.trim();
        const label = document.getElementById('meta-status-label').value?.trim();
        if (!chave || !label) return showToast('Chave e rótulo são obrigatórios', 'error');
        try {
            const res = await fetch(`${API_BASE_URL}/meta/statuses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ chave, label })
            });
            if (res.ok) {
                const created = await res.json();
                addStatusOptionToSelects(created.chave || chave, created.label || label);
                showToast('Status criado', 'success');
                closeMetaModal();
                return;
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.message || 'Erro ao criar status', 'error');
                return;
            }
        } catch (err) {
            console.warn('API create status failed', err);
            showToast('Falha ao criar status', 'error');
            return;
        }
    }
}

function addStatusOptionToSelects(chave, label) {
    const selectors = [document.getElementById('status-filter'), document.getElementById('status_equipamento')];
    selectors.forEach(sel => {
        if (!sel) return;
        if (Array.from(sel.options).some(o => o.value == String(chave))) return;
        const opt = document.createElement('option');
        opt.value = String(chave);
        opt.text = label;
        sel.appendChild(opt);
    });
}

function addLocalOptionToSelects(id, nome) {
    const selectors = [document.getElementById('local-filter'), document.getElementById('local_id')];
    selectors.forEach(sel => {
        if (!sel) return;
        // evita duplicatas
        if (Array.from(sel.options).some(o => o.value == String(id))) return;
        const opt = document.createElement('option');
        opt.value = String(id);
        opt.text = nome;
        // insere antes da opção de criação, se existir
        const addOpt = Array.from(sel.options).find(o => o.value === '__add_local__');
        if (addOpt) sel.insertBefore(opt, addOpt);
        else sel.appendChild(opt);
    });
}

// ===============================
// API / Dados
// ===============================
async function loadEquipments() {
    showLoading(true);
    try {
        const res = await fetch(`${API_BASE_URL}/equipamentos`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!res.ok) throw new Error('Erro ao buscar equipamentos');

       equipments = await res.json();
filteredEquipments = [...equipments];
renderEquipments();


    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar equipamentos', 'error');
        showEmptyState(true);
    } finally {
        showLoading(false);
    }
}

// ===============================
// Renderização
// ===============================
function renderEquipments() {
    const grid = document.getElementById('equipment-grid');
    if (!grid) return;

    if (!filteredEquipments.length) {
        showEmptyState(true);
        return;
    }

    showEmptyState(false);

    grid.innerHTML = filteredEquipments.map(eq => {
        const statusClass = (eq.status_equipamento || '').toLowerCase();
        const marcaModelo = `${eq.marca || ''} ${eq.modelo || ''}`.trim();

        return `
            <div class="equipment-card" onclick="showDetails(${eq.id})">
                <div class="card-header">
                    <div>
                        <div class="equipment-type">${eq.tipo_equipamento || ''}</div>
                        <div class="equipment-brand">${marcaModelo}</div>
                    </div>
                    <div class="card-actions">
                        <button class="action-btn edit"
                            onclick="event.stopPropagation(); editEquipment(${eq.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete"
                            onclick="event.stopPropagation(); deleteEquipment(${eq.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="card-info">
                    <div><strong>Patrimônio:</strong> ${eq.patrimonio || 'S/P'}</div>
                    <div><strong>Nº Série:</strong> ${eq.numero_serie || 'N/A'}</div>
                    <div>
                        <span class="status-badge status-${statusClass}">
                            ${getStatusLabel(eq.status_equipamento)}
                        </span>
                    </div>
                    <div><strong>Local:</strong> ${getLocalName(eq.local_id)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===============================
// Filtros
// ===============================
function filterEquipments() {
    const search = (document.getElementById('search-input')?.value || '').toLowerCase();
    const status = document.getElementById('status-filter')?.value || '';
    const local = document.getElementById('local-filter')?.value || '';

        filteredEquipments = equipments.filter(eq => {
                const matchesSearch =
                        !search ||
                        (eq.tipo_equipamento || '').toLowerCase().includes(search) ||
                        (eq.marca || '').toLowerCase().includes(search) ||
                        (eq.modelo || '').toLowerCase().includes(search) ||
                        (eq.patrimonio && String(eq.patrimonio).toLowerCase().includes(search)) ||
                        (eq.numero_serie && String(eq.numero_serie).toLowerCase().includes(search)) ||
                        (eq.numero_chamado && String(eq.numero_chamado).toLowerCase().includes(search)) ||
                        (eq.tecnico || '').toLowerCase().includes(search);

                    const matchesStatus = !status || eq.status_equipamento === status;
                    const matchesLocal = !local || (eq.local_id != null && String(eq.local_id) === local);

                return matchesSearch && matchesStatus && matchesLocal;
        });

    renderEquipments();
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('local-filter').value = '';
    filteredEquipments = [...equipments];
    renderEquipments();
}

// ===============================
// Modais
// ===============================
function openAddModal() {
    currentEditingId = null;
    document.getElementById('equipment-form').reset();
    setDefaultDate();
    document.getElementById('equipment-modal').classList.add('active');
    document.getElementById('modal-title').innerHTML =
  '<i class="fas fa-plus"></i> Novo Equipamento';

};

function editEquipment(id) {
   const eq =
  equipments.find(e => e.id === id) ||
  filteredEquipments.find(e => e.id === id);
    

    currentEditingId = id;

    document.getElementById('equipment-id').value = eq.id;
    document.getElementById('tipo_equipamento').value = eq.tipo_equipamento || '';
    document.getElementById('marca').value = eq.marca || '';
    document.getElementById('modelo').value = eq.modelo || '';
    document.getElementById('patrimonio').value = eq.patrimonio || '';
    document.getElementById('numero_serie').value = eq.numero_serie || '';
    document.getElementById('numero_chamado').value = eq.numero_chamado || '';
    document.getElementById('status_equipamento').value = eq.status_equipamento || '';
    document.getElementById('local_id').value = eq.local_id || '';
    document.getElementById('tecnico').value = eq.tecnico || '';
    document.getElementById('observacao').value = eq.observacao || '';

    document.getElementById('equipment-modal').classList.add('active');
    document.getElementById('modal-title').innerHTML =
  '<i class="fas fa-edit"></i> Editar Equipamento';

}

function closeModal() {
    document.getElementById('equipment-modal')?.classList.remove('active');
}

function closeDetailsModal() {
    document.getElementById('details-modal')?.classList.remove('active');
}

// ===============================
// Form helpers
// ===============================
function resetForm() {
    const form = document.getElementById('equipment-form');
    if (form) form.reset();

    const idEl = document.getElementById('equipment-id');
    if (idEl) idEl.value = '';

    currentEditingId = null;

    // garante que a data de cadastro volte ao padrão
    try { setDefaultDate(); } catch (e) { /* ignore */ }
}

// ===============================
// Detalhes
// ===============================
function showDetails(id) {
    const eq = equipments.find(e => e.id === id);
    if (!eq) return;

    window.lastSelectedEquipmentId = id; // 🔴 ESSENCIAL

    const el = document.getElementById('equipment-details');
    const safe = v => (v === null || v === undefined || v === '') ? '<span class="details-value null">n/a</span>' : `<span class="details-value">${v}</span>`;

    el.innerHTML = `
        <div class="details-row">
            <div class="details-label">Tipo:</div>
            ${safe(eq.tipo_equipamento)}
        </div>
        <div class="details-row">
            <div class="details-label">Marca:</div>
            ${safe(eq.marca)}
        </div>
        <div class="details-row">
            <div class="details-label">Modelo:</div>
            ${safe(eq.modelo)}
        </div>
        <div class="details-row">
            <div class="details-label">Status:</div>
            <span class="details-value">${getStatusLabel(eq.status_equipamento)}</span>
        </div>
        <div class="details-row">
            <div class="details-label">Local:</div>
            <span class="details-value">${getLocalName(eq.local_id)}</span>
        </div>
        <div class="details-row">
            <div class="details-label">Número do Chamado:</div>
            ${safe(eq.numero_chamado)}
        </div>
        <div class="details-row">
            <div class="details-label">Técnico:</div>
            ${safe(eq.tecnico)}
        </div>
        <div class="details-row">
            <div class="details-label">Obs:</div>
            ${safe(eq.observacao)}
        </div>
    `;

    document.getElementById('details-modal').classList.add('active');
}


// ===============================
// CRUD
// ===============================
async function handleFormSubmit(e) {
  e.preventDefault();

    const get = id => document.getElementById(id);
    // Validação cliente: técnico obrigatório
    const tecnicoVal = get('tecnico')?.value ? get('tecnico').value.trim() : '';
    if (!tecnicoVal) {
        showToast('O campo Técnico é obrigatório', 'error');
        get('tecnico')?.focus();
        return;
    }

    const payload = {
        tipo_equipamento: get('tipo_equipamento')?.value || '',
        marca: get('marca')?.value || '',
        modelo: get('modelo')?.value || '',
        patrimonio: get('patrimonio')?.value || '',
        numero_serie: get('numero_serie')?.value || '',
        numero_chamado: get('numero_chamado')?.value || '',
        status_equipamento: get('status_equipamento')?.value || '',
        local_id: get('local_id')?.value ? Number(get('local_id').value) : null,
        data_cadastro: get('data_cadastro')?.value || null,
        observacao: get('observacao')?.value || '',
        tecnico: tecnicoVal
    };

  try {
        console.log('Payload enviado:', payload);
    const method = currentEditingId ? 'PUT' : 'POST';
    const url = currentEditingId
      ? `${API_BASE_URL}/equipamentos/${currentEditingId}`
      : `${API_BASE_URL}/equipamentos`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Erro ao salvar equipamento');
    }

    // ✅ LIMPA FILTROS (ESSENCIAL)
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('local-filter').value = '';

    // ✅ RECARREGA LISTA DO BACKEND
    await loadEquipments();

    // ✅ FECHA MODAL / FORM
    closeModal();
    resetForm();

    showToast(
      currentEditingId ? 'Equipamento atualizado com sucesso' : 'Equipamento criado com sucesso',
      'success'
    );

    currentEditingId = null;

  } catch (err) {
    console.error(err);
    showToast(err.message || 'Erro ao salvar equipamento', 'error');
  }
}


async function deleteEquipment(id) {
    if (!confirm('Confirma exclusão?')) return;

    try {
        await fetch(`${API_BASE_URL}/equipamentos/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        showToast('Equipamento excluído');
        loadEquipments();
    } catch {
        showToast('Erro ao excluir', 'error');
    }
}

function editFromDetails() {
    if (!window.lastSelectedEquipmentId) return;

    closeDetailsModal();
    editEquipment(window.lastSelectedEquipmentId);
}


// ===============================
// UI helpers
// ===============================
function showLoading(show) {
    const el = document.getElementById('loading');
    if (el) el.style.display = show ? 'block' : 'none';
}

function showEmptyState(show) {
    document.getElementById('empty-state').style.display = show ? 'block' : 'none';
    document.getElementById('equipment-grid').style.display = show ? 'none' : 'grid';
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function getStatusLabel(status) {
    return {
        FUNCIONANDO: 'Funcionando',
        PARA_DESCARTE: 'Para Descarte',
        INVENTARIADO: 'Inventariado',
        QUEIMADO: 'Queimado'
    }[status] || 'Desconhecido';
}

function getLocalName(id) {
    return {
        1: 'Descarte Farolândia',
        2: 'Lixo Eletrônico B54',
        3: 'D13',
        4: 'Inventariado Centro'
    }[id] || 'Desconhecido';
}
