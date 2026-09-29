(() => {
  const calc = document.querySelector('[data-almaz-calculator]');
  if (calc) {
    const inputs = [...calc.querySelectorAll('[data-game-price]')];
    const totalNode = calc.querySelector('[data-game-total]');
    const savingNode = calc.querySelector('[data-game-saving]');
    const countNode = calc.querySelector('[data-game-count]');
    const format = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const update = () => {
      const selected = inputs.filter((input) => input.checked);
      const total = selected.reduce((sum, input) => sum + Math.round(Number(input.dataset.gamePrice) * 100), 0) / 100;
      const offer = Number(calc.dataset.offerPrice);
      totalNode.textContent = format.format(total);
      savingNode.textContent = selected.length ? format.format(total - offer) : '\u2014';
      countNode.textContent = selected.length === 1
        ? '1 jogo selecionado'
        : `${selected.length} jogos selecionados`;
      calc.classList.toggle('is-empty', selected.length === 0);
    };
    inputs.forEach((input) => input.addEventListener('change', update));
    update();
  }

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    }));
  }

  document.querySelectorAll('a[data-checkout-placeholder="true"]').forEach((link) => {
    link.addEventListener('click', (event) => event.preventDefault());
  });
})();

