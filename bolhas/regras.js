/* ============================================================
   ALMAZ BUBBLES: REGRAS DA PARTIDA (arquivo compartilhado)
   ------------------------------------------------------------
   Este MESMO arquivo roda em dois lugares:
     - no navegador (3-SITE/bolhas/regras.js, cópia idêntica), pra desenhar a
       mira e animar a partida;
     - no servidor (2-MEMBROS/bolhas-regras.js), pra REFAZER a partida inteira a
       partir da lista de ângulos quando o jogador resgata.
   O servidor nunca acredita no multiplicador que a página manda: ele replica
   os tiros aqui e usa o dele. Por isso a geometria é fixa (unidades lógicas),
   sem depender do tamanho da tela. test-bolhas.js confere que as duas cópias
   são idênticas byte a byte.

   Regras copiadas do jogo de referência (conferidas jogando lá em 21/09/2026):
     - 8 casas em TODAS as linhas; a linha ímpar anda meia bolha pra direita
       (a última casa dela encosta na parede).
     - 3 ou mais da mesma cor estouram; cada bolha estourada soma
       mul_per_bubble (0,05x) ao multiplicador, até max_multiplier.
     - bolha que fica solta NÃO cai.
     - a cada shots_per_push tiros o tabuleiro desce uma linha, acertando ou não.
     - bolha na linha death_row = derrota; acertar bomba = derrota.
     - pedra não estoura; bomba só mata se for acertada direto.
     - o jogador pode resgatar (entrada x multiplicador) quando o multiplicador
       passa de min_cashout E o valor do resgate chega em min_cashout_valor (15).
       Na referência são R$ 15: com entrada 3 precisa de 5x, então aposta
       baixa praticamente não resgata. Copiado igual, a pedido do dono.
     - a colisão é larga (quase uma bolha inteira) e o atirador fica dentro do
       tabuleiro: quando as bolhas chegam nele, o tiro encosta na saída.

   Códigos das casas: null = vazia, 0..5 = cores, 98/100 = pedra, 99/101 = bomba.
   Sem travessão em texto de cliente (regra da casa).
   ============================================================ */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.BolhasRegras = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COLS = 8;
  const C = 46;                      // diâmetro da bolha (unidade lógica)
  const ROW_H = C * 0.86;            // distância vertical entre linhas
  const W = COLS * C + C / 2;        // 391: a linha ímpar vai até 8,5 bolhas
  const H = 540;
  const TOPO = 15;                   // y do topo da primeira linha
  const ATIRADOR = { x: W / 2, y: H - 46 };
  const NCORES = 6;

  const CFG_PADRAO = {
    mul_per_bubble: 0.05,
    max_multiplier: 20,
    min_cashout: 1.1,
    min_cashout_valor: 15,          // resgate só a partir de 15 (na referência, R$ 15)
    shots_per_push: 8,
    death_row: 11,
    max_rows: 15,
    bomb_is_lethal: true,
  };

  const ehPedra = (v) => v === 98 || v === 100;
  const ehBomba = (v) => v === 99 || v === 101;
  const ehCor = (v) => typeof v === 'number' && v >= 0 && v < NCORES;
  const vazia = (v) => v === null || v === undefined;
  const colunas = () => COLS;

  function centro(r, c) {
    return { x: C / 2 + c * C + (r % 2 ? C / 2 : 0), y: TOPO + C / 2 + r * ROW_H };
  }

  function vizinhos(r, c, maxRows) {
    const d = r % 2
      ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
      : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
    const out = [];
    for (const [dr, dc] of d) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < maxRows && cc >= 0 && cc < colunas(rr)) out.push([rr, cc]);
    }
    return out;
  }

  // ---------- geração (só o servidor chama; o cliente recebe pronto) ----------
  // Tabuleiro inicial como o da referência: 5 linhas, 4 cores (azul,
  // vermelha, verde, amarela), bastante bomba e pedra rara.
  const GERACAO_PADRAO = { linhas: 5, cores: 4, agrupa: 0.15, pedras: 0.02, bombas: 0.22, fila: 400, empurra: 60 };
  function semente(n) {             // mulberry32
    let a = n >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function linhaAleatoria(rnd, r, anterior, o) {
    const n = colunas(r), linha = new Array(COLS).fill(null);
    for (let c = 0; c < n; c++) {
      const x = rnd();
      if (x < o.bombas) { linha[c] = rnd() < 0.5 ? 99 : 101; continue; }
      if (x < o.bombas + o.pedras) { linha[c] = rnd() < 0.5 ? 98 : 100; continue; }
      // Às vezes repete a cor do vizinho (o.agrupa): quanto mais, mais fácil.
      let cor = Math.floor(rnd() * o.cores);
      if (rnd() < o.agrupa) {
        const opc = [];
        if (c > 0 && ehCor(linha[c - 1])) opc.push(linha[c - 1]);
        if (anterior && ehCor(anterior[c])) opc.push(anterior[c]);
        if (opc.length) cor = opc[Math.floor(rnd() * opc.length)];
      }
      linha[c] = cor;
    }
    return linha;
  }

  /** Tabuleiro inicial, fila de cores e linhas que vão descer. */
  function gerar(seed, opcoes) {
    const o = Object.assign({}, GERACAO_PADRAO, opcoes || {});
    const rnd = semente(seed);
    const board = [];
    let ant = null;
    for (let r = 0; r < o.linhas; r++) { ant = linhaAleatoria(rnd, r, ant, o); board.push(ant); }
    const queue = [];
    for (let i = 0; i < o.fila; i++) queue.push(Math.floor(rnd() * o.cores));
    const pushRows = [];
    ant = null;
    for (let i = 0; i < o.empurra; i++) { ant = linhaAleatoria(rnd, 0, ant, o); pushRows.push(ant); }
    return { board, queue, pushRows };
  }

  // ---------- estado ----------
  function novoEstado(dados, config) {
    const cfg = Object.assign({}, CFG_PADRAO, config || {});
    const board = [];
    for (let r = 0; r < cfg.max_rows; r++) {
      const src = (dados.board || [])[r] || [];
      const linha = new Array(COLS).fill(null);
      for (let c = 0; c < colunas(r); c++) linha[c] = vazia(src[c]) ? null : src[c];
      board.push(linha);
    }
    const queue = (dados.queue || []).slice();
    return {
      cfg, board, queue, entrada: Number(dados.entrada) || 0,
      pushRows: (dados.pushRows || []).map((l) => l.slice()),
      pushIdx: 0, shotCount: 0, mult: 1,
      ended: false, resultado: null, motivo: null,
      nextColor: queue.length ? queue.shift() % NCORES : 0,
    };
  }

  // ---------- trajetória ----------
  const ANG_MIN = -Math.PI + 0.12, ANG_MAX = -0.12;
  const limitarAngulo = (a) => Math.max(ANG_MIN, Math.min(ANG_MAX, a));
  /** O ângulo viaja como inteiro (x10000): é ele que o servidor replica. */
  const anguloDoTiro = (inteiro) => limitarAngulo(inteiro / 10000);
  const tiroDoAngulo = (a) => Math.round(limitarAngulo(a) * 10000);

  function ocupadaPerto(st, x, y) {
    const rA = Math.round((y - TOPO - C / 2) / ROW_H);
    let melhor = null, dm = Infinity;
    for (let r = Math.max(0, rA - 2); r <= Math.min(st.cfg.max_rows - 1, rA + 2); r++) {
      for (let c = 0; c < colunas(r); c++) {
        const v = st.board[r][c];
        if (vazia(v)) continue;
        const p = centro(r, c), d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < (C * 0.95) ** 2 && d < dm) { dm = d; melhor = { r, c, v }; }
      }
    }
    return melhor;
  }

  function casaLivreMaisPerto(st, x, y, perto) {
    const rA = Math.round((y - TOPO - C / 2) / ROW_H);
    let melhor = null, dm = Infinity;
    const candidatas = [];
    if (perto) for (const [r, c] of vizinhos(perto.r, perto.c, st.cfg.max_rows)) candidatas.push([r, c]);
    if (!candidatas.length || rA <= 0) for (let c = 0; c < colunas(0); c++) candidatas.push([0, c]);
    for (let r = Math.max(0, rA - 1); r <= Math.min(st.cfg.max_rows - 1, rA + 1); r++) {
      for (let c = 0; c < colunas(r); c++) candidatas.push([r, c]);
    }
    for (const [r, c] of candidatas) {
      if (!vazia(st.board[r][c])) continue;
      const presa = r === 0 || vizinhos(r, c, st.cfg.max_rows).some(([rr, cc]) => !vazia(st.board[rr][cc]));
      if (!presa) continue;
      const p = centro(r, c), d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < dm) { dm = d; melhor = { r, c }; }
    }
    return melhor;
  }

  /** Caminho da bolha: pontos (com ricochete), casa atingida e casa onde encaixa. */
  function prever(st, angulo) {
    const a = limitarAngulo(angulo);
    let x = ATIRADOR.x, y = ATIRADOR.y;
    let vx = Math.cos(a), vy = Math.sin(a);
    const pontos = [{ x, y }];
    const PASSO = 3;
    let comprimento = 0;
    for (let i = 0; i < 2000; i++) {
      x += vx * PASSO; y += vy * PASSO; comprimento += PASSO;
      if (x < C / 2) { x = C - x; vx = -vx; pontos.push({ x: C / 2, y }); }
      else if (x > W - C / 2) { x = 2 * (W - C / 2) - x; vx = -vx; pontos.push({ x: W - C / 2, y }); }
      const hit = ocupadaPerto(st, x, y);
      if (hit || y <= TOPO + C / 2) {
        const alvo = casaLivreMaisPerto(st, x, y, hit);
        pontos.push(alvo ? centro(alvo.r, alvo.c) : { x, y });
        return { pontos, hitCell: hit, targetCell: alvo, comprimento };
      }
    }
    return { pontos, hitCell: null, targetCell: null, comprimento };
  }

  function grupo(st, r0, c0) {
    const cor = st.board[r0][c0], visto = new Set([r0 + ',' + c0]), fila = [[r0, c0]], out = [];
    while (fila.length) {
      const [r, c] = fila.pop(); out.push([r, c]);
      for (const [rr, cc] of vizinhos(r, c, st.cfg.max_rows)) {
        const k = rr + ',' + cc;
        if (visto.has(k) || st.board[rr][cc] !== cor) continue;
        visto.add(k); fila.push([rr, cc]);
      }
    }
    return out;
  }

  function algumaNaLinha(st, linha) {
    return linha < st.cfg.max_rows && st.board[linha].some((v) => !vazia(v));
  }

  function empurrar(st) {
    for (let r = st.cfg.max_rows - 1; r > 0; r--) {
      const src = st.board[r - 1];
      const linha = new Array(COLS).fill(null);
      for (let c = 0; c < colunas(r); c++) linha[c] = src[c] === undefined ? null : src[c];
      st.board[r] = linha;
    }
    const nova = st.pushRows.length ? st.pushRows[st.pushIdx % st.pushRows.length] : [];
    st.pushIdx++;
    const linha0 = new Array(COLS).fill(null);
    for (let c = 0; c < colunas(0); c++) linha0[c] = vazia(nova[c]) ? null : nova[c];
    st.board[0] = linha0;
  }

  function encerrar(st, resultado, motivo) {
    st.ended = true; st.resultado = resultado; st.motivo = motivo;
  }

  /**
   * Um tiro. Muda o estado e devolve o que aconteceu, pra página animar:
   *   { pontos, cor, casa, estouradas:[[r,c]], ganho, desceu, fim }
   */
  function atirar(st, tiroInteiro) {
    if (st.ended) return null;
    const pred = prever(st, anguloDoTiro(tiroInteiro));
    const cor = st.nextColor;
    st.shotCount++;
    const ev = { pontos: pred.pontos, cor, casa: null, estouradas: [], ganho: 0, desceu: false, fim: null, bomba: null };

    if (pred.hitCell && ehBomba(pred.hitCell.v) && st.cfg.bomb_is_lethal) {
      st.board[pred.hitCell.r][pred.hitCell.c] = null;
      ev.bomba = { r: pred.hitCell.r, c: pred.hitCell.c };
      encerrar(st, 'perdeu', 'bomb_exploded'); ev.fim = st.motivo;
      return ev;
    }
    if (!pred.targetCell) { encerrar(st, 'perdeu', 'board_limit'); ev.fim = st.motivo; return ev; }

    const { r, c } = pred.targetCell;
    st.board[r][c] = cor;
    ev.casa = { r, c };
    const g = grupo(st, r, c);
    if (g.length >= 3) {
      g.forEach(([rr, cc]) => { st.board[rr][cc] = null; });
      ev.estouradas = g;
      ev.ganho = g.length * st.cfg.mul_per_bubble;
      st.mult = Math.min(st.cfg.max_multiplier, arred(st.mult + ev.ganho));
    }
    st.nextColor = st.queue.length ? st.queue.shift() % NCORES : 0;

    if (st.shotCount % Math.max(1, st.cfg.shots_per_push) === 0) {
      empurrar(st); ev.desceu = true;
      if (algumaNaLinha(st, st.cfg.death_row)) { encerrar(st, 'perdeu', 'board_limit'); ev.fim = st.motivo; return ev; }
    }
    if (r >= st.cfg.death_row) { encerrar(st, 'perdeu', 'board_limit'); ev.fim = st.motivo; }
    return ev;
  }

  // Multiplicador guardado com 4 casas: soma de 0,045 em ponto flutuante
  // não pode dar valor diferente no navegador e no servidor.
  function arred(x) { return Math.round(x * 10000) / 10000; }

  const valorResgate = (st) => Math.floor(st.entrada * st.mult);
  function podeResgatar(st) {
    return !st.ended && st.mult >= st.cfg.min_cashout && valorResgate(st) >= (st.cfg.min_cashout_valor || 0);
  }

  /** Refaz a partida inteira (servidor). Devolve o estado final. */
  function replicar(dados, config, tiros) {
    const st = novoEstado(dados, config);
    for (const t of tiros) {
      if (st.ended) break;
      atirar(st, t);
    }
    return st;
  }

  return {
    COLS, C, ROW_H, W, H, TOPO, ATIRADOR, NCORES, CFG_PADRAO, GERACAO_PADRAO,
    ehPedra, ehBomba, ehCor, colunas, centro, vizinhos,
    gerar, novoEstado, prever, atirar, podeResgatar, valorResgate, replicar,
    anguloDoTiro, tiroDoAngulo, limitarAngulo,
  };
});
