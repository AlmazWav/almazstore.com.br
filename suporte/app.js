(() => {
  const TOKEN_KEY = 'almaz_support_token';
  const AGENT_KEY = 'almaz_support_agent';
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  const appSections = [...document.querySelectorAll('[data-app-section]')];
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const customersList = document.getElementById('customers-list');
  const detailPanel = document.getElementById('detail-panel');
  const resultCount = document.getElementById('result-count');
  const statCustomers = document.getElementById('stat-customers');
  const statActive = document.getElementById('stat-active');
  const toast = document.getElementById('toast');
  const feedbackList = document.getElementById('feedback-list');
  const feedbackCount = document.getElementById('feedback-count');
  const recoveryList = document.getElementById('recovery-list');
  const recoveryCount = document.getElementById('recovery-count');
  const recoveryDashboardList = document.getElementById('recovery-dashboard-list');
  const commissionList = document.getElementById('commission-list');
  const expiredHistoryList = document.getElementById('expired-history-list');
  const expiredHistoryTotal = document.getElementById('expired-history-total');
  const expiredHistoryMore = document.getElementById('load-more-expired-history');
  const expiredHistoryPageSize = 50;
  let expiredHistoryOffset = 0;
  let expiredHistoryLoaded = false;
  let expiredHistoryLoading = false;
  const resetDialog = document.getElementById('reset-dialog');
  const resetForm = document.getElementById('reset-form');
  const resetReason = document.getElementById('reset-reason');
  const demoMode = location.protocol === 'file:';
  const demoCustomers = [
    {
      email: 'marina.oliveira@example.test', name: 'Marina Oliveira', key: 'ALMAZ-DEMO-82KX', plan: '40k',
      purchasedAt: '2026-10-09T14:20:00.000Z', expiresAt: null, keyStatus: 'active', hwidBound: true,
      resetsUsed: 1, resetsLeft: 3,
      activity: [{ category: 'Troca de computador', status: 'done', at: '2026-10-12T11:05:00.000Z', detail: 'Cliente trocou de computador', agent: 'Suporte' }],
    },
    {
      email: 'rafael.lima@example.test', name: 'Rafael Lima', key: '', plan: '',
      purchasedAt: null, expiresAt: null, keyStatus: 'sem licença', hwidBound: false,
      resetsUsed: 0, resetsLeft: 4, activityLabel: 'Troca de computador',
      activity: [{ category: 'Troca de computador', status: 'pending', at: '2026-10-17T16:42:00.000Z', detail: 'Aguardando vínculo da licença' }],
    },
    {
      email: 'lucas.martins@example.test', name: 'Lucas Martins', key: 'ALMAZ-DEMO-4T9Q', plan: '20k',
      purchasedAt: '2026-08-28T09:15:00.000Z', expiresAt: null, keyStatus: 'active', hwidBound: false,
      resetsUsed: 0, resetsLeft: 4, activity: [],
    },
    {
      email: '', name: 'Cliente antigo', key: 'ALMAZ-OLD-1937', plan: '40k',
      purchasedAt: '2025-11-14T09:30:00.000Z', expiresAt: null, keyStatus: 'active', hwidBound: true,
      resetsUsed: 0, resetsLeft: 4,
      activity: [],
    },
  ];
  let selectedCustomer = null;
  let allCustomers = [];
  let activeFilter = 'all';
  let searchTimer;
  let searchSequence = 0;
  let toastTimer;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const formatMoney = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
    : 'Valor não informado';

  const CHECKOUT_URLS = {
    '40k': 'https://ggcheckout.app/checkout/v5/Tjjri534N4VrT34qfUTm',
    '40k-promo': 'https://ggcheckout.app/checkout/v5/uDIPxkFgNZlX2eQzy1ua',
    '20k': 'https://ggcheckout.app/checkout/v5/EBQq9V24j7dAljWU9EUd',
    '1k': 'https://ggcheckout.app/checkout/v5/3SZQGWf2lurzA7Sb3M26',
  };

  function buildTrackedCheckoutUrl(planCode, agent, paymentId) {
    const rawPlan = String(planCode || '').toLowerCase().trim();
    const cleanPlan = rawPlan.includes('20') ? '20k' : rawPlan.includes('1') ? '1k' : '40k';
    const baseUrl = CHECKOUT_URLS[cleanPlan] || CHECKOUT_URLS['40k'];
    const cleanAgent = String(agent || 'suporte').toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 40);
    const cleanPaymentId = String(paymentId || '').trim();
    const shortId = cleanPaymentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 14);
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}utm_source=suporte&utm_medium=whatsapp&utm_campaign=${encodeURIComponent(cleanAgent)}&utm_content=${encodeURIComponent(cleanPaymentId)}&sck=SUP_${encodeURIComponent(shortId)}`;
  }

  function whatsappUrl(phone, name) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    if (digits.length < 12 || digits.length > 15) return '';
    const firstName = String(name || '').trim().split(' ')[0];
    const greeting = firstName ? `Opa, ${firstName}! Tudo bem?` : 'Opa, tudo bem?';
    const message = `${greeting}\n\nAqui é o suporte da Almaz Store! Vi que você tentou acessar antes, deu algum probleminha no pagamento ou teve alguma dúvida que eu possa te ajudar?`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  const statusLabel = status => ({
    active: 'Ativa', expired: 'Expirada', revoked: 'Revogada',
    'não encontrada': 'Sem licença', 'sem licença': 'Sem licença',
    'pagamento pendente': 'Pagamento pendente',
    approved: 'Pagamento aprovado', paid: 'Pagamento aprovado', processing: 'Em processamento',
    waiting_payment: 'Aguardando pagamento', refunded: 'Reembolsado', cancelled: 'Cancelado', canceled: 'Cancelado',
  }[String(status || '').toLowerCase()] || status || '—');
  const isPending = status => ['sem licença', 'não encontrada', 'pagamento pendente', 'pending', 'waiting_payment', 'processing', 'em análise']
    .includes(String(status || '').toLowerCase());
  const activityStatusLabel = status => ({
    confirmed: 'Confirmado', done: 'Concluído', pending: 'Pendente', used: 'Resgatado',
    paid: 'Pago', approved: 'Aprovado', refunded: 'Reembolsado', cancelled: 'Cancelado', canceled: 'Cancelado',
    failed: 'Falhou', waiting_payment: 'Aguardando pagamento',
  }[String(status || '').toLowerCase()] || status || 'Registrado');

  function showMessage(element, message, kind = 'error') {
    element.textContent = message;
    element.className = `message ${kind}`;
  }

  function showToast(message, kind = 'success') {
    toast.textContent = message;
    toast.className = `toast visible ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
  }

  function clearSession(message = '') {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AGENT_KEY);
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
    if (message) showMessage(loginMessage, message);
  }

  function setAuthenticated(agent) {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    document.getElementById('agent-label').textContent = agent;
    loginMessage.textContent = '';
    loginMessage.className = 'message';
    const requestedSection = location.hash.slice(1);
    const sectionExists = appSections.some(section => section.dataset.appSection === requestedSection);
    setAppSection(sectionExists ? requestedSection : 'overview', false);
  }

  function setAppSection(name, updateUrl = true) {
    const exists = appSections.some(section => section.dataset.appSection === name);
    const sectionName = exists ? name : 'overview';
    appSections.forEach(section => section.classList.toggle('hidden', section.dataset.appSection !== sectionName));
    document.querySelectorAll('.app-nav-item[data-section-target]').forEach(button => {
      const active = button.dataset.sectionTarget === sectionName;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (updateUrl && location.hash !== `#${sectionName}`) {
      history.replaceState(null, '', `${location.pathname}${location.search}#${sectionName}`);
    }
    if (sectionName === 'expired-history' && !expiredHistoryLoaded && !expiredHistoryLoading) loadExpiredHistory(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const API_BASE = (location.hostname.includes('onrender.com') || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? ''
    : 'https://keys-server-9zq2.onrender.com';

  async function apiRequest(url, options = {}) {
    const targetUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const headers = {
      ...(options.headers || {}),
      'x-support-token': sessionStorage.getItem(TOKEN_KEY) || '',
      'x-support-agent': sessionStorage.getItem(AGENT_KEY) || '',
    };
    if (options.body) headers['content-type'] = 'application/json';
    const response = await fetch(targetUrl, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || (response.status === 403 && String(data.message || '').startsWith('Acesso de suporte negado'))) {
      clearSession('Sua credencial não foi aceita ou expirou. Entre novamente.');
      throw new Error('Acesso de suporte expirado.');
    }
    return { response, data };
  }

  async function connectWithStoredToken() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const agent = sessionStorage.getItem(AGENT_KEY);
    if (!token || !agent) return;
    try {
      const response = await fetch(`${API_BASE}/api/support/session`, { headers: { 'x-support-token': token } });
      if (!response.ok) return clearSession();
      setAuthenticated(agent);
      await Promise.all([loadCustomers(''), loadFeedbacks(), loadRecoveries(), loadRecoveryDashboard(), loadCommissions()]);
    } catch (_) {
      clearSession('Não foi possível conectar ao servidor. Tente novamente.');
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = loginForm.querySelector('button[type="submit"]');
    const token = document.getElementById('support-token').value.trim();
    const agent = document.getElementById('agent-name').value.trim();
    submit.disabled = true;
    submit.textContent = 'Verificando…';
    try {
      const response = await fetch(`${API_BASE}/api/support/session`, { headers: { 'x-support-token': token } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Não foi possível validar o acesso.');
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(AGENT_KEY, agent);
      setAuthenticated(agent);
      await Promise.all([loadCustomers(''), loadFeedbacks(), loadRecoveries(), loadRecoveryDashboard(), loadCommissions()]);
    } catch (error) {
      showMessage(loginMessage, error.message || 'Falha de conexão. Tente novamente.');
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Entrar na central <span>→</span>';
    }
  });

  document.getElementById('logout-button').addEventListener('click', () => clearSession());

  appView.addEventListener('click', event => {
    const button = event.target.closest('[data-section-target]');
    if (button) setAppSection(button.dataset.sectionTarget);
  });
  window.addEventListener('hashchange', () => {
    const requested = location.hash.slice(1);
    if (appSections.some(section => section.dataset.appSection === requested)) setAppSection(requested, false);
  });

  async function loadFeedbacks() {
    if (demoMode) {
      feedbackCount.textContent = '1';
      document.getElementById('home-feedback-count').textContent = '1';
      feedbackList.innerHTML = `
        <article class="feedback-card">
          <div class="feedback-main"><b>Guilherme Santos</b><small>guilherme@exemplo.com</small><span>@guilherme.fps · enviado 18/10/2026 21:10</span></div>
          <button class="button button-primary" type="button" data-approve-feedback="guilherme@exemplo.com">Aprovar</button>
        </article>`;
      return;
    }
    feedbackList.innerHTML = '<div class="empty-state"><span class="spinner"></span><b>Carregando feedbacks pendentes…</b></div>';
    try {
      const { response, data } = await apiRequest('/api/support/feedbacks');
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar os feedbacks.');
      const feedbacks = data.feedbacks || [];
      feedbackCount.textContent = String(feedbacks.length);
      document.getElementById('home-feedback-count').textContent = String(feedbacks.length);
      if (!feedbacks.length) {
        feedbackList.innerHTML = '<div class="empty-state"><b>Nenhum feedback aguardando aprovação</b><span>Os novos comentários enviados pelos clientes aparecerão aqui.</span></div>';
        return;
      }
      feedbackList.innerHTML = feedbacks.map(feedback => `
        <article class="feedback-card">
          <div class="feedback-main"><b>${escapeHtml(feedback.name || 'Cliente')}</b><small>${escapeHtml(feedback.email)}</small><span>@${escapeHtml(String(feedback.instagram || '').replace(/^@/, ''))} · enviado ${escapeHtml(formatDate(feedback.feedbackAt))}</span></div>
          <button class="button button-primary" type="button" data-approve-feedback="${escapeHtml(feedback.email)}">Aprovar</button>
        </article>`).join('');
    } catch (error) {
      feedbackCount.textContent = '—';
      document.getElementById('home-feedback-count').textContent = '—';
      feedbackList.innerHTML = `<div class="empty-state error-text"><b>Não foi possível carregar</b><span>${escapeHtml(error.message)}</span></div>`;
    }
  }

  document.getElementById('refresh-feedbacks').addEventListener('click', loadFeedbacks);
  feedbackList.addEventListener('click', async event => {
    const button = event.target.closest('[data-approve-feedback]');
    if (!button) return;
    if (demoMode) {
      showToast('Feedback aprovado (modo demonstração).');
      button.closest('article')?.remove();
      feedbackCount.textContent = '0';
      document.getElementById('home-feedback-count').textContent = '0';
      feedbackList.innerHTML = '<div class="empty-state"><b>Nenhum feedback aguardando aprovação</b></div>';
      return;
    }
    button.disabled = true;
    button.textContent = 'Aprovando…';
    try {
      const { response, data } = await apiRequest('/api/support/feedbacks/approve', {
        method: 'POST', body: JSON.stringify({ email: button.dataset.approveFeedback }),
      });
      if (!response.ok) throw new Error(data.message || 'Não foi possível aprovar este feedback.');
      showToast(data.message || 'Feedback aprovado.');
      await loadFeedbacks();
    } catch (error) {
      showToast(error.message || 'Falha ao aprovar feedback.', 'error');
      button.disabled = false;
      button.textContent = 'Aprovar';
    }
  });

  async function loadRecoveries() {
    if (demoMode) {
      recoveryCount.textContent = '2';
      document.getElementById('nav-recovery-count').textContent = '2';
      document.getElementById('home-recovery-count').textContent = '2';
      const trackedDemo = buildTrackedCheckoutUrl('20k', 'Demonstração', 'DEMO-PAY-2');
      const waLink = whatsappUrl('11999998888', 'Gabriel Costa', 'Plano 20k', trackedDemo);
      recoveryList.innerHTML = `
        <article class="feedback-card recovery-card">
          <div class="feedback-main"><b>Thiago Mendes</b><small>thiago.m@exemplo.com</small><span>Plano 40k · R$ 199,00 · expirou 18/10/2026 22:15</span><span class="recovery-phone">Telefone: (11) 99999-8888</span></div>
          <div class="recovery-actions"><button class="button button-primary" type="button" data-claim-payment="DEMO-PAY-1">Assumir contato</button></div>
        </article>
        <article class="feedback-card recovery-card">
          <div class="feedback-main"><b>Gabriel Costa</b><small>gabriel.c@exemplo.com</small><span>Plano 20k · R$ 99,00 · expirou 18/10/2026 20:30</span><span class="recovery-phone">Telefone: (21) 98888-7777</span><span class="recovery-utm-info">Link com UTM ativo para sua comissão</span></div>
          <div class="recovery-actions"><button class="button button-quiet" type="button" disabled>Com você</button><a class="button button-whatsapp" href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a><button class="button button-quiet button-copy-link" type="button" data-copy-link="${escapeHtml(trackedDemo)}">Copiar link UTM</button><button class="button button-quiet" type="button" data-recovery-stage="sent" data-payment-id="DEMO-PAY-2">Marcar enviado</button><button class="button button-quiet" type="button" data-recovery-stage="finished" data-payment-id="DEMO-PAY-2">Encerrar atendimento</button></div>
        </article>`;
      return;
    }
    recoveryList.innerHTML = '<div class="empty-state"><span class="spinner"></span><b>Carregando pagamentos expirados…</b></div>';
    try {
      const { response, data } = await apiRequest('/api/support/recoveries');
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar a fila.');
      const payments = data.payments || [];
      recoveryCount.textContent = String(payments.length);
      document.getElementById('nav-recovery-count').textContent = String(payments.length);
      document.getElementById('home-recovery-count').textContent = String(payments.length);
      if (!payments.length) {
        recoveryList.innerHTML = '<div class="empty-state"><b>Nenhum pagamento expirado recebido</b><span>A GGCheckout precisa enviar os eventos de expiração para esta fila.</span></div>';
        return;
      }
      recoveryList.innerHTML = payments.map(payment => {
        const mine = payment.recoveryAgent === sessionStorage.getItem(AGENT_KEY);
        const status = payment.recoveryAgent
          ? (mine ? (payment.recoveryStage === 'sent' ? 'Mensagem enviada' : 'Com você') : `Com ${payment.recoveryAgent}`)
          : 'Assumir contato';
        const disabled = payment.recoveryAgent ? 'disabled' : '';
        const agentName = sessionStorage.getItem(AGENT_KEY) || 'suporte';
        const trackedLink = buildTrackedCheckoutUrl(payment.plan, agentName, payment.paymentId);
        const waLink = mine ? whatsappUrl(payment.phone, payment.name, payment.productName || payment.plan, trackedLink) : '';
        const phoneDisplay = payment.recoveryAgent && !mine ? 'oculto enquanto está com outro atendente' : (payment.phone || 'não informado');
        const contactAction = waLink
          ? `<a class="button button-whatsapp" href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>`
          : `<span class="recovery-phone-missing">${payment.recoveryAgent && !mine ? `Atribuído a ${escapeHtml(payment.recoveryAgent)}` : !payment.phone ? 'Telefone não encontrado' : !mine ? 'Assuma contato para abrir o WhatsApp' : 'WhatsApp indisponível para este número'}</span>`;
        const copyLinkAction = mine
          ? `<button class="button button-quiet button-copy-link" type="button" data-copy-link="${escapeHtml(trackedLink)}">Copiar link UTM</button>`
          : '';
        const sentAction = mine && payment.recoveryStage !== 'sent'
          ? `<button class="button button-quiet" type="button" data-recovery-stage="sent" data-payment-id="${escapeHtml(payment.paymentId)}">Marcar enviado</button>`
          : '';
        const finishAction = mine
          ? `<button class="button button-quiet" type="button" data-recovery-stage="finished" data-payment-id="${escapeHtml(payment.paymentId)}">Encerrar atendimento</button>`
          : '';
        const utmInfo = mine
          ? `<span class="recovery-utm-info">Link com UTM ativo para sua comissão</span>`
          : '';
        return `<article class="feedback-card recovery-card">
          <div class="feedback-main"><b>${escapeHtml(payment.name || 'Cliente')}</b><small>${escapeHtml(payment.email)}</small><span>${escapeHtml(payment.productName || payment.plan || 'Compra')} · ${escapeHtml(formatMoney(payment.amount))} · expirou ${escapeHtml(formatDate(payment.eventAt))}</span><span class="recovery-phone">Telefone: ${escapeHtml(phoneDisplay)}</span>${utmInfo}</div>
          <div class="recovery-actions"><button class="button ${payment.recoveryAgent ? 'button-quiet' : 'button-primary'}" type="button" data-claim-payment="${escapeHtml(payment.paymentId)}" ${disabled}>${escapeHtml(status)}</button>${contactAction}${copyLinkAction}${sentAction}${finishAction}</div>
        </article>`;
      }).join('');
    } catch (error) {
      recoveryCount.textContent = '—';
      document.getElementById('nav-recovery-count').textContent = '—';
      document.getElementById('home-recovery-count').textContent = '—';
      recoveryList.innerHTML = `<div class="empty-state error-text"><b>Não foi possível carregar</b><span>${escapeHtml(error.message)}</span></div>`;
    }
  }

  document.getElementById('refresh-recoveries').addEventListener('click', loadRecoveries);
  recoveryList.addEventListener('click', async event => {
    const copyButton = event.target.closest('[data-copy-link]');
    if (copyButton) {
      const link = copyButton.dataset.copyLink;
      try {
        await navigator.clipboard.writeText(link);
        showToast('Link de pagamento com UTM copiado!');
        const prev = copyButton.textContent;
        copyButton.textContent = 'Link copiado!';
        setTimeout(() => { copyButton.textContent = prev; }, 2000);
      } catch (_) {
        prompt('Copie o link com sua UTM:', link);
      }
      return;
    }

    const claimButton = event.target.closest('[data-claim-payment]');
    const stageButton = event.target.closest('[data-recovery-stage]');
    const button = claimButton || stageButton;
    if (!button || button.disabled) return;
    if (demoMode) {
      if (claimButton) {
        showToast('Contato atribuído a você (modo demonstração).');
        claimButton.disabled = true;
        claimButton.className = 'button button-quiet';
        claimButton.textContent = 'Com você';
        const actions = claimButton.closest('.recovery-actions');
        if (actions) {
          const trackedLink = buildTrackedCheckoutUrl('40k', 'Demonstração', 'DEMO-PAY-1');
          const waLink = whatsappUrl('11999998888', 'Thiago Mendes', 'Plano 40k', trackedLink);
          actions.insertAdjacentHTML('beforeend', `<a class="button button-whatsapp" href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a><button class="button button-quiet button-copy-link" type="button" data-copy-link="${escapeHtml(trackedLink)}">Copiar link UTM</button><button class="button button-quiet" type="button" data-recovery-stage="sent">Marcar enviado</button><button class="button button-quiet" type="button" data-recovery-stage="finished">Encerrar atendimento</button>`);
        }
      } else if (stageButton) {
        showToast('Status atualizado (modo demonstração).');
        if (button.dataset.recoveryStage === 'finished') {
          button.closest('article')?.remove();
          const current = Math.max(0, (parseInt(recoveryCount.textContent, 10) || 1) - 1);
          recoveryCount.textContent = String(current);
          document.getElementById('nav-recovery-count').textContent = String(current);
          document.getElementById('home-recovery-count').textContent = String(current);
        } else if (button.dataset.recoveryStage === 'sent') {
          button.remove();
        }
      }
      return;
    }
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = claimButton ? 'Atribuindo…' : 'Salvando…';
    try {
      const { response, data } = await apiRequest(claimButton ? '/api/support/recoveries/claim' : '/api/support/recoveries/status', {
        method: 'POST', body: JSON.stringify({
          paymentId: claimButton ? button.dataset.claimPayment : button.dataset.paymentId,
          ...(stageButton ? { stage: button.dataset.recoveryStage } : {}),
        }),
      });
      if (!response.ok) throw new Error(data.message || 'Não foi possível assumir o contato.');
      showToast(data.message || 'Contato atribuído a você.');
      await Promise.all([loadRecoveries(), loadRecoveryDashboard(), loadCommissions()]);
    } catch (error) {
      showToast(error.message || 'Falha ao atualizar o contato.', 'error');
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  document.getElementById('refresh-recovery-dashboard').addEventListener('click', loadRecoveryDashboard);

  async function loadRecoveryDashboard() {
    const agent = sessionStorage.getItem(AGENT_KEY) || '';
    document.getElementById('recovery-dashboard-agent').textContent = agent ? `Atendente: ${agent}` : '';
    if (demoMode) {
      document.getElementById('recovery-stat-assumed').textContent = '3';
      document.getElementById('recovery-stat-sent').textContent = '2';
      document.getElementById('recovery-stat-finished').textContent = '1';
      document.getElementById('recovery-stat-sold').textContent = '1';
      document.getElementById('home-recovery-sold').textContent = '1';
      document.getElementById('recovery-stat-commission').textContent = 'R$ 39,80';
      recoveryDashboardList.innerHTML = `
        <article class="recovery-ledger-row"><div><b>Rodrigo Pires</b><small>rodrigo.p@exemplo.com</small><span>Plano 40k · venda confirmada em 18/10/2026 19:40 · comissão R$ 39,80</span></div><strong class="recovery-stage-recovered">Venda recuperada</strong></article>
        <article class="recovery-ledger-row"><div><b>Gabriel Costa</b><small>gabriel.c@exemplo.com</small><span>Plano 20k · assumido em 18/10/2026 21:00</span></div><strong class="recovery-stage-claimed">Contato assumido</strong></article>`;
      return;
    }
    recoveryDashboardList.innerHTML = '<div class="empty-state"><span class="spinner"></span><b>Carregando seu desempenho…</b></div>';
    try {
      const { response, data } = await apiRequest('/api/support/recovery-dashboard');
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar o dashboard.');
      const totals = data.totals || {};
      document.getElementById('recovery-stat-assumed').textContent = String(totals.assumed || 0);
      document.getElementById('recovery-stat-sent').textContent = String(totals.sent || 0);
      document.getElementById('recovery-stat-finished').textContent = String(totals.finished || 0);
      document.getElementById('recovery-stat-sold').textContent = String(totals.sold || 0);
      document.getElementById('home-recovery-sold').textContent = String(totals.sold || 0);
      document.getElementById('recovery-stat-commission').textContent = formatMoney(totals.commission || 0);
      const leads = data.leads || [];
      if (!leads.length) {
        recoveryDashboardList.innerHTML = '<div class="empty-state"><b>Nenhum contato assumido ainda</b><span>Assuma um pagamento expirado para acompanhar o atendimento aqui.</span></div>';
        return;
      }
      const stageLabels = { claimed: 'Contato assumido', sent: 'Mensagem enviada', finished: 'Atendimento encerrado', recovered: 'Venda recuperada' };
      recoveryDashboardList.innerHTML = leads.map(lead => {
        const stage = lead.recoveredAt || lead.recoveredPaymentId ? 'recovered' : (lead.recoveryStage || 'claimed');
        const attribution = [];
        if (lead.sentAt) attribution.push(`mensagem enviada por ${escapeHtml(lead.contactSentBy || lead.recoveryAgent || 'atendente')} em ${escapeHtml(formatDate(lead.sentAt))}`);
        if (lead.recoveryFinishedAt) attribution.push(`encerrado por ${escapeHtml(lead.recoveryFinishedBy || lead.recoveryAgent || 'atendente')} em ${escapeHtml(formatDate(lead.recoveryFinishedAt))}`);
        if (stage === 'recovered') attribution.push(`venda confirmada em ${escapeHtml(formatDate(lead.recoveredAt))}`);
        if (!attribution.length) attribution.push(`assumido em ${escapeHtml(formatDate(lead.claimedAt))}`);
        const commission = Number(lead.commissionAmount) > 0
          ? ` · comissão ${escapeHtml(formatMoney(lead.commissionAmount))}`
          : '';
        return `<article class="recovery-ledger-row"><div><b>${escapeHtml(lead.name || 'Cliente')}</b><small>${escapeHtml(lead.email || '')}</small><span>${escapeHtml(lead.productName || lead.recoveredPlan || 'Compra')} · ${attribution.join(' · ')}${commission}</span></div><strong class="recovery-stage-${escapeHtml(stage)}">${escapeHtml(stageLabels[stage] || 'Em andamento')}</strong></article>`;
      }).join('');
    } catch (error) {
      recoveryDashboardList.innerHTML = `<div class="empty-state error-text"><b>Não foi possível carregar</b><span>${escapeHtml(error.message)}</span></div>`;
    }
  }

  async function loadCommissions() {
    if (demoMode) {
      document.getElementById('commission-available').textContent = 'R$ 39,80';
      document.getElementById('home-commission-value').textContent = 'R$ 39,80';
      document.getElementById('commission-paid').textContent = 'R$ 0,00';
      document.getElementById('commission-review').textContent = '0';
      commissionList.innerHTML = `
        <article class="commission-row"><div><b>Plano 40k</b><span>18/10/2026 19:40 · Disponível para pagamento</span></div><strong>R$ 39,80</strong></article>`;
      return;
    }
    commissionList.innerHTML = '<div class="empty-state"><span class="spinner"></span><b>Carregando comissões…</b></div>';
    try {
      const { response, data } = await apiRequest('/api/support/commissions');
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar comissões.');
      const totals = data.totals || {};
      document.getElementById('commission-available').textContent = formatMoney(totals.disponivel || 0);
      document.getElementById('home-commission-value').textContent = formatMoney(totals.disponivel || 0);
      document.getElementById('commission-paid').textContent = formatMoney(totals.pago || 0);
      document.getElementById('commission-review').textContent = String(totals.revisar || 0);
      const commissions = data.commissions || [];
      if (!commissions.length) {
        commissionList.innerHTML = '<div class="empty-state"><b>Nenhuma venda recuperada ainda</b><span>As comissões aparecem quando uma nova compra do cliente for confirmada.</span></div>';
        return;
      }
      const labels = { disponivel: 'Disponível para pagamento', pago: 'Pago', estornada: 'Estornada', revisar: 'Valor em revisão' };
      commissionList.innerHTML = commissions.map(item => `<article class="commission-row"><div><b>${escapeHtml(item.recoveredPlan || item.plan || 'Venda recuperada')}</b><span>${escapeHtml(formatDate(item.recoveredAt))} · ${escapeHtml(labels[item.commissionStatus] || item.commissionStatus || 'Em análise')}</span></div><strong>${escapeHtml(formatMoney(item.commissionAmount))}</strong></article>`).join('');
    } catch (error) {
      commissionList.innerHTML = `<div class="empty-state error-text"><b>Não foi possível carregar</b><span>${escapeHtml(error.message)}</span></div>`;
    }
  }

  document.getElementById('refresh-commissions').addEventListener('click', loadCommissions);

  document.getElementById('refresh-expired-history').addEventListener('click', () => loadExpiredHistory(true));
  expiredHistoryMore.addEventListener('click', () => loadExpiredHistory(false));

  async function loadExpiredHistory(reset = false) {
    if (expiredHistoryLoading) return;
    expiredHistoryLoading = true;
    if (demoMode) {
      expiredHistoryTotal.textContent = '3';
      expiredHistoryList.innerHTML = `
        <article class="history-payment-row"><div class="history-payment-main"><b>Thiago Mendes</b><small>thiago.m@exemplo.com</small><span>Plano 40k · R$ 199,00 · PIX · expirou 18/10/2026 22:15</span></div><span class="payment-status-pill expired">Expirado</span></article>
        <article class="history-payment-row"><div class="history-payment-main"><b>Gabriel Costa</b><small>gabriel.c@exemplo.com</small><span>Plano 20k · R$ 99,00 · PIX · expirou 18/10/2026 20:30</span></div><span class="payment-status-pill expired">Expirado</span></article>
        <article class="history-payment-row"><div class="history-payment-main"><b>Rodrigo Pires</b><small>rodrigo.p@exemplo.com</small><span>Plano 40k · R$ 199,00 · Cartão · expirou 18/10/2026 18:20</span></div><span class="payment-status-pill expired">Expirado</span></article>`;
      expiredHistoryMore.classList.add('hidden');
      expiredHistoryLoaded = true;
      expiredHistoryLoading = false;
      return;
    }
    if (reset) {
      expiredHistoryOffset = 0;
      expiredHistoryList.innerHTML = '<div class="empty-state"><span class="spinner"></span><b>Carregando histórico de expirados…</b></div>';
    } else {
      expiredHistoryMore.disabled = true;
      expiredHistoryMore.textContent = 'Carregando…';
    }
    try {
      const params = new URLSearchParams({ limit: String(expiredHistoryPageSize), offset: String(expiredHistoryOffset) });
      const { response, data } = await apiRequest(`/api/support/payments/expired-history?${params}`);
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar os pagamentos expirados.');
      const payments = data.payments || [];
      const rows = payments.map(payment => `<article class="history-payment-row"><div class="history-payment-main"><b>${escapeHtml(payment.name || 'Cliente')}</b><small>${escapeHtml(payment.email || '')}</small><span>${escapeHtml(payment.productName || payment.plan || 'Compra')} · ${escapeHtml(formatMoney(payment.amount))} · ${escapeHtml(payment.paymentMethod || 'Pagamento')} · expirou ${escapeHtml(formatDate(payment.eventAt || payment.createdAt))}</span></div><span class="payment-status-pill expired">Expirado</span></article>`).join('');
      if (reset) expiredHistoryList.innerHTML = rows;
      else expiredHistoryList.insertAdjacentHTML('beforeend', rows);
      expiredHistoryOffset += payments.length;
      expiredHistoryTotal.textContent = String(data.total || 0);
      expiredHistoryMore.classList.toggle('hidden', !data.hasMore);
      expiredHistoryMore.disabled = false;
      expiredHistoryMore.textContent = 'Carregar mais';
      if (!payments.length && reset) expiredHistoryList.innerHTML = '<div class="empty-state"><b>Nenhum pagamento expirado no histórico</b><span>Pagamentos pagos e pendentes não aparecem nesta tela.</span></div>';
      expiredHistoryLoaded = true;
    } catch (error) {
      expiredHistoryMore.disabled = false;
      expiredHistoryMore.textContent = 'Carregar mais';
      expiredHistoryLoaded = false;
      if (reset) expiredHistoryList.innerHTML = `<div class="empty-state error-text"><b>Não foi possível carregar</b><span>${escapeHtml(error.message)}</span></div>`;
    } finally {
      expiredHistoryLoading = false;
    }
  }

  async function loadCustomers(query) {
    const requestSequence = ++searchSequence;
    if (demoMode) {
      const term = String(query || '').trim().toLowerCase();
      const customers = demoCustomers.filter(customer =>
        [customer.name, customer.email, customer.key, customer.plan, customer.activityLabel]
          .filter(Boolean).some(value => value.toLowerCase().includes(term)),
      );
      renderCustomerRows(customers);
      return;
    }
    customersList.innerHTML = '<div class="empty-state"><span class="spinner"></span><b>Buscando clientes…</b><span>Consultando compras novas e antigas.</span></div>';
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (query) params.set('q', query);
      const { response, data } = await apiRequest(`/api/support/customers?${params}`);
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar as compras.');
      if (requestSequence !== searchSequence) return;
      renderCustomerRows(data.customers || []);
    } catch (error) {
      if (requestSequence === searchSequence && sessionStorage.getItem(TOKEN_KEY)) customersList.innerHTML = `<div class="empty-state error-text"><b>Não foi possível buscar</b><span>${escapeHtml(error.message)}</span></div>`;
    }
  }

  function renderCustomerRows(customers) {
    allCustomers = customers;
    const active = customers.filter(customer => customer.keyStatus === 'active').length;
    statCustomers.textContent = String(customers.length);
    statActive.textContent = String(active);
    const visible = activeFilter === 'active'
      ? customers.filter(customer => customer.keyStatus === 'active')
      : activeFilter === 'pending'
        ? customers.filter(customer => isPending(customer.keyStatus))
        : customers;
    resultCount.textContent = String(visible.length);
    document.getElementById('results-note').textContent = searchInput.value.trim()
      ? 'Busca feita em compras, contas e licenças antigas.'
      : 'Exibindo os cadastros recentes; use a busca para encontrar qualquer cliente.';
    if (!visible.length) {
      customersList.innerHTML = `<div class="empty-state"><span class="empty-icon">⌕</span><b>${customers.length ? 'Nenhum cliente neste filtro' : 'Nenhum cliente encontrado'}</b><span>${customers.length ? 'Escolha “Todos” ou busque outro cliente.' : 'Confira o nome, o e-mail ou a key e tente novamente.'}</span></div>`;
      return;
    }
    customersList.innerHTML = visible.map(customer => {
      const badge = customer.keyStatus === 'active' ? 'active' : customer.keyStatus === 'expired' ? 'expired' : 'neutral';
      const ref = customer.ref || customer.email || customer.key || '';
      const refType = customer.refType || (customer.email ? 'email' : 'key');
      const isSelected = selectedCustomer && ((selectedCustomer.email && selectedCustomer.email.toLowerCase() === String(customer.email || '').toLowerCase()) || (selectedCustomer.key && selectedCustomer.key === ref));
      return `<button class="customer-card ${isSelected ? 'selected' : ''}" type="button" data-ref="${escapeHtml(ref)}" data-ref-type="${escapeHtml(refType)}">
        <span class="customer-avatar">${escapeHtml((customer.name || customer.email || 'A').slice(0, 1).toUpperCase())}</span>
        <span class="customer-card-main"><b>${escapeHtml(customer.name || 'Cliente sem nome')}</b><small>${escapeHtml(customer.email || 'Cadastro antigo • localizado pela key')}</small><span class="customer-card-plan">${escapeHtml(customer.plan || customer.activityLabel || (customer.refType === 'key' ? 'Licença antiga' : 'Sem plano vinculado'))}</span></span>
        <span class="customer-card-state"><span class="status-badge ${badge}"><i></i>${escapeHtml(statusLabel(customer.keyStatus))}</span><span class="card-arrow">›</span></span>
      </button>`;
    }).join('');
  }

  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    loadCustomers(searchInput.value.trim());
  });
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadCustomers(searchInput.value.trim()), 280);
  });
  searchInput.addEventListener('search', () => loadCustomers(searchInput.value.trim()));

  document.querySelector('.filter-row').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeFilter = button.dataset.filter;
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('selected', chip === button));
    renderCustomerRows(allCustomers);
  });

  customersList.addEventListener('click', event => {
    const button = event.target.closest('[data-ref]');
    if (button) showCustomer({ ref: button.dataset.ref, refType: button.dataset.refType });
  });

  async function showCustomer(reference) {
    const ref = typeof reference === 'string' ? { ref: reference, refType: 'email' } : reference;
    if (!ref || !ref.ref) return;
    if (demoMode) {
      const customer = demoCustomers.find(item => ref.refType === 'key' ? item.key === ref.ref : item.email === ref.ref);
      if (!customer) return;
      selectedCustomer = customer;
      renderCustomerRows(allCustomers);
      renderCustomer(customer);
      return;
    }
    detailPanel.innerHTML = '<div class="detail-placeholder"><div class="spinner"></div><p class="muted">Carregando cadastro…</p></div>';
    try {
      const param = ref.refType === 'key' ? 'key' : 'email';
      const { response, data } = await apiRequest(`/api/support/customer?${param}=${encodeURIComponent(ref.ref)}`);
      if (!response.ok) throw new Error(data.message || 'Não foi possível abrir o cadastro.');
      selectedCustomer = data.customer;
      renderCustomerRows(allCustomers);
      renderCustomer(selectedCustomer);
    } catch (error) {
      if (sessionStorage.getItem(TOKEN_KEY)) detailPanel.innerHTML = `<div class="detail-placeholder"><h2>Não foi possível carregar</h2><p class="error-text">${escapeHtml(error.message)}</p></div>`;
    }
  }

  function renderCustomer(customer) {
    const statusClass = customer.keyStatus === 'active' ? 'active' : customer.keyStatus === 'expired' ? 'expired' : 'neutral';
    const customerName = customer.name || 'Cliente';
    const customerEmail = customer.email || 'E-mail não cadastrado';
    const resetSummary = customer.key
      ? (customer.resetsLeft === null ? `${customer.resetsUsed} reset(s) nos últimos 30 dias` : `${customer.resetsLeft} reset(s) restante(s) nos últimos 30 dias`)
      : 'Pagamento sem licença vinculada';
    const history = (customer.activity || []).length
      ? customer.activity.map(item => `<div class="history-row"><span class="history-dot"></span><div class="history-content"><div class="history-title"><b>${escapeHtml(item.category)}</b><span class="event-status ${escapeHtml(item.status || '')}">${escapeHtml(activityStatusLabel(item.status))}</span></div><small>${escapeHtml([item.detail, item.agent ? `Atendido por ${item.agent}` : '', formatDate(item.at)].filter(Boolean).join(' · '))}</small></div></div>`).join('')
      : '<div class="history-empty">Nenhum atendimento anterior registrado.</div>';
    const resetDisabled = customer.keyStatus !== 'active' || !customer.hwidBound;
    detailPanel.innerHTML = `
      <div class="detail-heading">
        <div class="avatar">${escapeHtml(customerName.slice(0, 1).toUpperCase())}</div>
        <div class="detail-title"><div class="eyebrow">CADASTRO DO CLIENTE</div><h2>${escapeHtml(customerName)}</h2><p>${escapeHtml(customerEmail)}</p></div>
        <span class="status-badge ${statusClass}"><i></i>${escapeHtml(statusLabel(customer.keyStatus))}</span>
      </div>
      <div class="detail-stats">
        <div class="mini-stat"><span>PLANO</span><b>${escapeHtml(customer.plan || '—')}</b></div>
        <div class="mini-stat"><span>RESETS EM 30 DIAS</span><b>${escapeHtml(String(customer.resetsUsed || 0))}</b></div>
        <div class="mini-stat"><span>VALIDADE</span><b>${escapeHtml(customer.expiresAt ? formatDate(customer.expiresAt) : customer.keyStatus === 'active' ? 'Vitalícia' : '—')}</b></div>
      </div>
      <div class="license-block"><div><span class="eyebrow">LICENÇA ALMAZ</span><code>${escapeHtml(customer.key || 'Sem key vinculada')}</code></div><button class="button button-quiet copy-key" type="button" ${customer.key ? '' : 'disabled'}>Copiar key</button></div>
      <div class="device-row"><div><b>Vínculo de computador</b><span>${customer.hwidBound ? 'Atualmente vinculado a um computador' : 'Nenhum computador vinculado'}</span></div><span class="device-state ${customer.hwidBound ? 'bound' : ''}">${customer.hwidBound ? 'VINCULADO' : 'LIVRE'}</span></div>
      <div class="reset-action"><div><b>Troca de computador</b><p>${escapeHtml(resetSummary)}</p></div><button class="button button-primary" id="open-reset" type="button" ${resetDisabled ? 'disabled' : ''}>Resetar vínculo <span>↻</span></button></div>
      <div class="history-block"><div class="panel-heading compact"><div><div class="eyebrow">ATENDIMENTOS</div><h3>Histórico de suporte</h3></div><span class="history-count">${(customer.activity || []).length}</span></div><div class="history-list">${history}</div></div>`;

    detailPanel.querySelector('.copy-key')?.addEventListener('click', async () => {
      if (demoMode) {
        showToast('Key de exemplo. A cópia está desativada na prévia.', 'error');
        return;
      }
      try {
        await navigator.clipboard.writeText(customer.key);
        showToast('Key copiada.');
      } catch (_) {
        showToast('Não foi possível copiar a key.', 'error');
      }
    });
    detailPanel.querySelector('#open-reset')?.addEventListener('click', () => {
      document.getElementById('reset-target').textContent = `${customer.email || 'Cadastro encontrado pela key'} · ${customer.key}`;
      resetReason.value = '';
      resetDialog.showModal();
      resetReason.focus();
    });
  }

  resetForm.addEventListener('submit', async event => {
    if (event.submitter?.value !== 'confirm') return;
    event.preventDefault();
    if (!selectedCustomer || !resetReason.value.trim()) return;
    const confirmButton = document.getElementById('confirm-reset');
    confirmButton.disabled = true;
    confirmButton.textContent = 'Aplicando…';
    try {
      if (demoMode) {
        selectedCustomer.hwidBound = false;
        selectedCustomer.resetsUsed += 1;
        selectedCustomer.resetsLeft = Math.max(0, selectedCustomer.resetsLeft - 1);
        selectedCustomer.activity.unshift({
          category: 'Troca de computador', status: 'done', at: new Date().toISOString(),
          detail: resetReason.value.trim(), agent: 'Demonstração',
        });
        resetDialog.close();
        renderCustomer(selectedCustomer);
        showToast('Simulação concluída. Nenhum dado real foi alterado.');
        await loadCustomers(searchInput.value.trim());
        return;
      }
      const { response, data } = await apiRequest('/api/support/reset-hwid', {
        method: 'POST',
        body: JSON.stringify({ email: selectedCustomer.email || '', key: selectedCustomer.key || '', reason: resetReason.value.trim() }),
      });
      if (!response.ok) throw new Error(data.message || 'Não foi possível resetar o vínculo.');
      resetDialog.close();
      showToast(data.message || 'Vínculo resetado.');
      await showCustomer({ ref: selectedCustomer.key || selectedCustomer.email, refType: selectedCustomer.key ? 'key' : 'email' });
      await loadCustomers(searchInput.value.trim());
    } catch (error) {
      showToast(error.message || 'Falha ao resetar vínculo.', 'error');
    } finally {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Confirmar reset';
    }
  });

  document.getElementById('reset-dialog').addEventListener('click', event => {
    if (event.target === resetDialog) resetDialog.close();
  });

  if (demoMode) {
    document.getElementById('local-preview-note').classList.add('hidden');
    document.querySelector('.login-foot').classList.add('hidden');
    document.getElementById('demo-banner').classList.remove('hidden');
    setAuthenticated('Demonstração');
    loadCustomers('');
    loadFeedbacks();
    loadRecoveries();
    loadRecoveryDashboard();
    loadCommissions();
    showCustomer(demoCustomers[0].email);
  } else {
    connectWithStoredToken();
  }
})();
