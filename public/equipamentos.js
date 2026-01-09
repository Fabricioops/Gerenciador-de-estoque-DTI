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
    if (localFilter) localFilter.addEventListener('change', filterEquipments);

    const form = document.getElementById('equipment-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

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
            (eq.numero_serie && String(eq.numero_serie).toLowerCase().includes(search));

        const matchesStatus = !status || eq.status_equipamento === status;
        const matchesLocal = !local || String(eq.local_id) === local;

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
}

function editEquipment(id) {
    const eq = equipments.find(e => e.id === id);
    if (!eq) return;

    currentEditingId = id;

    document.getElementById('equipment-id').value = eq.id;
    document.getElementById('tipo_equipamento').value = eq.tipo_equipamento || '';
    document.getElementById('marca').value = eq.marca || '';
    document.getElementById('modelo').value = eq.modelo || '';
    document.getElementById('patrimonio').value = eq.patrimonio || '';
    document.getElementById('numero_serie').value = eq.numero_serie || '';
    document.getElementById('status_equipamento').value = eq.status_equipamento || '';
    document.getElementById('local_id').value = eq.local_id || '';
    document.getElementById('observacao').value = eq.observacao || '';

    document.getElementById('equipment-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('equipment-modal')?.classList.remove('active');
}

function closeDetailsModal() {
    document.getElementById('details-modal')?.classList.remove('active');
}

// ===============================
// Detalhes
// ===============================
function showDetails(id) {
    const eq = equipments.find(e => e.id === id);
    if (!eq) return;

    const el = document.getElementById('equipment-details');
    el.innerHTML = `
        <div><strong>Tipo:</strong> ${eq.tipo_equipamento}</div>
        <div><strong>Marca:</strong> ${eq.marca}</div>
        <div><strong>Modelo:</strong> ${eq.modelo}</div>
        <div><strong>Status:</strong> ${getStatusLabel(eq.status_equipamento)}</div>
        <div><strong>Local:</strong> ${getLocalName(eq.local_id)}</div>
        <div><strong>Obs:</strong> ${eq.observacao || ''}</div>
    `;

    document.getElementById('details-modal').classList.add('active');
}

// ===============================
// CRUD
// ===============================
async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
        tipo_equipamento: tipo_equipamento.value,
        marca: marca.value,
        modelo: modelo.value,
        patrimonio: patrimonio.value,
        numero_serie: numero_serie.value,
        status_equipamento: status_equipamento.value,
        local_id: Number(local_id.value),
        data_cadastro: data_cadastro.value,
        observacao: observacao.value
    };

    showToast('Salvo com sucesso');
    closeModal();
    loadEquipments();
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
