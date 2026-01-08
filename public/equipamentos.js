// Variáveis globais
let equipments = [];
let filteredEquipments = [];
let currentEditingId = null;

// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Inicialização da página
// Inicialização da página — aguarda injeção do header se disponível
document.addEventListener('DOMContentLoaded', function() {
    const init = () => {
        loadUserInfo();
        loadEquipments();
        setupEventListeners();
        setDefaultDate();
    };

    if (window.headerReady && typeof window.headerReady.then === 'function') {
        window.headerReady.then(init).catch(init);
    } else {
        init();
    }
});

// Carrega informações do usuário logado
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
        const el = document.getElementById('user-name');
        if (user.nome && el) {
            el.textContent = user.nome;
        }
    } catch (e) {
        // elemento ainda não disponível — silenciosamente ignorar
    }
}

// Configura os event listeners
function setupEventListeners() {
    // Busca em tempo real
    document.getElementById('search-input').addEventListener('input', debounce(filterEquipments, 300));
    
    // Filtros
    document.getElementById('status-filter').addEventListener('change', filterEquipments);
    document.getElementById('local-filter').addEventListener('change', filterEquipments);
    
    // Formulário de equipamento
    document.getElementById('equipment-form').addEventListener('submit', handleFormSubmit);
    
    // Fechar modais ao clicar fora
    document.getElementById('equipment-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('details-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDetailsModal();
    });
    
    // Tecla ESC para fechar modais
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeDetailsModal();
        }
    });
}

// Define data padrão como hoje
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data_cadastro').value = today;
}

// Função debounce para otimizar a busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Carrega equipamentos da API
async function loadEquipments() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/equipamentos`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar equipamentos');
        }
        
        equipments = await response.json();
        filteredEquipments = [...equipments];
        renderEquipments();
        
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        showToast('Erro ao carregar equipamentos', 'error');
        showEmptyState(true);
    } finally {
        showLoading(false);
    }
}

// Renderiza os equipamentos na tela
function renderEquipments() {
    const grid = document.getElementById('equipment-grid');
    
    if (filteredEquipments.length === 0) {
        showEmptyState(true);
        return;
    }
    
    showEmptyState(false);
    
    grid.innerHTML = filteredEquipments.map(equipment => `
        <div class="equipment-card" onclick="showDetails(${equipment.id})">
            <div class="card-header">
                <div>
                    <div class="equipment-type">${equipment.tipo_equipamento}</div>
                    <div class="equipment-brand">${equipment.marca} ${equipment.modelo}</div>
                </div>
                <div class="card-actions">
                    <button class="action-btn edit" onclick="event.stopPropagation(); editEquipment(${equipment.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteEquipment(${equipment.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="card-info">
                <div class="info-item">
                    <div class="info-label">Patrimônio</div>
                    <div class="info-value">${equipment.patrimonio || 'S/P'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Número de Série</div>
                    <div class="info-value">${equipment.numero_serie || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                        <span class="status-badge status-${equipment.status_equipamento.toLowerCase()}">
                            <i class="fas fa-circle"></i>
                            ${getStatusLabel(equipment.status_equipamento)}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Local</div>
                    <div class="info-value">${getLocalName(equipment.local_id)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtra equipamentos baseado nos critérios
function filterEquipments() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const localFilter = document.getElementById('local-filter').value;
    
    filteredEquipments = equipments.filter(equipment => {
        const matchesSearch = !searchTerm || 
            equipment.tipo_equipamento.toLowerCase().includes(searchTerm) ||
            equipment.marca.toLowerCase().includes(searchTerm) ||
            equipment.modelo.toLowerCase().includes(searchTerm) ||
            (equipment.patrimonio && equipment.patrimonio.toLowerCase().includes(searchTerm)) ||
            (equipment.numero_serie && equipment.numero_serie.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || equipment.status_equipamento === statusFilter;
        const matchesLocal = !localFilter || equipment.local_id.toString() === localFilter;
        
        return matchesSearch && matchesStatus && matchesLocal;
    });
    
    renderEquipments();
}

// Limpa todos os filtros
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('local-filter').value = '';
    filteredEquipments = [...equipments];
    renderEquipments();
}

// Abre modal para adicionar equipamento
function openAddModal() {
    currentEditingId = null;
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus"></i> Novo Equipamento';
    document.getElementById('equipment-form').reset();
    setDefaultDate();
    document.getElementById('equipment-modal').classList.add('active');
}

// Abre modal para editar equipamento
function editEquipment(id) {
    const equipment = equipments.find(eq => eq.id === id);
    if (!equipment) return;
    
    currentEditingId = id;
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> Editar Equipamento';};
    
    // Preenche o formulário
