/* ============================================================================
   ALMAZ · GATE DO FIX  —  "comenta para liberar"
   ----------------------------------------------------------------------------
   Trava o Passo 02 (Fix) e o Passo 03 (Denuvo) até o cliente seguir o
   perfil e comentar com foto num vídeo da conta NOVA do Instagram.

   REGRA (16/09/2026): a conta antiga foi perdida e os comentários foram
   junto, então o fixUnlocked que o servidor devolve (gravado na época da
   conta antiga) NÃO libera mais nada aqui. O comentário entra EM ANÁLISE
   e só destrava quando o admin aprova no painel (feedbackStatus 'aprovado').

   Cada cliente cai SEMPRE no mesmo vídeo (hash do e-mail), pra não ficar
   fechando e abrindo até achar um que já comentou.

   Usado por: membro_FINAL, membro_20k_FINAL, membro_1k_FINAL e as antigas.
   Backend: POST /api/feedback-unlock (grava o @ pra conferir no painel)
   ========================================================================== */

/* ┌──────────────────────────────────────────────────────────────────────────┐
   │  ✏️  EDITE AQUI — é só isto que você precisa mexer pra trocar os vídeos.  │
   │                                                                          │
   │  Cole o link direto do POST/REEL (não o link do perfil).                  │
   │  Pode ter quantos quiser: 3, 10, 50. A divisão se ajusta sozinha.         │
   │  rede: 'instagram' ou 'facebook'                                          │
   └──────────────────────────────────────────────────────────────────────────┘ */
// Vídeos atuais para os comentários exigidos no launcher e na área de membros.
const ALMAZ_VIDEOS = [
  { rede: 'instagram', url: 'https://www.instagram.com/reel/Dej2ACUERqE/?utm_source=ig_web_copy_link&rpxt=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==' },
  { rede: 'instagram', url: 'https://www.instagram.com/p/DemVLRRDrtg/?utm_source=ig_web_copy_link&obrf=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==' },
  { rede: 'instagram', url: 'https://www.instagram.com/reel/Dek3cksAHEw/?utm_source=ig_web_copy_link&srtk=MzRlODBiNWFlZA==' },
  { rede: 'instagram', url: 'https://www.instagram.com/p/DejoVrWFRvK/?utm_source=ig_web_copy_link&mdxt=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==' },
  { rede: 'instagram', url: 'https://www.instagram.com/reel/DejmQy4jw7e/?utm_source=ig_web_copy_link&psln=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==' },
  { rede: 'instagram', url: 'https://www.instagram.com/reel/DejlrTOieoZ/?utm_source=ig_web_copy_link&mdxt=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==' },
  { rede: 'instagram', url: 'https://www.instagram.com/reel/DeiBz28pasm/?utm_source=ig_web_copy_link&mdxt=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==' },
  { rede: 'instagram', url: 'https://www.instagram.com/reel/DeiBlQGpF0u/?utm_source=ig_web_copy_link&dlrf=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==' },
];
/* Perfil que o cliente tem que seguir. Só o @, sem a arroba.
   Vazio esconde o passo de seguir inteiro. */
const ALMAZ_PERFIL = 'almaz.steam';

/* Print que serve de exemplo de "comentario con foto + texto". */
const ALMAZ_EXEMPLO_IMG = 'https://i.imgur.com/bB4WPfb.jpeg';

/* ========================================================================== */

