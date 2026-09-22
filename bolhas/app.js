/* ALMAZ BUBBLES: apoio comum do painel, do login e da partida. */
(function () {
  'use strict';
  // As páginas ficam no site estático (GitHub Pages); a API fica no servidor
  // dos membros no Render, igual à votação.
  const API = location.hostname.endsWith('onrender.com') ? location.origin : 'https://keys-server-9zq2.onrender.com';
  const CHAVE = 'almazBolhasToken';

  const token = () => { try { return localStorage.getItem(CHAVE) || ''; } catch (e) { return ''; } };
  const salvarToken = (t) => { try { t ? localStorage.setItem(CHAVE, t) : localStorage.removeItem(CHAVE); } catch (e) {} };

  async function api(caminho, corpo, metodo) {
    const h = { 'Content-Type': 'application/json' };
    const t = token(); if (t) h.Authorization = 'Bearer ' + t;
    const r = await fetch(API + '/api/bolhas' + caminho, {
      method: metodo || (corpo ? 'POST' : 'GET'), headers: h, body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && j.sair) { salvarToken(''); irParaEntrar(); throw new Error(j.message); }
    if (!r.ok || !j.success) throw new Error(j.message || 'Falha na conexão. Tente de novo.');
    return j;
  }

  /** Pedido que sobrevive à página fechando (desistência da partida). */
  function apiAoSair(caminho) {
    try {
      fetch(API + '/api/bolhas' + caminho, {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: '{}',
      });
    } catch (e) {}
  }

  function raizBolhas() {
    const i = location.pathname.indexOf('/bolhas/');
    return i >= 0 ? location.pathname.slice(0, i + 8) : '/bolhas/';
  }
  function irParaEntrar() {
    const ref = new URLSearchParams(location.search).get('ref');
    location.href = raizBolhas() + 'entrar/' + (ref ? '?ref=' + encodeURIComponent(ref) : '');
  }

  const fmt = (n) => Math.floor(Number(n) || 0).toLocaleString('pt-BR');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GEMA = 'R$ ';
  const SVG_GEMA = '<svg width="0" height="0" style="position:absolute"><defs>'
    + '<linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff7ff"/><stop offset=".5" stop-color="#5eb8ff"/><stop offset="1" stop-color="#b44dff"/></linearGradient>'
    + '<symbol id="gema" viewBox="0 0 32 32"><path d="M8 4h16l6 8-14 17L2 12z" fill="url(#gg)"/><path d="M2 12h28M8 4l4 8 4-8 4 8 4-8M12 12l4 17 4-17" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/></symbol>'
    + '</defs></svg>';
  document.addEventListener('DOMContentLoaded', () => document.body.insertAdjacentHTML('afterbegin', SVG_GEMA));

  let tt;
  function toast(msg) {
    let e = document.getElementById('toast-geral');
    if (!e) { e = document.createElement('div'); e.id = 'toast-geral'; e.className = 'toast-geral'; document.body.appendChild(e); }
    e.textContent = msg; e.classList.add('on');
    clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 2800);
  }

  function copiar(txt) {
    if (navigator.clipboard) return navigator.clipboard.writeText(txt).then(() => toast('Copiado!'), () => toast(txt));
    toast(txt);
  }

  const dataCurta = (iso) => { try { const d = new Date(iso); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

  window.Bolhas = { API, api, apiAoSair, token, salvarToken, irParaEntrar, raizBolhas, fmt, esc, GEMA, toast, copiar, dataCurta };
})();

