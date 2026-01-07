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
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> Editar Equipamento';
    
    // Preenche o formulário
    document.getElementById('equipment-id').value = equipment.id;
    document.getElementById('tipo_equipamento').value = equipment.tipo_equipamento;
    document.getElementById('marca').value = equipment.marca;
    document.getElementById('modelo').value = equipment.modelo;
    document.getElementById('patrimonio').value = equipment.patrimonio || '';
    document.getElementById('numero_serie').value = equipment.numero_serie || '';
    document.getElementById('status_equipamento').value = equipment.status_equipamento;
    document.getElementById('local_id').value = equipment.local_id;
    document.getElementById('data_cadastro').value = equipment.data_cadastro ? equipment.data_cadastro.split('T')[0] : '';
    document.getElementById('observacao').value = equipment.observacao || '';
    
    document.getElementById('equipment-modal').classList.add('active');
}

// Edita equipamento a partir do modal de detalhes
function editFromDetails() {
    closeDetailsModal();
    const equipmentId = parseInt(document.getElementById('equipment-details').dataset.equipmentId);
    editEquipment(equipmentId);
}

// Fecha modal de equipamento
function closeModal() {
    document.getElementById('equipment-modal').classList.remove('active');
    document.getElementById('equipment-form').reset();
    currentEditingId = null;
}

// Manipula o envio do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        tipo_equipamento: document.getElementById('tipo_equipamento').value,
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        patrimonio: document.getElementById('patrimonio').value || null,
        numero_serie: document.getElementById('numero_serie').value || null,
        status_equipamento: document.getElementById('status_equipamento').value,
        local_id: parseInt(document.getElementById('local_id').value),
        data_cadastro: document.getElementById('data_cadastro').value,
        observacao: document.getElementById('observacao').value || null
    };
    
    try {
        let response;
        
        if (currentEditingId) {
            // Atualizar equipamento existente
            response = await fetch(`${API_BASE_URL}/equipamentos/${currentEditingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Criar novo equipamento
            response = await fetch(`${API_BASE_URL}/equipamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) {
            throw new Error('Erro ao salvar equipamento');
        }
        
        const result = await response.json();
        
        showToast(
            currentEditingId ? 'Equipamento atualizado com sucesso!' : 'Equipamento cadastrado com sucesso!',
            'success'
        );
        
        closeModal();
        loadEquipments(); // Recarrega a lista
        
    } catch (error) {
        console.error('Erro ao salvar equipamento:', error);
        showToast('Erro ao salvar equipamento', 'error');
    }
}

// Exclui equipamento
async function deleteEquipment(id) {
    const equipment = equipments.find(eq => eq.id === id);
    if (!equipment) return;
    
    const confirmed = confirm(`Tem certeza que deseja excluir o equipamento "${equipment.tipo_equipamento} ${equipment.marca} ${equipment.modelo}"?`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/equipamentos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir equipamento');
        }
        
        showToast('Equipamento excluído com sucesso!', 'success');
        loadEquipments(); // Recarrega a lista
        
    } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        showToast('Erro ao excluir equipamento', 'error');
    }
}

// Mostra detalhes do equipamento
function showDetails(id) {
    const equipment = equipments.find(eq => eq.id === id);
    if (!equipment) return;
    
    const detailsContainer = document.getElementById('equipment-details');
    detailsContainer.dataset.equipmentId = id;
    
    detailsContainer.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Tipo de Equipamento</div>
            <div class="detail-value">${equipment.tipo_equipamento}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Marca</div>
            <div class="detail-value">${equipment.marca}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Modelo</div>
            <div class="detail-value">${equipment.modelo}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Patrimônio</div>
            <div class="detail-value">${equipment.patrimonio || 'Sem Patrimônio'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Número de Série</div>
            <div class="detail-value">${equipment.numero_serie || 'Não informado'}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Status</div>
            <div class="detail-value">
                <span class="status-badge status-${equipment.status_equipamento.toLowerCase()}">
                    <i class="fas fa-circle"></i>
                    ${getStatusLabel(equipment.status_equipamento)}
                </span>
            </div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Local</div>
            <div class="detail-value">${getLocalName(equipment.local_id)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Data de Cadastro</div>
            <div class="detail-value">${equipment.data_cadastro ? formatDate(equipment.data_cadastro) : 'Não informado'}</div>
        </div>
        <div class="detail-item" style="grid-column: 1 / -1;">
            <div class="detail-label">Observação</div>
            <div class="detail-value">${equipment.observacao || 'Nenhuma observação'}</div>
        </div>
    `;
    
    document.getElementById('details-modal').classList.add('active');
}

// Fecha modal de detalhes
function closeDetailsModal() {
    document.getElementById('details-modal').classList.remove('active');
}

// Funções utilitárias
function getStatusLabel(status) {
    const statusLabels = {
        'FUNCIONANDO': 'Funcionando',
        'PARA_DESCARTE': 'Para Descarte',
        'INVENTARIADO': 'Inventariado',
        'QUEIMADO': 'Queimado'
    };
    return statusLabels[status] || status;
}

function getLocalName(localId) {
    const locais = {
        1: 'Descarte Farolândia',
        2: 'Lixo Eletrônico B54',
        3: 'D13',
        4: 'Inventariado Centro'
    };
    return locais[localId] || 'Local não identificado';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showEmptyState(show) {
    document.getElementById('empty-state').style.display = show ? 'block' : 'none';
}

// Sistema de notificações toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove o toast após 4 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Função de logout
function logout() {
    const confirmed = confirm('Tem certeza que deseja sair do sistema?');
    if (confirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    }
}

// Adiciona animação de saída para os toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
