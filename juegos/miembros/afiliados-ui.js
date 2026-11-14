/* ============================================================
   INDIQUE E GANHE — painel do afiliado
   ------------------------------------------------------------
   Um arquivo só, CSS injetado por JS, monta em <div id="afiliados"></div>.
   Mesmo molde do rifa-ui.js, e de propósito: as duas coisas vivem lado a lado
   na mesma página e usam o MESMO código de indicação.

   Pra usar:
     <div id="afiliados"></div>
     <script src="afiliados-ui.js"></script>
     ... e chamar renderAfiliados() depois do login.

   VER é livre: o cliente já entrou na área de membros, e link, saldo e
   indicações são dados dele. Pedir uma segunda senha só pra olhar seria atrito
   à toa, e esconderia justamente o que faz ele querer indicar.

   MEXER NO DINHEIRO pede senha (ver `comSenha`): cadastrar chave Pix e sacar.
   É aí que ela protege de verdade — quem souber o e-mail dele ainda assim não
   troca a chave nem saca. O token fica em localStorage.almaz_af_token.
   ============================================================ */

(function () {
  'use strict';

  const API = () => window.API_URL || '';
  const CHAVE_TOKEN = 'almaz_af_token';

  const CSS = `
    .af { border-radius: 18px; margin-bottom: 26px; overflow: hidden;
      border: 1px solid rgba(238,39,64,.28);
      background:
        radial-gradient(620px 240px at 88% 0, rgba(238,39,64,.10), transparent 68%),
        var(--card, #111114); }

    .af-topo { padding: 26px 28px 20px; }
    .af-selo { display: inline-flex; align-items: center; gap: 7px;
      background: rgba(238,39,64,.12); border: 1px solid rgba(238,39,64,.4);
      color: var(--neon, #ee2740); font-size: .64rem; font-weight: 800;
      letter-spacing: 1.5px; text-transform: uppercase;
      padding: 5px 11px; border-radius: 20px; margin-bottom: 12px; }
    .af h3 { font-family: var(--head, sans-serif); font-size: 1.36rem; font-weight: 800;
      color: #fff; line-height: 1.2; margin-bottom: 8px; letter-spacing: -.4px; }
    .af h3 span { color: var(--neon, #ee2740); }
    .af-sub { color: var(--muted, #8a8a94); font-size: .87rem; line-height: 1.6; }
    .af-sub b { color: #fff; }

    .af-corpo { padding: 0 28px 24px; display: grid; gap: 18px; }
    .af-rot { font-size: .64rem; font-weight: 800; letter-spacing: 1.5px;
      text-transform: uppercase; color: var(--neon, #ee2740); margin-bottom: 8px; }

    .af-link { display: flex; gap: 9px; flex-wrap: wrap; }
    .af-link input { flex: 1; min-width: 220px; padding: 13px 15px; border-radius: 10px;
      background: var(--bg-2, #08080b); border: 1px solid var(--border-2, #2a2a32);
      color: #fff; font-family: Consolas, monospace; font-size: .86rem; outline: none; }

    .af-bt { padding: 13px 20px; border-radius: 10px; border: none; cursor: pointer;
      background: var(--neon, #ee2740); color: #fff; font-weight: 800; font-size: .84rem;
      font-family: inherit; transition: filter .15s; }
    .af-bt:hover:not(:disabled) { filter: brightness(1.1); }
    .af-bt:disabled { background: var(--card-2, #16161b); color: var(--muted-2, #5c5c66);
      cursor: not-allowed; border: 1px solid var(--border, #232329); }
    .af-bt.ok { background: #3fd968; color: #06240f; }
    .af-bt.fantasma { background: transparent; color: var(--muted, #8a8a94);
      border: 1px solid var(--border-2, #2a2a32); }

    .af-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 620px) { .af-nums { grid-template-columns: 1fr; } }
    .af-num { padding: 16px 18px; border-radius: 12px;
      background: var(--bg-2, #08080b); border: 1px solid var(--border, #232329); }
    .af-num .v { font-family: var(--head, sans-serif); font-size: 1.6rem; font-weight: 800;
      color: #fff; line-height: 1.1; letter-spacing: -.5px; }
    .af-num.destaque .v { color: var(--neon, #ee2740); }
    .af-num .r { font-size: .7rem; color: var(--muted, #8a8a94); margin-top: 5px;
      text-transform: uppercase; letter-spacing: .8px; font-weight: 700; }
    .af-num .obs { font-size: .72rem; color: var(--muted-2, #5c5c66); margin-top: 6px; }

    .af-aviso { font-size: .78rem; color: var(--muted, #8a8a94); margin-top: 8px; line-height: 1.5; }

    .af-form { display: grid; gap: 9px; grid-template-columns: 140px 1fr; }
    @media (max-width: 620px) { .af-form { grid-template-columns: 1fr; } }
    .af-form select, .af-form input { padding: 12px 14px; border-radius: 10px;
      background: var(--bg-2, #08080b); border: 1px solid var(--border-2, #2a2a32);
      color: #fff; font-family: inherit; font-size: .86rem; outline: none; }
    .af-form select:focus, .af-form input:focus { border-color: var(--neon, #ee2740); }
    .af-form .largo { grid-column: 1 / -1; }

    .af-tab { width: 100%; border-collapse: collapse; font-size: .82rem; }
    .af-tab th { text-align: left; font-size: .64rem; text-transform: uppercase;
      letter-spacing: 1px; color: var(--muted-2, #5c5c66); font-weight: 800;
      padding: 0 10px 9px 0; }
    .af-tab td { padding: 10px 10px 10px 0; border-top: 1px solid var(--border, #232329);
      color: var(--muted, #8a8a94); }
    .af-tab td.val { color: #fff; font-weight: 700; font-family: Consolas, monospace; }
    .af-st { font-size: .68rem; font-weight: 800; padding: 3px 9px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }
    .af-st.pendente   { background: rgba(251,191,36,.12); color: #fbbf24; }
    .af-st.disponivel { background: rgba(63,217,104,.12); color: #3fd968; }
    .af-st.pago       { background: rgba(102,192,244,.12); color: #66c0f4; }
    .af-st.estornado  { background: rgba(238,39,64,.12);  color: #ee2740; }

    .af-vazio { padding: 22px; border-radius: 12px; text-align: center;
      background: var(--bg-2, #08080b); border: 1px dashed var(--border-2, #2a2a32);
      color: var(--muted, #8a8a94); font-size: .85rem; line-height: 1.7; }
    .af-vazio b { color: #fff; }
    .af-tabelinha { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
    .af-tabelinha > div {
      flex: 1; min-width: 112px; padding: 13px 15px; border-radius: 10px;
      background: rgba(63,217,104,.07); border: 1px solid rgba(63,217,104,.22);
    }
    .af-tabelinha b {
      display: block; font-family: var(--head, sans-serif); font-size: 1.2rem;
      color: #3fd968; line-height: 1.1;
    }
    .af-tabelinha span {
      display: block; font-size: .7rem; color: var(--muted, #8a8a94); margin-top: 5px;
      text-transform: uppercase; letter-spacing: .8px; font-weight: 700;
    }

    .af-passos { padding: 15px 28px 20px; border-top: 1px solid var(--border, #232329);
      background: rgba(0,0,0,.2); display: grid; gap: 9px; }
    .af-passo { display: flex; gap: 11px; align-items: flex-start;
      font-size: .82rem; color: var(--muted, #8a8a94); line-height: 1.5; }
    .af-passo b { color: #fff; }
    .af-passo .i { flex: none; width: 20px; height: 20px; border-radius: 50%;
      background: rgba(238,39,64,.12); border: 1px solid rgba(238,39,64,.35);
      color: var(--neon, #ee2740); font-size: .68rem; font-weight: 800;
      display: grid; place-items: center; margin-top: 1px; }

    .af-msg { padding: 11px 14px; border-radius: 10px; font-size: .82rem; line-height: 1.5; }
    .af-msg.erro { background: rgba(238,39,64,.1); border: 1px solid rgba(238,39,64,.3); color: #ff8095; }
    .af-msg.bom  { background: rgba(63,217,104,.1); border: 1px solid rgba(63,217,104,.3); color: #7ee89b; }

    .af-skel { height: 14px; border-radius: 6px; background: var(--card-2, #16161b);
      animation: afPulsa 1.2s ease-in-out infinite; }
    @keyframes afPulsa { 0%,100% { opacity: .45 } 50% { opacity: .9 } }

    .af-copias { display: grid; gap: 8px; }
    .af-copia { display: flex; gap: 9px; align-items: flex-start;
      padding: 12px 14px; border-radius: 10px; background: var(--bg-2, #08080b);
      border: 1px solid var(--border, #232329); }
    .af-copia p { flex: 1; margin: 0; font-size: .82rem; color: var(--muted, #8a8a94); line-height: 1.55; }
    .af-copia button { flex: none; padding: 7px 12px; border-radius: 8px; cursor: pointer;
      background: transparent; border: 1px solid var(--border-2, #2a2a32);
      color: var(--muted, #8a8a94); font-family: inherit; font-size: .72rem; font-weight: 700; }
    .af-copia button:hover { border-color: var(--neon, #ee2740); color: var(--neon, #ee2740); }
  `;

  let cssPronto = false;
  function injetarCSS() {
    if (cssPronto) return;
    cssPronto = true;
    const e = document.createElement('style');
    e.textContent = CSS;
    document.head.appendChild(e);
  }

  const dinheiro = (n) => 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function dataCurta(iso) {
    try { const d = new Date(iso); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }
    catch { return '--'; }
  }
  function diasAte(iso) {
    const d = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    return d > 0 ? d : 0;
  }

  function sessao() {
    try { return JSON.parse(localStorage.getItem('almaz_user') || 'null') || {}; }
    catch { return {}; }
  }
  const pegarToken = () => { try { return localStorage.getItem(CHAVE_TOKEN) || ''; } catch { return ''; } };
  const salvarToken = (t) => { try { localStorage.setItem(CHAVE_TOKEN, t); } catch (e) {} };
  const limparToken = () => { try { localStorage.removeItem(CHAVE_TOKEN); } catch (e) {} };

  async function api(caminho, opcoes = {}) {
    const r = await fetch(API() + caminho, {
      method: opcoes.corpo ? 'POST' : (opcoes.metodo || 'GET'),
      headers: Object.assign({ 'Content-Type': 'application/json' },
        opcoes.comToken ? { Authorization: 'Bearer ' + pegarToken() } : {}),
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
    });
    let d = {};
    try { d = await r.json(); } catch (e) {}
    return { status: r.status, ok: r.ok, dados: d };
  }

  let alvo = null;

  /* Contador de geração. A página chama renderAfiliados() sozinha ao entrar, e
     outras ações (salvar Pix, sacar) chamam de novo. Sem isso, uma chamada
     antiga e lenta termina DEPOIS da nova e apaga o que a nova desenhou — foi
     o que fez o painel ficar em branco mesmo com a API respondendo 200. */
  let geracao = 0;
  const desatualizada = (minha) => minha !== geracao;

  // ---- telas ----

  function telaCarregando() {
    alvo.innerHTML = `
      <div class="af"><div class="af-topo">
        <div class="af-selo">Recomienda y gana</div>
        <div class="af-skel" style="width:60%;height:22px;margin-bottom:12px"></div>
        <div class="af-skel" style="width:85%"></div>
      </div><div class="af-corpo">
        <div class="af-nums">
          <div class="af-num"><div class="af-skel" style="width:70%;height:24px"></div></div>
          <div class="af-num"><div class="af-skel" style="width:70%;height:24px"></div></div>
          <div class="af-num"><div class="af-skel" style="width:70%;height:24px"></div></div>
        </div>
      </div></div>`;
  }

  /* Servidor fora do ar, rota ainda não publicada, internet caindo: o bloco
     SOME, não mostra erro. É a mesma escolha do rifa-ui.

     O cliente entrou aqui pra pegar os jogos dele. Um card vermelho dizendo
     "no pude cargar" sobre um recurso que ele talvez nem conhecesse só
     gera mensagem no suporte. Sumindo, a página segue inteira e o sorteio
     continua aparecendo normalmente. */
  function esconder() {
    window.ALMAZ_AF_LINK_VISIVEL = false;
    alvo.innerHTML = '';
    sincronizarRifa();
    ajustarSecao();
  }

  /* A rifa precisa saber se o link já foi mostrado aqui, e ela pode ter
     desenhado ANTES deste painel (a página chama as duas). Então redesenhamos
     a rifa depois que este bloco decide. Uma vez só: renderRifa não chama de
     volta o renderAfiliados, então não tem laço. */
  function sincronizarRifa() {
    if (typeof window.renderRifa === 'function') {
      try { window.renderRifa(); } catch (e) {}
    }
  }

  /* Se os dois blocos ficarem vazios, a seção inteira e o item do menu somem.
     Sem isso sobraria um título "Recomienda y gana" com nada embaixo. */
  window.almazAjustarIndique = ajustarSecao;   // o rifa-ui chama isto também
  function ajustarSecao() {
    const secao = document.getElementById('indique');
    if (!secao) return;
    const af = document.getElementById('afiliados');
    const rf = document.getElementById('rifa');
    const vazio = (!af || !af.innerHTML.trim()) && (!rf || !rf.innerHTML.trim());
    secao.style.display = vazio ? 'none' : '';
    const item = document.querySelector('[href="#indique"]');
    if (item) item.style.display = vazio ? 'none' : '';
  }

  /* Porta de entrada. Pede a licença junto com a senha de propósito: a lista de
     e-mails de cliente circula com facilidade, e sem uma segunda prova qualquer
     um criaria acesso na conta alheia e trocaria a chave Pix. */
  function telaPainel(d) {
    const temPix = !!d.temPix;
    const podeSacar = d.sacavel >= d.saqueMinimo && temPix;

    // Motivo do botão desabilitado, sempre explícito: botão cinza sem explicação
    // gera mensagem no WhatsApp, e é justamente isso que a gente quer evitar.
    let motivo = '';
    if (!temPix) motivo = 'Registra tu clave Pix abajo para poder retirar.';
    else if (d.sacavel < d.saqueMinimo) motivo = `Faltan ${dinheiro(d.saqueMinimo - d.sacavel)} para llegar al mínimo de ${dinheiro(d.saqueMinimo)}.`;

    // Rótulos em português de gente. "Estornado" é palavra de gateway: pro
    // cliente, a compra dele foi cancelada, e é isso que a tela diz.
    const rotuloStatus = (c) => {
      if (c.status === 'pendente') return 'se libera en ' + diasAte(c.liberaEm) + 'd';
      if (c.status === 'disponivel') return 'Disponible';
      if (c.status === 'pago') return 'Recebido';
      if (c.status === 'estornado') return 'Cancelada';
      return c.status;
    };

    const linhas = (d.ultimas || []).map((c) => `
      <tr>
        <td>${dataCurta(c.data)}</td>
        <td>${esc(c.comprador)}</td>
        <td>${esc(String(c.plano || '').toUpperCase())}</td>
        <td class="val">${dinheiro(c.valor)}</td>
        <td><span class="af-st ${esc(c.status)}">${esc(rotuloStatus(c))}</span></td>
      </tr>`).join('');

    /* Textos prontos.
       Os primeiros aqui eram de propaganda ("vale mucho la pena", "não faz
       sentido") e ninguém manda isso pro amigo: parece corrente e o amigo não
       responde. Estes são escritos como mensagem de pessoa, com preço na frente
       e a objeção respondida antes de ser feita.
       Como quem manda daqui JÁ é cliente, estes falam na primeira pessoa. */
    const textosProntos = [
      '¿Todavía compras juegos por separado? Yo pagué una vez y descargo todo desde Steam, '
        + 'incluso lanzamientos. Empieza en R$ 9,97: ' + d.link,

      '¿Te acuerdas del juego que querías y estaba caro? Mira esto antes de comprar. '
        + 'Pago único, no se vuelve suscripción: ' + d.link,

      'Antes de que preguntes: no cobra de nuevo, los juegos entran a TU cuenta de Steam, '
        + 'y tiene 7 días de garantía. ' + d.link,
    ];

    alvo.innerHTML = `
      <div class="af">
        <div class="af-topo">
          <div class="af-selo">Recomienda y gana</div>
          <h3>Ganas <span>50%</span> de cada recomendación</h3>
          <div class="af-sub">
            Cuando alguien compra con tu enlace, <b>la mitad del valor</b> entra a tu saldo. Sin límite de recomendaciones.
          </div>
        </div>

        <div class="af-corpo">
          <div>
            <div class="af-rot">Tu enlace de recomendación</div>
            <div class="af-link">
              <input type="text" id="af-url" value="${esc(d.link)}" readonly onclick="this.select()">
              <button class="af-bt" id="af-copiar">Copiar enlace</button>
            </div>
          </div>

          <div class="af-nums">
            <div class="af-num destaque">
              <div class="v">${dinheiro(d.sacavel)}</div>
              <div class="r">Disponible</div>
              <div class="obs">listo para retirar</div>
            </div>
            <div class="af-num">
              <div class="v">${dinheiro(d.saldoPendente)}</div>
              <div class="r">En liberación</div>
              <div class="obs">libera ${d.holdDias} dias após a compra</div>
            </div>
            <div class="af-num">
              <div class="v">${dinheiro(d.totalPago)}</div>
              <div class="r">Ya recibido</div>
              <div class="obs">${d.indicacoes} ${d.indicacoes === 1 ? 'recomendación' : 'recomendaciones'}</div>
            </div>
          </div>

          <div id="af-msg"></div>

          <div>
            <button class="af-bt" id="af-sacar" ${podeSacar ? '' : 'disabled'}>Retirar por Pix</button>
            ${motivo ? `<div class="af-aviso">${esc(motivo)}</div>` : ''}
            ${d.divida > 0 ? `<div class="af-aviso">Há ${dinheiro(d.divida)} descontados por uma compra que foi cancelada depois.</div>` : ''}
          </div>

          <div>
            <div class="af-rot">Tu clave Pix</div>
            <div class="af-form">
              <select id="af-pix-tipo">
                <option value="cpf">CPF</option>
                <option value="email">Correo</option>
                <option value="telefone">Teléfono</option>
                <option value="aleatoria">Aleatoria</option>
              </select>
              <input id="af-pix-chave" placeholder="Tu clave Pix" autocomplete="off">
              <input class="largo" id="af-pix-nome" placeholder="Nombre del titular de la cuenta" autocomplete="off">
              <div class="largo"><button class="af-bt fantasma" id="af-pix-salvar">${temPix ? 'Actualizar clave' : 'Guardar clave'}</button></div>
            </div>
            <div class="af-aviso">Por seguridad, el retiro se libera 24 horas después de cambiar la clave.</div>
          </div>

          <div>
            <div class="af-rot">Tus recomendaciones</div>
            ${linhas ? `
              <table class="af-tab">
                <thead><tr><th>Fecha</th><th>Quién compró</th><th>Plan</th><th>Ganaste</th><th>Estado</th></tr></thead>
                <tbody>${linhas}</tbody>
              </table>`
              /* Painel novo mostra três zeros, e zerado parece que não funciona.
                 Em vez de inventar saldo, o vazio mostra QUANTO VALE cada plano.
                 É verdade, e responde a pergunta que a pessoa tem agora:
                 "¿cuánto gano con esto?" */
              : `<div class="af-vazio">
                   <b>Todavía no hay recomendaciones.</b><br>
                   Copia tu enlace de arriba y mándaselo a alguien. Esto es lo que entra cuando la persona compre:
                   <div class="af-tabelinha">
                     <div><b>R$ 24,98</b><span>Vitalicio</span></div>
                     <div><b>R$ 9,98</b><span>Avanzado</span></div>
                     <div><b>R$ 4,98</b><span>Básico</span></div>
                   </div>
                 </div>`}
          </div>

          <div>
            <div class="af-rot">Textos listos para enviar</div>
            <div class="af-copias">
              ${textosProntos.map((t, i) => `
                <div class="af-copia">
                  <p>${esc(t)}</p>
                  <button data-texto="${i}">Copiar</button>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <div class="af-passos">
          <div class="af-passo"><span class="i">1</span><span>Comparte tu enlace con quien le pueda gustar.</span></div>
          <div class="af-passo"><span class="i">2</span><span>La persona compra cualquier plan con ese enlace.</span></div>
          <div class="af-passo"><span class="i">3</span><span>Metade do valor entra no seu saldo e libera em ${d.holdDias} dias.</span></div>
        </div>
      </div>`;

    ligarPainel(d, textosProntos);
  }

  /* Senha sob demanda.
     Ver o saldo é livre: o cliente já entrou na área de membros, e é dado dele.
     A senha só entra em cena na hora de MEXER no dinheiro (cadastrar Pix, sacar),
     que é quando ela deixa de ser burocracia e vira proteção — se alguém souber
     o e-mail dele, ainda assim não troca a chave Pix nem saca.

     Recebe a ação e só executa depois de ter token. Se já tem, executa direto. */
  async function comSenha(d, acao) {
    if (pegarToken()) return acao();

    const msg = document.getElementById('af-msg');
    const criar = !d.temSenha;
    msg.innerHTML = `
      <div class="af-msg bom" style="display:grid;gap:10px">
        <div><b>${criar ? 'Crea una contraseña para liberar el retiro.' : 'Confirma tu contraseña.'}</b><br>
        ${criar
          ? 'Es solo una vez. Protege tu dinero: sin ella, nadie cambia tu clave Pix ni retira por ti.'
          : 'Por seguridad, pedimos la contraseña antes de tocar el dinero.'}</div>
        <div class="af-form">
          ${criar ? '<input class="largo" id="af-s-key" placeholder="Sua licença (ALMAZ-XXXX-XXXX)" autocomplete="off">' : ''}
          <input class="largo" id="af-s-senha" type="password"
                 placeholder="${criar ? 'Crie uma senha (mínimo 6 caracteres)' : 'Sua senha'}"
                 autocomplete="${criar ? 'new-password' : 'current-password'}">
          <div class="largo"><button class="af-bt" id="af-s-ok">${criar ? 'Crear contraseña y continuar' : 'Continuar'}</button></div>
        </div>
        <div id="af-s-erro"></div>
      </div>`;

    const bt = document.getElementById('af-s-ok');
    const campo = document.getElementById('af-s-senha');
    const erro = document.getElementById('af-s-erro');
    campo.focus();

    async function enviar() {
      const senha = campo.value;
      const key = criar ? (document.getElementById('af-s-key').value || '').trim() : '';
      erro.innerHTML = '';
      if (criar && !key) return (erro.innerHTML = '<div class="af-msg erro">Ingresa tu licencia.</div>');
      if (!senha || senha.length < 6) return (erro.innerHTML = '<div class="af-msg erro">La contraseña necesita al menos 6 caracteres.</div>');

      bt.disabled = true; bt.textContent = 'Aguarde...';
      const r = await api(criar ? '/api/af/claim' : '/api/af/login',
        { corpo: criar ? { email: d.email, senha, key } : { email: d.email, senha } });
      bt.disabled = false; bt.textContent = criar ? 'Crear contraseña y continuar' : 'Continuar';

      if (!r.dados.success || !r.dados.token) {
        erro.innerHTML = `<div class="af-msg erro">${esc(r.dados.message || 'Não consegui continuar.')}</div>`;
        return;
      }
      salvarToken(r.dados.token);
      msg.innerHTML = '';
      acao();   // retoma o que ele queria fazer
    }
    bt.addEventListener('click', enviar);
    campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') enviar(); });
  }

  function ligarPainel(d, textosProntos) {
    const msg = document.getElementById('af-msg');

    function copiar(texto, botao, rotuloOriginal) {
      const feito = () => {
        botao.textContent = 'Copiado';
        botao.classList.add('ok');
        setTimeout(() => { botao.textContent = rotuloOriginal; botao.classList.remove('ok'); }, 2000);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(texto).then(feito).catch(feito);
      else feito();
    }

    const btCopiar = document.getElementById('af-copiar');
    btCopiar.addEventListener('click', () => copiar(d.link, btCopiar, 'Copiar enlace'));

    alvo.querySelectorAll('.af-copia button').forEach((b) => {
      b.addEventListener('click', () => copiar(textosProntos[Number(b.dataset.texto)], b, 'Copiar'));
    });

    // Pix: escrever exige senha; ver a tela não.
    if (d.pixTipo) document.getElementById('af-pix-tipo').value = d.pixTipo;
    const btPix = document.getElementById('af-pix-salvar');
    btPix.addEventListener('click', () => {
      const corpo = {
        tipo: document.getElementById('af-pix-tipo').value,
        chave: document.getElementById('af-pix-chave').value.trim(),
        nomeTitular: document.getElementById('af-pix-nome').value.trim(),
      };
      if (!corpo.chave || !corpo.nomeTitular) {
        msg.innerHTML = '<div class="af-msg erro">Completa la clave y el nombre del titular.</div>';
        return;
      }
      // Valida ANTES de pedir senha: ninguém merece criar senha e só então
      // descobrir que esqueceu de preencher um campo.
      comSenha(d, async () => {
        btPix.disabled = true;
        const r = await api('/api/af/pix', { corpo, comToken: true });
        btPix.disabled = false;
        if (r.status === 401) { limparToken(); return comSenha(d, () => btPix.click()); }
        msg.innerHTML = `<div class="af-msg ${r.dados.success ? 'bom' : 'erro'}">${esc(r.dados.message || 'Não consegui salvar.')}</div>`;
        if (r.dados.success) setTimeout(() => window.renderAfiliados(), 1400);
      });
    });

    // Saque
    const btSaque = document.getElementById('af-sacar');
    btSaque.addEventListener('click', () => comSenha(d, async () => {
      btSaque.disabled = true; btSaque.textContent = 'Enviando...';
      const r = await api('/api/af/saque', { corpo: {}, comToken: true });
      btSaque.textContent = 'Retirar por Pix';
      btSaque.disabled = false;
      if (r.status === 401) { limparToken(); return comSenha(d, () => btSaque.click()); }
      if (r.dados.success) {
        btSaque.disabled = true;
        msg.innerHTML = `<div class="af-msg bom">
          Saque de ${dinheiro(r.dados.saque.valor)} solicitado. Ele fica
          <b>pendiente de aprobación</b> y el Pix cae en la clave registrada en cuanto se apruebe. Sigues el estado aquí mismo.</div>`;
        setTimeout(() => window.renderAfiliados(), 2500);
      } else {
        msg.innerHTML = `<div class="af-msg erro">${esc(r.dados.message || 'Não consegui pedir o saque.')}</div>`;
      }
    }));
  }

  // ---- entrada ----

  window.renderAfiliados = async function () {
    alvo = document.getElementById('afiliados');
    if (!alvo) return;
    injetarCSS();

    const minha = ++geracao;

    const u = sessao();
    if (!u.email) return esconder();

    telaCarregando();

    // Uma chamada só, sem senha: o cliente já está autenticado na área de
    // membros e isto é dado dele. Vê tudo de cara — link, saldo, indicações.
    // Senha só quando for mexer no dinheiro (ver `comSenha`).
    //
    // Só a BUSCA fica dentro do try. Se a renderização estourar, o erro tem que
    // aparecer no console em vez de se disfarçar de "servidor fuera de línea" e o
    // bloco sumir sem explicação.
    let r = null;
    try { r = await api('/api/af/resumo', { corpo: { email: u.email } }); }
    catch (e) { return desatualizada(minha) ? undefined : esconder(); }

    if (desatualizada(minha)) return;
    // Rota ainda não publicada (404), servidor reiniciando, resposta estranha:
    // some. Nunca deixa erro de infraestrutura na cara do cliente.
    if (!r.dados || !r.dados.success) return esconder();
    // Servidor no ar mas sem AF_SECRET: o saque não teria como funcionar.
    if (r.dados.disponivel === false) return esconder();
    // Quem não comprou não vê o bloco. Não deve acontecer dentro da área de
    // membros, mas o componente não confia na página que o hospeda.
    if (!r.dados.comprou) return esconder();

    telaPainel({ ...r.dados, email: u.email });
    concluir(true);
  };

  /* Fecha o ciclo: avisa se o link ficou visível aqui, manda a rifa se
     redesenhar de acordo, e ajusta a seção. */
  function concluir(linkVisivel) {
    window.ALMAZ_AF_LINK_VISIVEL = !!linkVisivel;
    sincronizarRifa();
    ajustarSecao();
  }
})();
