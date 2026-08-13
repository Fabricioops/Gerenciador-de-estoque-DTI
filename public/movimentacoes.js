document.addEventListener("DOMContentLoaded", () => {

    carregarMovimentacoes();

});
async function carregarMovimentacoes() {

    const token = localStorage.getItem("token");

    try {

        const response = await fetch("/api/movimentacoes", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
      

        if (!response.ok) {
            throw new Error("Erro ao buscar movimentações");
        }

        const movimentacoes = await response.json();

        console.log(movimentacoes);

        renderizarTabela(movimentacoes);

    } catch (erro) {

        console.error(erro);

    }

}
function renderizarTabela(movimentacoes) {

    const tbody = document.getElementById("movements-tbody");

    tbody.innerHTML = "";

    movimentacoes.forEach(mov => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${formatarData(mov.data_movimentacao)}</td>
            <td>${mov.modelo} (${mov.patrimonio})</td>
            <td>${mov.tipo_movimentacao}</td>
            <td>${mov.origem || "-"}</td>
            <td>${mov.destino || "-"}</td>
            <td>${mov.tecnico || "-"}</td>
            <td>${mov.observacao || "-"}</td>
        `;

        tbody.appendChild(linha);

    });

}
function formatarData(data) {

    return new Date(data).toLocaleString("pt-BR");

}