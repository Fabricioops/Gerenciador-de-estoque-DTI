let todasMovimentacoes = [];

const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");
const movementTypeInput = document.getElementById("movement-type");
const equipmentSearchInput = document.getElementById("equipment-search");
const movementsTable = document.getElementById("movements-table");
const emptyState = document.getElementById("empty-state");

document.addEventListener("DOMContentLoaded", () => {
    inicializarFiltroData();
    registrarEventosDosFiltros();
    carregarMovimentacoes();
});

async function carregarMovimentacoes() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch("/api/movimentacoes", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Erro ao buscar movimentações");

        todasMovimentacoes = await response.json();
        applyFilters();
    } catch (erro) {
        console.error(erro);
        todasMovimentacoes = [];
        renderizarTabela([]);
    }
}

function registrarEventosDosFiltros() {
    dateFromInput.addEventListener("change", applyFilters);
    dateToInput.addEventListener("change", applyFilters);
    movementTypeInput.addEventListener("change", applyFilters);
    equipmentSearchInput.addEventListener("input", applyFilters);
}

function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function inicializarFiltroData() {
    const hoje = new Date();
    const umMesAtras = new Date(hoje);
    umMesAtras.setMonth(hoje.getMonth() - 1);
    const dataHoje = formatarDataISO(hoje);

    dateToInput.max = dataHoje;
    dateFromInput.max = dataHoje;
    dateFromInput.value = formatarDataISO(umMesAtras);
    dateToInput.value = dataHoje;
}

function textoNormalizado(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function filtrarMovimentacoes() {
    const dataDe = dateFromInput.value ? new Date(`${dateFromInput.value}T00:00:00`) : null;
    const dataAte = dateToInput.value ? new Date(`${dateToInput.value}T23:59:59.999`) : null;
    const tipo = movementTypeInput.value;
    const busca = textoNormalizado(equipmentSearchInput.value.trim());

    return todasMovimentacoes.filter((mov) => {
        const dataMovimentacao = new Date(mov.data_movimentacao);

        if (Number.isNaN(dataMovimentacao.getTime())) return false;
        if (dataDe && dataMovimentacao < dataDe) return false;
        if (dataAte && dataMovimentacao > dataAte) return false;
        if (tipo && mov.tipo_movimentacao !== tipo) return false;

        const camposPesquisaveis = [
            mov.modelo, mov.patrimonio, mov.origem, mov.destino,
            mov.tecnico, mov.observacao, mov.tipo_movimentacao
        ];
        return !busca || textoNormalizado(camposPesquisaveis.join(" ")).includes(busca);
    });
}

function applyFilters() {
    const intervaloValido = !dateFromInput.value || !dateToInput.value || dateFromInput.value <= dateToInput.value;
    if (!intervaloValido) {
        dateToInput.setCustomValidity('A data "Até" deve ser igual ou posterior à data "De".');
        dateToInput.reportValidity();
        return;
    }

    dateToInput.setCustomValidity("");
    renderizarTabela(filtrarMovimentacoes());
}

function clearMovementFilters() {
    dateFromInput.value = "";
    dateToInput.value = "";
    movementTypeInput.value = "";
    equipmentSearchInput.value = "";
    dateToInput.setCustomValidity("");
    applyFilters();
}

function renderizarTabela(movimentacoes) {
    const tbody = document.getElementById("movements-tbody");
    tbody.replaceChildren();

    movimentacoes.forEach((mov) => {
        const linha = document.createElement("tr");
        const valores = [
            formatarData(mov.data_movimentacao),
            `${mov.modelo || "-"} (${mov.patrimonio || "-"})`,
            mov.tipo_movimentacao || "-", mov.origem || "-", mov.destino || "-",
            mov.tecnico || "-", mov.observacao || "-"
        ];

        valores.forEach((valor) => {
            const celula = document.createElement("td");
            celula.textContent = valor;
            linha.appendChild(celula);
        });
        tbody.appendChild(linha);
    });

    const semResultados = movimentacoes.length === 0;
    emptyState.style.display = semResultados ? "flex" : "none";
    movementsTable.style.display = semResultados ? "none" : "table";
}

function formatarData(data) {
    const dataFormatada = new Date(data);
    return Number.isNaN(dataFormatada.getTime()) ? "-" : dataFormatada.toLocaleString("pt-BR");
}