(function () {
  'use strict';

  const REDES = {
    instagram: {
      nome: 'Instagram',
      icone: 'fa-brands fa-instagram',
      grad: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)',
      cor: '#dc2743',
    },
    facebook: {
      nome: 'Facebook',
      icone: 'fa-brands fa-facebook',
      grad: 'linear-gradient(45deg,#0866ff,#1877f2)',
      cor: '#1877f2',
    },
  };

  function sessao() {
    try { return JSON.parse(localStorage.getItem('almaz_user') || 'null') || {}; }
    catch { return {}; }
  }

  /* ---------- estado do feedback ----------
     '' (nunca comentou na conta nova) | 'analise' | 'aprovado' | 'recusado'.
     Vem do servidor (/api/feedback-status). Só 'aprovado' destrava. */
  let estado = '';
  let abrirDepois = 'bypass';   // qual modal abrir quando for aprovado

  /* ---------- vídeo FIXO por cliente ----------
     FNV-1a do e-mail, módulo o tamanho da lista. O mesmo cliente sempre cai
     no mesmo vídeo, e os clientes se espalham por igual entre os vídeos. */
  function videoDoCliente() {
    const n = ALMAZ_VIDEOS.length;
    if (!n) return null;
    let id = String(sessao().email || '').trim().toLowerCase();
    if (!id) {
      try {
        id = localStorage.getItem('almaz_gate_id') || '';
        if (!id) { id = String(Math.random()).slice(2); localStorage.setItem('almaz_gate_id', id); }
      } catch { id = String(Math.random()); }
    }
    let h = 0x811c9dc5;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ALMAZ_VIDEOS[h % n];
  }

  /* ---------- estilo ---------- */
  const CSS = `
    .step.locked-fb { opacity: .55; position: relative; }
    .step.locked-fb .step-go { display: none; }
    .step.locked-fb::before {
      content: '\\f023'; font-family: 'Font Awesome 6 Free'; font-weight: 900;
      position: absolute; top: 12px; right: 14px; font-size: .8rem;
      color: var(--gold, #fbbf24);
    }
    .step.locked-fb .step-kicker::after {
      content: ' · comenta para liberar'; color: var(--gold, #fbbf24);
    }

    .gate-hero {
      text-align: center; padding: 4px 0 20px;
    }
    .gate-hero .gate-emoji { font-size: 2.4rem; line-height: 1; display: block; margin-bottom: 10px; }
    .gate-hero h4 {
      font-family: var(--head, sans-serif); color: #fff; font-size: 1.25rem;
      margin: 0 0 8px; line-height: 1.3;
    }
    .gate-hero p { color: var(--muted, #8a8a94); font-size: .9rem; line-height: 1.65; margin: 0; }
    .gate-hero p b { color: #fff; }

    .gate-card {
      border-radius: 14px; padding: 18px; margin: 18px 0;
      background: var(--card-2, #16161b); border: 1px solid var(--border, #232329);
      position: relative; overflow: hidden;
    }
    .gate-card::after {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      background: var(--gate-grad);
    }
    .gate-card-top {
      display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
    }
    .gate-badge {
      width: 42px; height: 42px; border-radius: 11px; flex: none;
      display: grid; place-items: center; color: #fff; font-size: 1.15rem;
      background: var(--gate-grad);
    }
    .gate-card-top .t { flex: 1; }
    .gate-card-top .t .k {
      font-size: .64rem; font-weight: 800; letter-spacing: 1.4px;
      text-transform: uppercase; color: var(--gate-cor);
    }
    .gate-card-top .t .v {
      font-family: var(--head, sans-serif); color: #fff; font-size: 1rem; margin-top: 2px;
    }
    .gate-card > p {
      color: var(--muted, #8a8a94); font-size: .84rem; line-height: 1.6; margin: 0 0 14px;
    }
    .gate-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 15px; border-radius: 10px; font-weight: 800;
      border: none; cursor: pointer; font-size: .9rem; text-transform: uppercase;
      letter-spacing: .3px; color: #fff; text-decoration: none;
      background: var(--gate-grad); transition: .2s;
    }
    .gate-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }

    .gate-passos { display: grid; gap: 10px; margin: 18px 0; }
    .gate-passo {
      display: flex; gap: 12px; align-items: flex-start;
      font-size: .86rem; color: var(--muted, #8a8a94); line-height: 1.55;
    }
    .gate-passo b { color: #fff; }
    .gate-passo .n {
      flex: none; width: 22px; height: 22px; border-radius: 50%;
      background: rgba(255,255,255,.07); border: 1px solid var(--border-2, #34343d);
      color: #fff; font-size: .72rem; font-weight: 800;
      display: grid; place-items: center; margin-top: 1px;
    }

    .gate-exemplo-tit {
      font-size: .72rem; font-weight: 800; letter-spacing: 1.2px;
      text-transform: uppercase; color: #fff; margin: 4px 0 -4px;
    }
    .gate-exemplo {
      display: block; border-radius: 10px; overflow: hidden;
      border: 1px solid rgba(255,255,255,.12); margin: 14px 0;
    }
    .gate-exemplo img { width: 100%; display: block; }
    .gate-legenda {
      font-size: .78rem; color: var(--muted-2, #5c5c66); text-align: center;
      margin: -6px 0 18px;
    }

    .step.analise-fb .step-kicker::after { content: ' · en revisión'; }

    .gate-aviso {
      margin: 14px 0; padding: 12px 14px; border-radius: 10px;
      background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3);
      color: #fca5a5; font-size: .82rem; line-height: 1.55;
      display: flex; gap: 10px; align-items: flex-start;
    }
    .gate-aviso b { color: #fff; }
    .gate-seguir {
      margin: 0 0 4px;
      --gate-grad: linear-gradient(45deg,#f09433,#dc2743,#bc1888);
    }
    .gate-voltar {
      display: block; width: 100%; margin-top: 10px; padding: 12px;
      background: transparent; border: 1px solid var(--border-2, #34343d);
      border-radius: 10px; color: var(--muted, #8a8a94); font-weight: 700;
      cursor: pointer; font-size: .85rem;
    }
    .gate-voltar:hover { color: #fff; border-color: #fff; }

    .gate-obrigado {
      margin-top: 16px; padding: 12px 14px; border-radius: 10px;
      background: rgba(251,191,36,.07); border: 1px solid rgba(251,191,36,.25);
      color: var(--gold, #fbbf24); font-size: .8rem; line-height: 1.55;
      display: flex; gap: 10px; align-items: flex-start;
    }
  `;

  /* ---------- markup ---------- */

  // O CSS entra assim que a página carrega, e não junto com o modal: o cadeado
  // e o "comenta para liberar" aparecem nos cards antes de alguém abrir o gate.
  let cssPronto = false;
  function injetarCSS() {
    if (cssPronto) return;
    cssPronto = true;
    const est = document.createElement('style');
    est.textContent = CSS;
    document.head.appendChild(est);
  }

  function montarModal() {
    if (document.getElementById('modal-feedback')) return;

    const dlg = document.createElement('dialog');
    dlg.id = 'modal-feedback';
    dlg.innerHTML = `
      <div class="modal-header">
        <h3>Liberar el Fix y el Bypass Denuvo</h3>
        <button class="modal-close" onclick="document.getElementById('modal-feedback').close()">✕</button>
      </div>
      <div class="modal-body">

        <!-- TELA 1: o pedido -->
        <div id="gate-v-form">
          <div class="gate-hero">
            <span class="gate-emoji">🔓</span>
            <h4>Comenta para liberar el Fix y el Bypass Denuvo</h4>
            <p>ALMAZ perdió la cuenta de Instagram y todos los comentarios que ustedes ya dejaron se fueron con ella. Estamos reconstruyendo desde cero en el perfil nuevo y contamos con la colaboración de ustedes una vez más.
               <b>Después de aprobado, el acceso queda liberado para siempre.</b></p>
          </div>

          <div class="gate-aviso" id="gate-recusado" style="display:none">
            <i class="fa-solid fa-circle-xmark" style="margin-top:2px"></i>
            <span>Tu último comentario <b>no fue aprobado</b>. Tiene que estar en el video de abajo, con la captura de tus juegos adjunta. Comenta de nuevo como se pide y envíalo otra vez.</span>
          </div>

          <div id="gate-video-box"></div>

          <div class="gate-exemplo-tit">📸 Ejemplo de comentario aprobado</div>
          <a href="${ALMAZ_EXEMPLO_IMG}" target="_blank" rel="noopener" class="gate-exemplo">
            <img src="${ALMAZ_EXEMPLO_IMG}" alt="Ejemplo de comentario con foto y texto">
          </a>
          <div class="gate-legenda">Captura de los juegos adjunta + una frase. Así es como tiene que quedar.</div>

          ${ALMAZ_PERFIL ? `
          <a href="https://www.instagram.com/${ALMAZ_PERFIL}/" target="_blank" rel="noopener"
             class="gate-btn gate-seguir" id="fb-btn-seguir">
            <i class="fa-solid fa-user-plus"></i> Seguir @${ALMAZ_PERFIL}
          </a>` : ''}

          <div class="gate-passos">
            <div class="gate-passo"><span class="n">1</span>
              <span>Haz clic en <b>Abrir mi video</b>. Abre el video que te toca.</span></div>
            ${ALMAZ_PERFIL ? `
            <div class="gate-passo"><span class="n">2</span>
              <span><b>Siga o perfil @${ALMAZ_PERFIL}</b>. De ahí sale el aviso de juego nuevo cada semana.</span></div>` : ''}
            <div class="gate-passo"><span class="n">${ALMAZ_PERFIL ? 3 : 2}</span>
              <span>Toma una <b>captura de tu biblioteca</b> con los juegos, o de un juego corriendo.</span></div>
            <div class="gate-passo"><span class="n">${ALMAZ_PERFIL ? 4 : 3}</span>
              <span>Comenta en el video <b>con esa captura adjunta</b> y una frase tuya. Un comentario solo de texto no vale.</span></div>
            <div class="gate-passo"><span class="n">${ALMAZ_PERFIL ? 5 : 4}</span>
              <span>Vuelve aquí, pon tu <b>@</b> y envía. Cada comentario es
                    <b>revisado por el equipo</b> antes de liberar.</span></div>
          </div>

          <div class="auth-field">
            <label>Tu @ de Instagram</label>
            <input type="text" id="fb-insta" placeholder="@seuusuario" autocomplete="off">
          </div>

          ${ALMAZ_PERFIL ? `
          <label style="display:flex;gap:8px;align-items:center;margin:12px 0 0;font-size:.88rem;cursor:pointer">
            <input type="checkbox" id="fb-seguiu">
            <span>Estoy siguiendo el perfil <b>@${ALMAZ_PERFIL}</b>.</span>
          </label>` : ''}

          <label style="display:flex;gap:8px;align-items:center;margin:12px 0;font-size:.88rem;cursor:pointer">
            <input type="checkbox" id="fb-confirm">
            <span>Comenté en el video <b>con la foto de mis juegos</b> anexada.</span>
          </label>

          <button class="mbtn dl" id="fb-btn">
            <i class="fa-solid fa-paper-plane"></i> Enviar a revisión
          </button>
          <div class="auth-msg" id="fb-msg" style="margin-top:10px"></div>
        </div>

        <!-- TELA 2: tem certeza? -->
        <div id="gate-v-certeza" style="display:none">
          <div class="gate-hero">
            <span class="gate-emoji">🤔</span>
            <h4>¿Estás seguro de que comentaste?</h4>
            <p>El equipo va a abrir el video y buscar el comentario de
               <b id="gate-arroba-conf"></b>. Ele precisa estar <b>en el video correcto</b>, con la <b>captura de tus juegos adjunta</b> y una frase tuya.</p>
          </div>
          <div class="gate-aviso">
            <i class="fa-solid fa-triangle-exclamation" style="margin-top:2px"></i>
            <span>Un comentario solo de texto, un emoji suelto o un @ equivocado se <b>recusado</b>, y el Fix y el Bypass siguen bloqueados.</span>
          </div>
          <button class="mbtn dl" id="fb-sim" style="margin-top:16px">
            <i class="fa-solid fa-check"></i> Sí, comenté con la foto
          </button>
          <button class="gate-voltar" id="fb-nao">
            Todavía no, voy a comentar ahora
          </button>
          <div class="auth-msg" id="fb-msg2" style="margin-top:10px"></div>
        </div>

        <!-- TELA 3: em análise -->
        <div id="gate-v-analise" style="display:none">
          <div class="gate-hero">
            <span class="gate-emoji">⏳</span>
            <h4>Entraste en revisión</h4>
            <p>En cuanto confirmemos que realmente comentaste como se pidió en el feedback, tu acceso será <b>aprovado</b> y el Fix y el Bypass Denuvo quedan <b>liberados de forma permanente</b>.</p>
          </div>
          <div class="gate-obrigado">
            <i class="fa-solid fa-clock" style="margin-top:2px"></i>
            <span>No hace falta enviarlo de nuevo. Vuelve aquí más tarde: cuando se apruebe, los pasos 2 y 3 se abren solos.</span>
          </div>
          <button class="gate-voltar" id="fb-reabrir" style="margin-top:14px">
            Ver mi video y el paso a paso de nuevo
          </button>
        </div>

        <div class="gate-obrigado">
          <i class="fa-solid fa-heart" style="margin-top:2px"></i>
          <span>Gracias de verdad. Cada comentario ayuda más de lo que imaginas.</span>
        </div>
      </div>`;
    document.body.appendChild(dlg);

    document.getElementById('fb-btn').addEventListener('click', pedirCerteza);
    document.getElementById('fb-sim').addEventListener('click', enviar);
    document.getElementById('fb-nao').addEventListener('click', () => mostrar('form'));
    document.getElementById('fb-reabrir').addEventListener('click', () => mostrar('form'));

    // Clicou em seguir: marca a caixinha sozinho (ele pode desmarcar).
    const seguir = document.getElementById('fb-btn-seguir');
    if (seguir) seguir.addEventListener('click', () => {
      document.getElementById('fb-seguiu').checked = true;
      seguir.innerHTML = '<i class="fa-solid fa-check"></i> Perfil aberto';
    });
  }

  // Troca a tela do modal: 'form' | 'certeza' | 'analise'
  function mostrar(qual) {
    ['form', 'certeza', 'analise'].forEach(k => {
      const el = document.getElementById('gate-v-' + k);
      if (el) el.style.display = k === qual ? '' : 'none';
    });
    const rec = document.getElementById('gate-recusado');
    if (rec) rec.style.display = estado === 'recusado' ? '' : 'none';
    const b = document.getElementById('fb-btn');
    if (b) b.disabled = false;
    const s = document.getElementById('fb-sim');
    if (s) s.disabled = false;
    msg('', ''); msg2('', '');
  }

  function pintarVideo() {
    const box = document.getElementById('gate-video-box');
    if (!box) return;
    const v = videoDoCliente();

    if (!v) {
      box.innerHTML = `<div class="gate-card" style="--gate-grad:${REDES.instagram.grad};--gate-cor:${REDES.instagram.cor}">
        <p style="margin:0">Todavía no hay ningún video configurado. Avisa a soporte.</p></div>`;
      return;
    }

    const r = REDES[v.rede] || REDES.instagram;
    box.innerHTML = `
      <div class="gate-card" style="--gate-grad:${r.grad};--gate-cor:${r.cor}">
        <div class="gate-card-top">
          <div class="gate-badge"><i class="${r.icone}"></i></div>
          <div class="t">
            <div class="k">Seu vídeo · ${r.nome}</div>
            <div class="v">Comenta en este</div>
          </div>
        </div>
        <p>Ábrelo con el botón de abajo y deja tu comentario <b>en ese video</b>. Ese es el que revisa el equipo.</p>
        <a href="${v.url}" target="_blank" rel="noopener" class="gate-btn">
          <i class="${r.icone}"></i> Abrir meu vídeo no ${r.nome}
        </a>
      </div>`;
  }

  function msg(txt, tipo) {
    const e = document.getElementById('fb-msg');
    if (e) { e.textContent = txt; e.className = 'auth-msg ' + (tipo || ''); }
  }
  function msg2(txt, tipo) {
    const e = document.getElementById('fb-msg2');
    if (e) { e.textContent = txt; e.className = 'auth-msg ' + (tipo || ''); }
  }

  function arrobaDigitado() {
    const v = (document.getElementById('fb-insta').value || '').trim().replace(/\s+/g, '');
    return v.replace(/^@+/, '') ? '@' + v.replace(/^@+/, '') : '';
  }

  // Primeiro clique: confere o formulário e pergunta "¿estás seguro?".
  function pedirCerteza() {
    const insta = arrobaDigitado();
    if (!insta) return msg('Pon tu @ para que encontremos tu comentario.', 'err');
    const seguiu = document.getElementById('fb-seguiu');
    if (seguiu && !seguiu.checked) {
      return msg('Sigue el perfil y marca la casilla de seguir.', 'err');
    }
    if (!document.getElementById('fb-confirm').checked) {
      return msg('Marca la casilla confirmando que comentaste con la foto.', 'err');
    }
    document.getElementById('gate-arroba-conf').textContent = insta;
    mostrar('certeza');
  }

  // Segundo clique ("Sim, comentei"): grava como EM ANÁLISE. Não libera nada.
  async function enviar() {
    const btn = document.getElementById('fb-sim');
    btn.disabled = true;
    msg2('Enviando...', '');

    const u = sessao();
    try {
      const res = await fetch(`${window.API_URL}/api/feedback-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, instagram: arrobaDigitado() }),
      });
      const data = await res.json();
      if (data && data.success) {
        estado = 'analise';
        aplicarTrava();
        mostrar('analise');
      } else {
        msg2('No se pudo enviar ahora. Intenta de nuevo.', 'err');
        btn.disabled = false;
      }
    } catch (e) {
      msg2('Sin conexión con el servidor. Intenta de nuevo en unos instantes.', 'err');
      btn.disabled = false;
    }
  }

  function aplicarTrava() {
    document.querySelectorAll('.step.s2, .step.s3').forEach(el => {
      el.classList.toggle('locked-fb', !window.ALMAZ_FIX_UNLOCKED);
      el.classList.toggle('analise-fb', !window.ALMAZ_FIX_UNLOCKED && estado === 'analise');
    });
  }

  // Pergunta ao servidor em que pé está o feedback. Aprovado destrava na hora.
  async function atualizarEstado() {
    const email = String(sessao().email || '').trim().toLowerCase();
    if (!email || !window.API_URL) return;
    try {
      const res = await fetch(`${window.API_URL}/api/feedback-status?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' });
      const j = await res.json();
      estado = (j && j.status) || '';
    } catch (e) { return; }  // sem servidor: continua como está (travado)
    window.ALMAZ_FIX_UNLOCKED = estado === 'aprovado';
    aplicarTrava();

    const dlg = document.getElementById('modal-feedback');
    if (dlg && dlg.open) {
      if (window.ALMAZ_FIX_UNLOCKED) { dlg.close(); window.openModal(abrirDepois); }
      else if (estado === 'recusado') mostrar('form');
    }
  }

  /* ---------- API pública ---------- */

  // Chamado pelo openModal() da página. Devolve true se o modal foi
  // interceptado (ou seja: está travado e o gate abriu no lugar).
  window.almazGateIntercepta = function (tipo) {
    if (tipo !== 'bypass' && tipo !== 'denuvo') return false;
    if (window.ALMAZ_FIX_UNLOCKED) return false;
    abrirDepois = tipo;
    montarModal();
    pintarVideo();
    mostrar(estado === 'analise' ? 'analise' : 'form');
    document.getElementById('modal-feedback').showModal();
    atualizarEstado();   // pode ter sido aprovado desde a última olhada
    return true;
  };

  // Chamado quando a sessão entra na área. Ignora de propósito o fixUnlocked
  // (é da conta perdida): só destrava com feedbackStatus 'aprovado'.
  window.almazGateIniciar = function () {
    injetarCSS();
    window.ALMAZ_FIX_UNLOCKED = estado === 'aprovado';
    aplicarTrava();
    atualizarEstado();
  };
})();
