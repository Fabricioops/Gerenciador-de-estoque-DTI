// src/script.js
// Modificações recentes (explicação):
// - Alterado o fluxo de pós-login: em vez de redirecionar para outra página,
//   o login agora exibe o dashboard embutido no `index.html` (comportamento SPA).
// - Ao exibir o dashboard, o script busca dados na API (`/api/dashboard/...`) e
//   inicializa os gráficos Chart.js com os dados retornados.
// - Adicionados handlers de logout e checagem inicial para manter sessão via localStorage.
document.addEventListener("DOMContentLoaded", async () => {
  await loadSharedHeader();
  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("email").value;
      const senha = document.getElementById("password").value;

      try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, senha } ),
        });

        const data = await response.json();

        if (response.ok) {
          // Login bem-sucedido
          console.log("Login bem-sucedido:", data);
          errorMessage.style.display = "none";
          // Salva informações do usuário (ex: no localStorage)
          localStorage.setItem("user", JSON.stringify(data.user));

          // Mostrar o dashboard embutido no index.html (single-page flow)
      const loginContainer = document.getElementById('login-container');
      const dashboardContainer = document.getElementById('dashboard-container');
      if (loginContainer) loginContainer.style.display = 'none';
      if (dashboardContainer) dashboardContainer.style.display = 'block';

      // Carrega dados do dashboard após exibi-lo
      await loadDashboardData();

      // Atualiza o nome do usuário no header, se disponível
          try {
            const user = data.user || JSON.parse(localStorage.getItem('user')) || {};
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
              const name = user.name || user.nome || user.email || 'Usuário';
              userNameEl.textContent = `Olá, ${name}`;
            }
          } catch (e) {
            // ignore
          }
        } else {
          // Exibe mensagem de erro
          errorMessage.textContent = data.message || "Erro no login.";
          errorMessage.style.display = "block";
        }
      } catch (error) {
        console.error("Erro ao tentar fazer login:", error);

        errorMessage.style.display = "block";
      }
    });
  }
  // Se já estiver logado (localStorage), mostrar dashboard imediatamente
  try {
    const existing = localStorage.getItem('user');
    if (existing) {
      const loginContainer = document.getElementById('login-container');
      const dashboardContainer = document.getElementById('dashboard-container');
      if (loginContainer) loginContainer.style.display = 'none';
      if (dashboardContainer) dashboardContainer.style.display = 'block';
      const user = JSON.parse(existing);
      const userNameEl = document.getElementById('user-name');
      if (userNameEl) {
        const name = user.name || user.nome || user.email || 'Usuário';
        userNameEl.textContent = `Olá, ${name}`;
      }
    }
  } catch (e) {
    // ignore
  }

  // Logout handler (mostra tela de login novamente)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      localStorage.removeItem('user');
      const loginContainer = document.getElementById('login-container');
      const dashboardContainer = document.getElementById('dashboard-container');
      if (dashboardContainer) dashboardContainer.style.display = 'none';
      if (loginContainer) loginContainer.style.display = 'block';
    });
  }

  // Se quisermos atualizar logout handler novamente (caso header seja recarregado)
  // podemos rebindar aqui ou chamar loadSharedHeader() novamente.

  // Quando o dashboard é exibido, popula os cards e inicializa gráficos
  async function loadDashboardData() {
    try {
      // summary (usamos novo endpoint /counts que já contém total/inStock/discard)
      const countsResp = await fetch('http://localhost:3000/api/dashboard/counts');
      if (countsResp.ok) {
        const counts = await countsResp.json();
        const totalEl = document.getElementById('card-total');
        const inStockEl = document.getElementById('card-in-stock');
        const discardEl = document.getElementById('card-discard');
        if (totalEl) totalEl.textContent = counts.total ?? '0';
        // Itens em estoque é o mesmo que total no momento
        if (inStockEl) inStockEl.textContent = counts.inStock ?? counts.total ?? '0';
        if (discardEl) discardEl.textContent = counts.discard ?? '0';
      }
      

      // category and status
      const [catResp, statusResp] = await Promise.all([
        fetch('http://localhost:3000/api/dashboard/equipamentos/category'),
        fetch('http://localhost:3000/api/dashboard/equipamentos/status')
      ]);

      const categories = catResp.ok ? await catResp.json() : [];
      const statuses = statusResp.ok ? await statusResp.json() : [];

      // Inicializa gráficos (se Chart.js estiver disponível)
      try {
        if (window.Chart) {
          // Category chart
          const catCtx = document.getElementById('category-chart').getContext('2d');
          const catLabels = categories.map(r => r.category || r.tipo_equipamento);
          const catData = categories.map(r => r.count || r.Count || 0);
          new Chart(catCtx, {
            type: 'bar',
            data: { labels: catLabels, datasets: [{ label: 'Quantidade', data: catData, backgroundColor: '#007bff' }] },
            options: { responsive: true }
          });

          // Status chart
          const statusCtx = document.getElementById('status-chart').getContext('2d');
          const statusLabels = statuses.map(r => r.status || r.status_equipamento);
          const statusData = statuses.map(r => r.count || r.Count || 0);
          new Chart(statusCtx, { //criação do grafico 
            type: 'pie',
            data: { labels: statusLabels, datasets: [{ label: 'Qtd', data: statusData }] },
            options: { responsive: true }
          });
        }
      } catch (e) {
        console.warn('Erro ao inicializar gráficos:', e);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    }
  }

  // Chama loadDashboardData se o dashboard estiver visível
  const dashboardContainer = document.getElementById('dashboard-container');
  if (dashboardContainer && dashboardContainer.style.display !== 'none') {
    loadDashboardData();
  }
});

// Função que carrega o header compartilhado (`header.html`) e injetá-lo
async function loadSharedHeader() {
  try {
    const placeholder = document.getElementById('site-header');
    if (!placeholder) return;
    if (placeholder.innerHTML && placeholder.innerHTML.trim().length > 0) return; // header already injected
    const resp = await fetch('/header.html');
    if (!resp.ok) return;
    const html = await resp.text();
    placeholder.innerHTML = html;
  } catch (e) {
    console.warn('Não foi possível carregar header compartilhado:', e);
  }
}
