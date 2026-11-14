/* ═══════════════════════════════════════════════════════════════════════════
   ÁREA DO MEMBRO: palco de lançamentos, placa do menu e entradas animadas.
   Mesmo comportamento do launcher novo. Só visual: não mexe em login, key,
   progresso, gate, rifa nem afiliados.
   ═══════════════════════════════════════════════════════════════════════════ */
;(function () {
  'use strict'

  // Lançamentos em destaque (mesma ordem do launcher, catalog.js DESTAQUES).
  // Pra trocar, edite esta lista: appid, nome, capa (img), arte de fundo (bg) e data.
  var LANCAMENTOS = [
  {
    "appid": 4115450,
    "name": "Phantom Blade Zero",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4115450/7f882f889630270d3d3fb93825ac6f55b55e7a6c/header.jpg?t=1793261976",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4115450/8477e332081c0d28657885bf4b3c509823e289c9/page_bg_raw.jpg?t=1793261976",
    "date": "28 out. 2026"
  },
  {
    "appid": 2215200,
    "name": "LEGO Batman: Legacy of the Dark Knight",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2215200/a07a9a6c0c9c1225f5b260b4f29fe40e6f099f6b/header.jpg?t=1789746326",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2215200/6e38f7f240a53b5d1bcfe89d50fb161d4d28d433/page_bg_raw.jpg?t=1789746326",
    "date": "22 mai. 2026"
  },
  {
    "appid": 3321460,
    "name": "Crimson Desert Enhanced",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/236f3814be7a97d86831800691b6096d449222a8/header.jpg?t=1792637341",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3321460/3eb4fa25db870d727842f0d0a3399597b6c2d22f/page_bg_raw.jpg?t=1792637341",
    "date": "19 mar. 2026"
  },
  {
    "appid": 3764200,
    "name": "Resident Evil Requiem",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/ce5437442768e38eb575f205ab9397d0264017b0/header.jpg?t=1779840172",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/863355a6b45cfb9c644318b9372fa937b4114e76/page_bg_raw.jpg?t=1779840172",
    "date": "26 fev. 2026"
  },
  {
    "appid": 3751950,
    "name": "Assassin's Creed Black Flag Resynced",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3751950/8a128a3d00e5c23fd36443876a60e1b6d497fc7b/header_alt_assets_0.jpg?t=1793391152",
    "bg": "https://store.akamai.steamstatic.com/images/storepagebackground/app/3751950?t=1793391152",
    "date": "9 jul. 2026"
  },
  {
    "appid": 3768760,
    "name": "007 First Light",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3768760/c5b553fd05ba41aefa6daeddac95849a10c93022/header_alt_assets_4.jpg?t=1791886607",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3768760/e8704084c7339af80e412057d6d02972aff81c79/page_bg_raw.jpg?t=1791886607",
    "date": "26 mai. 2026"
  },
  {
    "appid": 4080220,
    "name": "EA SPORTS FC™ 27",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4080220/ff6a3779f1ca83aae8ad3878454f6c11008ea24d/header.jpg?t=1793610006",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4080220/4954b27a73c05793e8e206b126a8187fb27adddc/page_bg_raw.jpg?t=1793610006",
    "date": "24 set. 2026"
  },
  {
    "appid": 2638890,
    "name": "Onimusha: Way of the Sword",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2638890/ce31174fea86d0bafa21b26e853dcd0b7326e36f/header.jpg?t=1790383151",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2638890/a5a258ee02ef3fb2e14287eceb96a45aeea59cdd/page_bg_raw.jpg?t=1790383151",
    "date": "3 set. 2026"
  },
  {
    "appid": 3357650,
    "name": "PRAGMATA",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3357650/e32e168b25ed68a0cf6264c220c07e96c2abfb56/header.jpg?t=1791454600",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3357650/5ed21dc307cb775de7c6143b2222b423e6258067/page_bg_raw.jpg?t=1791454600",
    "date": "16 abr. 2026"
  },
  {
    "appid": 3280350,
    "name": "DEATH STRANDING 2: ON THE BEACH",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3280350/6270c77b0729e2df0a17d660286eeddfd9169386/header.jpg?t=1774022345",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3280350/f8c6ff4bbeede978e93584310fe75cb27cdc60bd/page_bg_raw.jpg?t=1774022345",
    "date": "19 mar. 2026"
  },
  {
    "appid": 2483190,
    "name": "Forza Horizon 6",
    "img": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2483190/c53fe3362cc3267a5d34aca3e796b90963e0e23f/header_alt_assets_6.jpg?t=1793664659",
    "bg": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2483190/5ce35cb7c29431e9c58ec2228f6eaa8842953bc2/page_bg_raw.jpg?t=1793664659",
    "date": "18 mai. 2026"
  }
]

  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function rotulo(g) {
    var ano = Number((String(g.date || '').match(/\d{4}/) || [])[0])
    return ano && ano >= new Date().getFullYear() ? 'Lanzamiento · ' + g.date : 'Llegó a la biblioteca'
  }

  function carregar(url) {
    return new Promise(function (ok) {
      if (!url) return ok(null)
      var img = new Image(); img.decoding = 'async'; img.alt = ''
      img.onload = function () { ok(img) }; img.onerror = function () { ok(null) }
      img.src = url
    })
  }

  function trocar(caixa, img, ms) {
    if (!caixa || !img) return
    caixa.querySelectorAll('img.on').forEach(function (o) { o.classList.remove('on'); o.classList.add('off'); setTimeout(function () { o.remove() }, ms) })
    caixa.appendChild(img)
    requestAnimationFrame(function () { requestAnimationFrame(function () { img.classList.add('on') }) })
  }

  function palco() {
    var art = document.getElementById('stageArt'), show = document.getElementById('stageShow')
    var nome = document.getElementById('stageName'), rail = document.getElementById('stageRail')
    if (!art || !LANCAMENTOS.length) return
    var i = -1, ciclo = 0
    if (rail) {
      rail.innerHTML = LANCAMENTOS.map(function (g, k) {
        return '<button type="button" data-i="' + k + '" title="' + g.name.replace(/"/g, '&quot;') + '"><img src="' + g.img + '" alt="" loading="lazy"></button>'
      }).join('')
      rail.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) { mostrar(+b.dataset.i); reiniciar() } })
    }
    function mostrar(k) {
      i = (k + LANCAMENTOS.length) % LANCAMENTOS.length
      var g = LANCAMENTOS[i]
      Promise.all([carregar(g.bg || g.img), carregar(g.img)]).then(function (r) {
        if (LANCAMENTOS[i] !== g) return
        trocar(art, r[0], 900); trocar(show, r[1], 600)
        if (nome) nome.innerHTML = '<b>' + rotulo(g) + '</b>' + g.name
        if (rail) {
          rail.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', +b.dataset.i === i) })
          var on = rail.querySelector('button.on')
          if (on && rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: on.offsetLeft - rail.clientWidth / 2 + on.clientWidth / 2, behavior: reduz ? 'auto' : 'smooth' })
        }
      })
    }
    function reiniciar() { clearInterval(ciclo); if (!reduz) ciclo = setInterval(function () { if (!document.hidden) mostrar(i + 1) }, 6500) }
    mostrar(0); reiniciar()
  }

  // Placa do menu: um contorno só, que desliza até o item ativo.
  function placa() {
    var nav = document.querySelector('.sidebar .nav')
    if (!nav) return
    var p = document.createElement('span'); p.className = 'nav-plate'; nav.insertBefore(p, nav.firstChild)
    function mover() {
      var a = nav.querySelector('a.active')
      if (!a || !a.offsetParent) { p.classList.remove('on'); return }
      p.style.width = a.offsetWidth + 'px'; p.style.height = a.offsetHeight + 'px'
      p.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)'
      p.classList.add('on')
    }
    new MutationObserver(function (r) { if (r.some(function (x) { return x.target !== p })) mover() })
      .observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] })
    window.addEventListener('resize', mover)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mover)
    mover()
  }

  // Seções entram com fade + blur curto quando aparecem na tela.
  function entradas() {
    var alvos = document.querySelectorAll('.main > .topbar, .main > .license, .main > .duo > *, .main > .section, .main > .bottom > *')
    if (reduz || !('IntersectionObserver' in window)) return
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -8% 0px' })
    alvos.forEach(function (el, k) { el.classList.add('reveal'); el.style.transitionDelay = Math.min(k, 4) * 70 + 'ms'; obs.observe(el) })
  }

  function iniciar() { palco(); placa(); entradas() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar)
  else iniciar()
})()
