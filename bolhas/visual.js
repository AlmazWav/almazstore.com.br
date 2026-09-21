/* ============================================================
   ALMAZ BUBBLES: visual compartilhado (bolhas, orbes e sons)
   ------------------------------------------------------------
   Tudo desenhado em código (canvas + Web Audio), sem arquivo de imagem nem de
   som de terceiros. Estilo "bala de goma": esfera brilhante com redemoinho
   claro dentro, borda da própria cor e brilho no topo.

   BolhasVisual.sprite(codigo, tamanhoPx)  -> canvas pronto pra drawImage
   BolhasVisual.orbe(cor, simbolo, px)     -> dataURL (orbe grande de enfeite)
   BolhasVisual.som(nome)                  -> 'pop' 'tiro' 'bomba' 'resgate' 'vitoria' 'derrota' 'desceu'
   ============================================================ */
(function () {
  'use strict';

  // ordem igual às cores da referência: azul, vermelha, verde, amarela, laranja, roxa
  // desenho: 'bolhas' (duas bolhinhas dentro), 'espiral' ou 'lisa'
  const CORES = [
    { claro: '#c9f6ff', base: '#1ea7ff', fundo: '#0a5fd6', escuro: '#063b8f', aro: '#8fe6ff', desenho: 'bolhas' },
    { claro: '#ff9b8c', base: '#e8190c', fundo: '#a30802', escuro: '#5c0300', aro: '#ff6a55', desenho: 'lisa' },
    { claro: '#eaff9a', base: '#62d21a', fundo: '#2f9a08', escuro: '#175a02', aro: '#c2ff6a', desenho: 'espiral' },
    { claro: '#fff4a3', base: '#ffc40d', fundo: '#e08a00', escuro: '#8f4f00', aro: '#ffe36a', desenho: 'espiral' },
    { claro: '#ffd3a1', base: '#ff7a10', fundo: '#d04800', escuro: '#7a2600', aro: '#ffb066', desenho: 'espiral' },
    { claro: '#f2c9ff', base: '#a837f2', fundo: '#6d12c4', escuro: '#3a0673', aro: '#dc9cff', desenho: 'espiral' },
  ];

  const cache = {};

  // Bolha de verdade (e não bola): o miolo é mais claro e translúcido, a cor
  // fica mais funda perto da borda, e a borda acende de novo num aro da própria
  // cor. É o aro claro que faz parecer vidro; borda escura faz parecer bola.
  function esfera(g, r, k) {
    let gr = g.createRadialGradient(-r * 0.12, -r * 0.18, 0, 0, 0, r);
    gr.addColorStop(0, k.claro);
    gr.addColorStop(0.38, k.base);
    gr.addColorStop(0.78, k.fundo);
    gr.addColorStop(0.92, k.base);
    gr.addColorStop(1, k.aro);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();

    g.save();
    g.beginPath(); g.arc(0, 0, r * 0.9, 0, Math.PI * 2); g.clip();
    if (k.desenho === 'espiral') {
      // espiral funda com contorno claro (o "redemoinho" das bolhas deles)
      const espiral = () => {
        g.beginPath();
        for (let t = 0; t <= 1; t += 0.02) {
          const a = t * Math.PI * 3.1 + 0.6, rr = r * (0.08 + t * 0.56);
          const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.92;
          t ? g.lineTo(x, y) : g.moveTo(x, y);
        }
      };
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = k.claro; g.globalAlpha = 0.75; g.lineWidth = r * 0.24; espiral(); g.stroke();
      g.strokeStyle = k.fundo; g.globalAlpha = 0.9; g.lineWidth = r * 0.15; espiral(); g.stroke();
      g.globalAlpha = 1;
    } else if (k.desenho === 'bolhas') {
      // duas bolhinhas de contorno branco dentro da bolha azul
      for (const [x, y, rr] of [[-r * 0.3, r * 0.06, r * 0.27], [r * 0.3, r * 0.1, r * 0.25]]) {
        const bg = g.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr);
        bg.addColorStop(0, 'rgba(255,255,255,.55)'); bg.addColorStop(0.6, 'rgba(120,210,255,.25)'); bg.addColorStop(1, 'rgba(10,80,200,.45)');
        g.fillStyle = bg; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = r * 0.06; g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.18, 0, Math.PI * 2); g.fill();
      }
    } else {
      // lisa: miolo mais fundo, como a vermelha deles
      const mg = g.createRadialGradient(r * 0.1, r * 0.15, 0, r * 0.1, r * 0.15, r * 0.7);
      mg.addColorStop(0, k.fundo + 'cc'); mg.addColorStop(1, k.fundo + '00');
      g.fillStyle = mg; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    }
    g.restore();

    contornoEBrilho(g, r, k.escuro);
  }

  function contornoEBrilho(g, r, contorno) {
    // contorno fino
    g.lineWidth = r * 0.05; g.strokeStyle = contorno;
    g.beginPath(); g.arc(0, 0, r * 0.975, 0, Math.PI * 2); g.stroke();
    // meia-lua de luz acompanhando a borda de cima
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = r * 0.11;
    g.beginPath(); g.arc(0, 0, r * 0.78, Math.PI * 1.08, Math.PI * 1.52); g.stroke();
    // brilho suave grande em cima
    const hg = g.createRadialGradient(-r * 0.28, -r * 0.42, 0, -r * 0.28, -r * 0.42, r * 0.48);
    hg.addColorStop(0, 'rgba(255,255,255,.7)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(-r * 0.28, -r * 0.42, r * 0.48, 0, Math.PI * 2); g.fill();
    // pontinho de luz e reflexo embaixo
    g.fillStyle = '#fff'; g.beginPath(); g.arc(r * 0.34, -r * 0.5, r * 0.07, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = r * 0.06;
    g.beginPath(); g.arc(0, 0, r * 0.8, Math.PI * 0.2, Math.PI * 0.6); g.stroke();
  }

  function brilhoTopo(g, r) {
    const hg = g.createRadialGradient(-r * 0.28, -r * 0.42, 0, -r * 0.28, -r * 0.42, r * 0.5);
    hg.addColorStop(0, 'rgba(255,255,255,.75)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(-r * 0.28, -r * 0.42, r * 0.5, 0, Math.PI * 2); g.fill();
    g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = r * 0.1;
    g.beginPath(); g.arc(0, 0, r * 0.78, Math.PI * 1.08, Math.PI * 1.5); g.stroke();
  }

  function pedra(g, r) {
    let gr = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    gr.addColorStop(0, '#d9d2c6'); gr.addColorStop(0.55, '#8f877b'); gr.addColorStop(1, '#3f3a33');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, r * 0.95, 0, Math.PI * 2); g.clip();
    // placas de pedra
    g.strokeStyle = 'rgba(40,34,28,.75)'; g.lineWidth = r * 0.09; g.lineJoin = 'round';
    const linhas = [
      [[-r, -r * 0.1], [-r * 0.35, -r * 0.2], [-r * 0.1, -r * 0.7], [r * 0.2, -r]],
      [[-r * 0.35, -r * 0.2], [-r * 0.2, r * 0.35], [-r * 0.6, r * 0.8]],
      [[-r * 0.2, r * 0.35], [r * 0.35, r * 0.25], [r * 0.6, -r * 0.3], [r, -r * 0.2]],
      [[r * 0.35, r * 0.25], [r * 0.5, r]],
      [[-r * 0.1, -r * 0.7], [r * 0.6, -r * 0.3]],
    ];
    for (const l of linhas) { g.beginPath(); g.moveTo(l[0][0], l[0][1]); for (const p of l.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); }
    g.restore();
    g.lineWidth = r * 0.07; g.strokeStyle = '#2d2924';
    g.beginPath(); g.arc(0, 0, r * 0.965, 0, Math.PI * 2); g.stroke();
    brilhoTopo(g, r * 0.9);
  }

  function bomba(g, r) {
    // bolha de vidro transparente (dá pra ver o fundo atrás)
    let gr = g.createRadialGradient(-r * 0.1, -r * 0.15, 0, 0, 0, r);
    gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(0.7, 'rgba(225,230,245,.45)');
    gr.addColorStop(0.93, 'rgba(190,198,220,.8)'); gr.addColorStop(1, 'rgba(255,255,255,.95)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    // bomba preta
    const bg = g.createRadialGradient(-r * 0.15, 0, r * 0.03, 0, r * 0.1, r * 0.46);
    bg.addColorStop(0, '#7a7a88'); bg.addColorStop(0.45, '#1d1d25'); bg.addColorStop(1, '#040406');
    g.fillStyle = bg; g.beginPath(); g.arc(0, r * 0.1, r * 0.43, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b2b33'; g.beginPath(); g.ellipse(r * 0.2, -r * 0.3, r * 0.13, r * 0.09, -0.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9a7a45'; g.lineWidth = r * 0.06; g.lineCap = 'round';
    g.beginPath(); g.moveTo(r * 0.25, -r * 0.36); g.quadraticCurveTo(r * 0.33, -r * 0.56, r * 0.5, -r * 0.55); g.stroke();
    const fa = g.createRadialGradient(r * 0.52, -r * 0.57, 0, r * 0.52, -r * 0.57, r * 0.2);
    fa.addColorStop(0, '#fffbe0'); fa.addColorStop(0.35, '#ffb020'); fa.addColorStop(1, 'rgba(255,90,0,0)');
    g.fillStyle = fa; g.beginPath(); g.arc(r * 0.52, -r * 0.57, r * 0.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(-r * 0.14, -r * 0.05, r * 0.08, 0, Math.PI * 2); g.fill();
    contornoEBrilho(g, r, 'rgba(120,128,150,.9)');
  }

  /** Sprite de uma casa do tabuleiro (cor 0..5, pedra 98/100, bomba 99/101). */
  function sprite(codigo, px) {
    px = Math.max(8, Math.round(px));
    const chave = codigo + '@' + px;
    if (cache[chave]) return cache[chave];
    const cv = document.createElement('canvas');
    const m = Math.ceil(px * 0.08);
    cv.width = cv.height = px + m * 2;
    const g = cv.getContext('2d');
    g.translate(cv.width / 2, cv.height / 2);
    const r = px / 2;
    if (codigo === 98 || codigo === 100) pedra(g, r);
    else if (codigo === 99 || codigo === 101) bomba(g, r);
    else esfera(g, r, CORES[((codigo % 6) + 6) % 6]);
    cv._margem = m;
    return (cache[chave] = cv);
  }

  /** Orbe grande de enfeite (fundo do painel), com estrela ou diamante dentro. */
  function orbe(cor, simbolo, px) {
    const cv = document.createElement('canvas');
    px = px || 220;
    cv.width = cv.height = Math.round(px * 1.3);
    const g = cv.getContext('2d');
    g.translate(cv.width / 2, cv.height / 2);
    const r = px / 2, k = CORES[cor % 6];
    const halo = g.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.3);
    halo.addColorStop(0, k.base + 'aa'); halo.addColorStop(1, k.base + '00');
    g.fillStyle = halo; g.beginPath(); g.arc(0, 0, r * 1.3, 0, Math.PI * 2); g.fill();
    // vidro
    const vg = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    vg.addColorStop(0, k.claro); vg.addColorStop(0.5, k.base + 'dd'); vg.addColorStop(1, k.escuro);
    g.fillStyle = vg; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    // símbolo
    g.save(); g.shadowColor = k.claro; g.shadowBlur = r * 0.25;
    g.fillStyle = k.claro; g.strokeStyle = k.escuro; g.lineWidth = r * 0.04;
    g.beginPath();
    if (simbolo === 'diamante') {
      const s = r * 0.5;
      g.moveTo(-s * 0.7, -s * 0.35); g.lineTo(-s * 0.35, -s * 0.75); g.lineTo(s * 0.35, -s * 0.75); g.lineTo(s * 0.7, -s * 0.35); g.lineTo(0, s * 0.8); g.closePath();
    } else {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.24 : r * 0.52;
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
    }
    g.fill(); g.stroke(); g.restore();
    g.lineWidth = r * 0.05; g.strokeStyle = k.brilho;
    g.beginPath(); g.arc(0, 0, r * 0.97, 0, Math.PI * 2); g.stroke();
    brilhoTopo(g, r);
    return cv.toDataURL('image/png');
  }

  // ---------- sons (sintetizados, sem arquivo) ----------
  let ac = null, mudo = false;
  try { mudo = localStorage.getItem('bolhasMudo') === '1'; } catch (e) {}
  function audio() {
    if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tom(freq, dur, tipo, vol, deslize, atraso) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + (atraso || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (deslize) o.frequency.exponentialRampToValueAtTime(Math.max(20, deslize), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function ruido(dur, vol, filtro) {
    const a = audio(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const s = a.createBufferSource(); s.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtro || 1200;
    const g = a.createGain(); g.gain.value = vol || 0.4;
    s.connect(f).connect(g).connect(a.destination); s.start();
  }
  const SONS = {
    tiro: () => tom(520, 0.09, 'triangle', 0.12, 260),
    pop: (n) => { for (let i = 0; i < Math.min(5, n || 3); i++) tom(700 + i * 140 + Math.random() * 80, 0.07, 'sine', 0.16, 1400, i * 0.045); },
    bomba: () => { ruido(0.7, 0.7, 700); tom(90, 0.5, 'sawtooth', 0.25, 30); },
    desceu: () => tom(180, 0.25, 'square', 0.08, 110),
    resgate: () => { [660, 880, 1320].forEach((f, i) => tom(f, 0.18, 'triangle', 0.16, null, i * 0.07)); },
    vitoria: () => { [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.25, 'triangle', 0.18, null, i * 0.11)); },
    derrota: () => { [392, 330, 262].forEach((f, i) => tom(f, 0.3, 'sine', 0.16, f * 0.9, i * 0.16)); },
    clique: () => tom(900, 0.04, 'sine', 0.08),
  };
  function som(nome, arg) { if (!mudo && SONS[nome]) try { SONS[nome](arg); } catch (e) {} }
  function setMudo(v) { mudo = !!v; try { localStorage.setItem('bolhasMudo', mudo ? '1' : '0'); } catch (e) {} }

  window.BolhasVisual = { CORES, sprite, orbe, som, setMudo, get mudo() { return mudo; } };
})();
