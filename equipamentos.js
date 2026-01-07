document.addEventListener('DOMContentLoaded', function() {
/* Arquivo migrado: versão ativa em /public/equipamentos.js */
console.info('Aviso: equipamentos.js raiz migrado para /public/equipamentos.js');
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
