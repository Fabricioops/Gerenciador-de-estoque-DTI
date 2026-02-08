(function(){
  window.headerReady = fetch('/header.html')
    .then(res => {
      if (!res.ok) throw new Error('failed to fetch header');
      return res.text();
    })
    .then(html => {
      const placeholder = document.getElementById('site-header') || document.getElementById('header');
      if (placeholder) placeholder.innerHTML = html;

      // Marca a aba ativa no menu com base no caminho atual (mais robusto)
      try {
        const links = (placeholder ? placeholder.querySelectorAll('a.nav-link, .main-nav a') : document.querySelectorAll('a.nav-link, .main-nav a')) || [];
        // Normaliza caminho atual (remove barra final)
        const currentPath = location.pathname.replace(/\/+$/,'') || '/';

        // Remove qualquer active pré-existente
        links.forEach(a => a.classList.remove('active'));

        links.forEach(a => {
          const href = a.getAttribute('href') || '';
          if (!href || href === '#') return;
          // Resolve href relativo para obter pathname absoluto
          let resolved;
          try {
            resolved = new URL(href, location.href).pathname.replace(/\/+$/,'');
          } catch (e) {
            resolved = href.replace(/\/+$/,'');
          }

          // Considera correspondências por pathname ou pelo último segmento sem extensão
          const lastSeg = resolved.split('/').filter(Boolean).pop() || '';
          const currLastSeg = currentPath.split('/').filter(Boolean).pop() || '';

          if (resolved === currentPath || lastSeg === currLastSeg) {
            a.classList.add('active');
          }
        });
      } catch (e) {
        // não-fatal
      }

      // Configura o botão de toggle do menu (para header injetado ou header estático)
      try {
        function setupNavToggle() {
          const toggle = document.getElementById('nav-toggle');
          const nav = (placeholder ? placeholder.querySelector('.main-nav') : document.querySelector('.main-nav')) || document.querySelector('.nav-menu');
          if (!toggle || !nav) return;
          toggle.addEventListener('click', () => {
            const opened = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', opened);
          });
        }
        setupNavToggle();
      } catch (e) {
        // ignore
      }

      return html;
    })
    .catch(err => {
      console.warn('Não foi possível carregar header:', err);
    });
})();
