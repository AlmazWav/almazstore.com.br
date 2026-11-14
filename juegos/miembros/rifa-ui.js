/* ============================================================
   RIFA POR INDICAÇÃO — bloco visual
   ------------------------------------------------------------
   Um arquivo só, usado por todas as páginas de membro. Busca os dados
   em POST /api/rifa/status e desenha: prêmio, link do cliente, números
   que ele já tem e progresso até a meta do sorteio.

   Pra usar numa página:
     <div id="rifa"></div>
     <script src="rifa-ui.js"></script>
     ... e chamar renderRifa() depois do login (o email vem da sessão).
   ============================================================ */

const RIFA_IMG = 'rifa/rtx3060.png';

(function () {
  'use strict';

  const CSS = `
    .rf {
      position: relative; overflow: hidden; border-radius: 18px; margin-bottom: 26px;
      border: 1px solid rgba(118,196,255,.28);
      background:
        radial-gradient(620px 240px at 88% 0, rgba(118,196,255,.12), transparent 68%),
        var(--card, #111114);
    }
    .rf-topo { display: flex; gap: 24px; align-items: center; padding: 26px 28px 20px; flex-wrap: wrap; }
    .rf-img {
      width: 190px; flex: none; filter: drop-shadow(0 14px 26px rgba(0,0,0,.55));
    }
    .rf-txt { flex: 1; min-width: 260px; }
    .rf-selo {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(118,196,255,.12); border: 1px solid rgba(118,196,255,.4);
      color: #76c4ff; font-size: .64rem; font-weight: 800;
      letter-spacing: 1.5px; text-transform: uppercase;
      padding: 5px 11px; border-radius: 20px; margin-bottom: 12px;
    }
    .rf h3 {
      font-family: var(--head, var(--title, sans-serif));
      font-size: 1.36rem; font-weight: 800; color: #fff;
      line-height: 1.2; margin-bottom: 8px; letter-spacing: -.4px;
    }
    .rf h3 span { color: #76c4ff; }
    .rf-sub { color: var(--muted, var(--text-mut, #8a8a94)); font-size: .87rem; line-height: 1.6; }
    .rf-sub b { color: #fff; }

    .rf-corpo { padding: 0 28px 22px; display: grid; gap: 16px; }

    .rf-link-rot {
      font-size: .64rem; font-weight: 800; letter-spacing: 1.5px;
      text-transform: uppercase; color: #76c4ff; margin-bottom: 8px;
    }
    .rf-link { display: flex; gap: 9px; flex-wrap: wrap; }
    .rf-link input {
      flex: 1; min-width: 220px; padding: 13px 15px; border-radius: 10px;
      background: var(--bg-2, #08080b); border: 1px solid var(--border-2, #2a2a32);
      color: #fff; font-family: Consolas, monospace; font-size: .86rem; outline: none;
    }
    .rf-copiar {
      padding: 13px 20px; border-radius: 10px; border: none; cursor: pointer;
      background: #76c4ff; color: #04243a; font-weight: 800; font-size: .84rem;
      font-family: inherit; transition: filter .15s;
    }
    .rf-copiar:hover { filter: brightness(1.08); }
    .rf-copiar.ok { background: #3fd968; color: #06240f; }

    .rf-barra-fora {
      height: 9px; border-radius: 20px; background: var(--bg-2, #08080b);
      border: 1px solid var(--border, #232329); overflow: hidden;
    }
    .rf-barra {
      height: 100%; border-radius: 20px;
      background: linear-gradient(90deg, #76c4ff, #4aa3e8);
      transition: width .6s cubic-bezier(.4,0,.2,1);
    }

    .rf-numeros { display: flex; flex-wrap: wrap; gap: 6px; }
    .rf-num {
      padding: 5px 11px; border-radius: 7px; font-size: .78rem; font-weight: 700;
      background: rgba(118,196,255,.1); border: 1px solid rgba(118,196,255,.3);
      color: #76c4ff; font-family: Consolas, monospace;
    }
    .rf-vazio {
      padding: 18px; border-radius: 12px; text-align: center;
      background: var(--bg-2, #08080b); border: 1px dashed var(--border-2, #2a2a32);
      color: var(--muted, #8a8a94); font-size: .85rem; line-height: 1.6;
    }
    .rf-vazio b { color: #fff; }

    .rf-como {
      padding: 15px 28px 20px; border-top: 1px solid var(--border, #232329);
      background: rgba(0,0,0,.2); display: grid; gap: 9px;
    }
    .rf-passo {
      display: flex; gap: 11px; align-items: flex-start;
      font-size: .82rem; color: var(--muted, #8a8a94); line-height: 1.5;
    }
    .rf-passo b { color: #fff; }
    .rf-passo .i {
      flex: none; width: 20px; height: 20px; border-radius: 50%;
      background: rgba(118,196,255,.12); border: 1px solid rgba(118,196,255,.35);
      color: #76c4ff; font-size: .68rem; font-weight: 800;
      display: grid; place-items: center; margin-top: 1px;
    }
  `;

  /* Contador de geração. A página chama renderRifa() ao entrar, e o painel de
     afiliado chama de novo depois que decide quem mostra o link. Sem isto, uma
     chamada antiga e lenta termina DEPOIS da nova e redesenha por cima —
     inclusive trazendo de volta o link duplicado que a nova tinha tirado. */
  let geracao = 0;

  let cssPronto = false;
  function injetarCSS() {
    if (cssPronto) return;
    cssPronto = true;
    const e = document.createElement('style');
    e.textContent = CSS;
    document.head.appendChild(e);
  }

  function sessao() {
    try { return JSON.parse(localStorage.getItem('almaz_user') || 'null') || {}; }
    catch { return {}; }
  }

  window.renderRifa = async function () {
    const alvo = document.getElementById('rifa');
    if (!alvo) return;
    injetarCSS();

    const minha = ++geracao;
    const desatualizada = () => minha !== geracao;

    const u = sessao();
    if (!u.email) return;

    let d;
    try {
      const r = await fetch(`${window.API_URL}/api/rifa/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email }),
      });
      d = await r.json();
      if (!d || !d.success) throw new Error('respuesta inválida');
    } catch (e) {
      if (desatualizada()) return;
      alvo.innerHTML = '';   // sem servidor, some em vez de mostrar erro
      if (window.almazAjustarIndique) window.almazAjustarIndique();
      return;
    }

    if (desatualizada()) return;   // chegou tarde: outra renderização já mandou

    // Defaults defensivos: se o servidor devolver um formato diferente do
    // esperado (deploy em andamento, versão antiga em cache), o bloco tem que
    // degradar em vez de estourar e derrubar o resto da página.
    const numeros = Array.isArray(d.numeros) ? d.numeros : [];
    const quantidade = Number(d.quantidade) || numeros.length;
    const porVenda = Number(d.numerosPorVenda) || 5;
    const progresso = Math.max(0, Math.min(100, Number(d.progresso) || 0));
    const link = d.link || '';
    if (!link) {
      alvo.innerHTML = '';
      if (window.almazAjustarIndique) window.almazAjustarIndique();
      return;
    }

    // Os dois programas usam o MESMO link, e mostrar duas vezes faz o cliente
    // achar que são links diferentes e copiar o errado. Então quando o painel de
    // afiliado mostra o link, a rifa não repete.
    //
    // A checagem é pela flag que o painel LEVANTA depois de realmente desenhar o
    // link, e não pela existência da div. Já quebrou assim uma vez: a div existia,
    // a API de afiliado estava fora do ar, e o cliente ficou SEM link nenhum na
    // tela. Se o painel não conseguir carregar, a rifa volta a mostrar o dela.
    const linkJaMostrado = window.ALMAZ_AF_LINK_VISIVEL === true;

    // No máximo 10 números na tela. Quem indicou muito vê "+N" no fim, em vez
    // de uma parede de números que empurra o resto da página pra baixo.
    const mostra = numeros.slice(0, 10);
    const resto = numeros.length - mostra.length;

    const listaNumeros = quantidade
      ? `<div>
           <div class="rf-link-rot">Tus números</div>
           <div class="rf-numeros">
             ${mostra.map(n => `<span class="rf-num">${String(n).padStart(4, '0')}</span>`).join('')}
             ${resto > 0 ? `<span class="rf-num">+${resto}</span>` : ''}
           </div>
         </div>`
      : `<div class="rf-vazio">
           <b>Todavía no tienes números.</b><br>
           Manda tu enlace a alguien. Cuando esa persona compre el
           <b>plan vitalicio</b>, ${porVenda} números caem aqui.
         </div>`;

    alvo.innerHTML = `
      <div class="rf">
        <div class="rf-topo">
          <img class="rf-img" src="${RIFA_IMG}" alt="Tarjeta de video RTX 3060"
               onerror="this.style.display='none'">
          <div class="rf-txt">
            <div class="rf-selo">${linkJaMostrado ? 'Premio extra' : 'Sorteo entre los miembros'}</div>
            <h3>${linkJaMostrado
              ? 'Y además participas por una <span>RTX 3060</span>' : 'Recomienda y participa por una <span>RTX 3060</span>'}</h3>
            <div class="rf-sub">
              ${d.premio}.<br>
              ${linkJaMostrado
                ? `Além do dinheiro, cada indicação do <b>plan vitalicio</b> con el mismo enlace todavía te da <b>${porVenda} números</b> en el sorteo.` : `Cuando alguien compra el <b>plan vitalicio</b> con tu enlace, ganas
                   <b>${porVenda} números</b>. Sem limite: quanto mais gente entrar
                   por você, mais chances você tem.`}
            </div>
          </div>
        </div>

        <div class="rf-corpo">
          ${linkJaMostrado ? '' : `<div>
            <div class="rf-link-rot">Tu enlace de recomendación</div>
            <div class="rf-link">
              <input type="text" id="rf-url" value="${link}" readonly onclick="this.select()">
              <button class="rf-copiar" id="rf-btn">Copiar enlace</button>
            </div>
          </div>`}

          <div>
            <div class="rf-link-rot">Progreso hasta el sorteo</div>
            <div class="rf-barra-fora"><div class="rf-barra" style="width:${progresso}%"></div></div>
          </div>

          ${listaNumeros}
        </div>

        ${linkJaMostrado ? '' : `<div class="rf-como">
          <div class="rf-passo"><span class="i">1</span><span>Copia tu enlace y mándalo a quien le pueda gustar.</span></div>
          <div class="rf-passo"><span class="i">2</span><span>La persona compra el <b>plan vitalicio</b> con ese enlace.</span></div>
          <div class="rf-passo"><span class="i">3</span><span><b>${porVenda} números</b> entran a tu cuenta en cuanto se acredita el pago.</span></div>
        </div>`}
      </div>`;

    // A seção pode precisar reaparecer: se o painel de afiliado sumiu mas a
    // rifa carregou, ela sozinha já justifica a seção existir.
    if (window.almazAjustarIndique) window.almazAjustarIndique();

    const bt = document.getElementById('rf-btn');
    if (!bt) return;   // sem bloco de link: o painel de afiliado já mostrou
    bt.addEventListener('click', async () => {
      const campo = document.getElementById('rf-url');
      try { await navigator.clipboard.writeText(campo.value); }
      catch (e) { campo.select(); document.execCommand('copy'); }
      bt.textContent = 'Copiado';
      bt.classList.add('ok');
      setTimeout(() => { bt.textContent = 'Copiar enlace'; bt.classList.remove('ok'); }, 2000);
    });
  };
})();
