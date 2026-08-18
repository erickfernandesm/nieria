/* =========================================================
   nierIA
   ---------------------------------------------------------
   CONTATO: altere apenas o bloco abaixo.
   WhatsApp em formato internacional, somente digitos:
   55 (Brasil) + DDD + numero. Ex.: 5511987654321
   ========================================================= */
const CONTATO = {
  whatsapp: '5500000000000',
  mensagem: 'Ola! Vim pelo site da nierIA e quero entender como a tecnologia pode ajudar na minha operacao.',
  instagram: 'niersoftwares'
};

(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsScrollTimeline =
    typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline: scroll()');

  /* barramento unico de scroll: um rAF para todos os assinantes */
  const scrollBus = (function () {
    const assinantes = [];
    let agendado = false;

    const disparar = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      for (let i = 0; i < assinantes.length; i++) assinantes[i](y);
      agendado = false;
    };

    addEventListener('scroll', () => {
      if (!agendado) { requestAnimationFrame(disparar); agendado = true; }
    }, { passive: true });

    addEventListener('resize', () => {
      if (!agendado) { requestAnimationFrame(disparar); agendado = true; }
    }, { passive: true });

    return {
      add(fn) { assinantes.push(fn); fn(window.scrollY || 0); }
    };
  })();

  /* ---------------------------------------------------------
     tela de carregamento
     --------------------------------------------------------- */
  let cortinaAberta = !document.querySelector('[data-preloader]');
  const aoAbrirCortina = [];

  /* fila em vez de evento: se a cortina ja subiu, roda na hora;
     se ainda nao, entra na fila. Nao ha corrida de registro. */
  function quandoPronto(fn) {
    cortinaAberta ? fn() : aoAbrirCortina.push(fn);
  }

  function abrirCortina() {
    if (cortinaAberta) return;
    cortinaAberta = true;
    while (aoAbrirCortina.length) aoAbrirCortina.shift()();
  }

  function preloader() {
    const el = $('[data-preloader]');
    if (!el) return;

    if (reduced) { el.remove(); abrirCortina(); return; }

    document.documentElement.classList.add('is-loading');
    const inicio = Date.now();
    let saiu = false;

    const sair = () => {
      if (saiu) return;
      saiu = true;
      document.documentElement.classList.remove('is-loading');
      el.classList.add('done');
      abrirCortina();
      setTimeout(() => el.remove(), 700);
    };

    // fica no minimo 750ms para nao piscar, e sai assim que a pagina carrega
    const agendar = () => setTimeout(sair, Math.max(0, 750 - (Date.now() - inicio)));
    if (document.readyState === 'complete') agendar();
    else addEventListener('load', agendar, { once: true });

    // teto, caso algum recurso externo trave
    setTimeout(sair, 2600);
  }

  /* ---------------------------------------------------------
     contato
     --------------------------------------------------------- */
  function contato() {
    const numero = String(CONTATO.whatsapp || '').replace(/\D/g, '');
    const href = numero
      ? 'https://wa.me/' + numero + '?text=' + encodeURIComponent(CONTATO.mensagem || '')
      : 'https://wa.me/';

    $$('[data-wa]').forEach(el => {
      el.href = href;
      el.target = '_blank';
      el.rel = 'noopener';
    });

    const perfil = String(CONTATO.instagram || '').replace(/^@/, '');
    $$('[data-ig]').forEach(el => { el.href = 'https://instagram.com/' + perfil; });
    $$('[data-ig-label]').forEach(el => { el.textContent = '@' + perfil; });
  }

  /* ---------------------------------------------------------
     navegacao
     --------------------------------------------------------- */
  function navegacao() {
    const nav = $('[data-nav]');
    const menu = $('[data-menu]');
    const botao = $('[data-toggle]');
    if (!nav || !menu || !botao) return;

    const fechar = () => {
      menu.classList.remove('open');
      nav.classList.remove('is-menu-open');
      botao.setAttribute('aria-expanded', 'false');
      botao.setAttribute('aria-label', 'Abrir menu');
      document.body.classList.remove('is-locked');
    };

    botao.addEventListener('click', () => {
      const aberto = menu.classList.toggle('open');
      nav.classList.toggle('is-menu-open', aberto);
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('is-locked', aberto);
    });

    $$('a', menu).forEach(a => a.addEventListener('click', fechar));

    addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('open')) { fechar(); botao.focus(); }
    });

    addEventListener('resize', () => { if (innerWidth > 820) fechar(); });

    scrollBus.add(y => { nav.classList.toggle('is-stuck', y > 20); });
  }

  /* ---------------------------------------------------------
     secao ativa no menu
     --------------------------------------------------------- */
  function secaoAtiva() {
    const links = $$('[data-spy]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const mapa = new Map();
    links.forEach(a => {
      const alvo = document.querySelector(a.getAttribute('href'));
      if (alvo) mapa.set(alvo, a);
    });

    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove('active'));
        const link = mapa.get(e.target);
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    mapa.forEach((_, secao) => obs.observe(secao));
  }

  /* ---------------------------------------------------------
     barra de progresso e botao flutuante
     --------------------------------------------------------- */
  function progressoEFlutuante() {
    const barra = $('[data-progress]');
    const wa = $('.wa-float');

    /* medir a altura do documento a cada quadro obriga o navegador a
       recalcular o layout inteiro, entao ela fica em cache */
    let alcance = 0;
    const medir = () => { alcance = document.documentElement.scrollHeight - innerHeight; };
    medir();
    addEventListener('resize', medir, { passive: true });
    setTimeout(medir, 1200);

    let mostrando = null;
    scrollBus.add(y => {
      if (barra && !supportsScrollTimeline) {
        barra.style.width = (alcance > 0 ? (y / alcance) * 100 : 0) + '%';
      }
      if (wa) {
        const deve = y > innerHeight * 0.65;
        if (deve !== mostrando) { wa.classList.toggle('show', deve); mostrando = deve; }
      }
    });
  }

  /* ---------------------------------------------------------
     titulos: cada linha sobe atras de uma mascara
     --------------------------------------------------------- */
  function linhas() {
    const titulos = $$('[data-lines]');
    if (!titulos.length) return;

    titulos.forEach(el => {
      const partes = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = partes
        .map((p, i) => '<span class="ln" style="--i:' + i + '"><span>' + p.trim() + '</span></span>')
        .join('');
      el.classList.add('lines');
    });

    if (reduced || !('IntersectionObserver' in window)) {
      titulos.forEach(el => el.classList.add('in'));
      return;
    }

    const obs = new IntersectionObserver((entradas, o) => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        o.unobserve(e.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

    quandoPronto(() => titulos.forEach(el => obs.observe(el)));
  }

  /* ---------------------------------------------------------
     entrada dos blocos
     --------------------------------------------------------- */
  function revelar() {
    const alvos = $$('.reveal');
    if (!alvos.length) return;

    $$('[data-stagger]').forEach(grupo => {
      $$('.reveal', grupo).forEach((el, i) => {
        if (!el.style.getPropertyValue('--d')) {
          el.style.setProperty('--d', (Math.min(i, 9) * 0.06).toFixed(2) + 's');
        }
      });
    });

    if (reduced || !('IntersectionObserver' in window)) {
      alvos.forEach(el => el.classList.add('in'));
      return;
    }

    const obs = new IntersectionObserver((entradas, o) => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        o.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });

    quandoPronto(() => alvos.forEach(el => obs.observe(el)));
  }

  /* ---------------------------------------------------------
     acordeao de servicos
     --------------------------------------------------------- */
  function acordeao() {
    const lista = $('[data-acc]');
    if (!lista) return;

    const cabecas = $$('.acc__head', lista);

    const aplicar = (cabeca, aberto) => {
      cabeca.setAttribute('aria-expanded', String(aberto));
      cabeca.closest('.acc__item').classList.toggle('is-open', aberto);
    };

    cabecas.forEach(cabeca => {
      aplicar(cabeca, cabeca.getAttribute('aria-expanded') === 'true');

      cabeca.addEventListener('click', () => {
        const jaAberto = cabeca.getAttribute('aria-expanded') === 'true';
        cabecas.forEach(c => aplicar(c, false));
        aplicar(cabeca, !jaAberto);
      });
    });
  }

  /* ---------------------------------------------------------
     marquee dos segmentos
     --------------------------------------------------------- */
  function marquee() {
    $$('[data-marquee]').forEach(caixa => {
      const trilho = $('.marquee__track', caixa);
      if (!trilho) return;
      trilho.append(...Array.from(trilho.children).map(n => n.cloneNode(true)));
    });
  }

  /* ---------------------------------------------------------
     pausa animacoes continuas fora da tela
     --------------------------------------------------------- */
  function pausarForaDaTela() {
    if (!('IntersectionObserver' in window)) return;

    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => e.target.classList.toggle('pausado', !e.isIntersecting));
    }, { rootMargin: '10% 0px' });

    $$('.marquee__track').forEach(el => obs.observe(el));
    $$('.hero__scan').forEach(el => obs.observe(el));
  }

  /* ---------------------------------------------------------
     conversa animada
     --------------------------------------------------------- */
  function conversa() {
    const chat = $('[data-chat]');
    if (!chat) return;

    const corpo = $('[data-chat-body]', chat);
    const baloes = $$('.msg', corpo);
    const digitando = $('[data-typing]', corpo);
    if (!baloes.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      baloes.forEach(b => b.classList.add('show'));
      return;
    }

    let rodou = false;
    const tocar = () => {
      if (rodou) return;
      rodou = true;

      let atraso = 450;
      baloes.forEach((balao, i) => {
        const resposta = balao.classList.contains('msg--out');

        if (resposta) {
          const t = atraso;
          setTimeout(() => { corpo.insertBefore(digitando, balao); digitando.classList.add('show'); }, t);
          atraso += 1150;
        }

        const t = atraso;
        setTimeout(() => {
          if (resposta) digitando.classList.remove('show');
          balao.classList.add('show');
        }, t);

        if (i < baloes.length - 1) atraso += 900;
      });
    };

    new IntersectionObserver((entradas, o) => {
      entradas.forEach(e => { if (e.isIntersecting) { tocar(); o.disconnect(); } });
    }, { threshold: 0.3 }).observe(chat);
  }

  /* ---------------------------------------------------------
     linha do tempo que preenche com o scroll
     --------------------------------------------------------- */
  function linhaDoTempo() {
    const lista = $('[data-tl]');
    const preenche = $('[data-tl-fill]');
    if (!lista || !preenche || reduced) return;

    let naTela = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(e => { naTela = e[0].isIntersecting; },
        { rootMargin: '20% 0px' }).observe(lista);
    } else { naTela = true; }

    scrollBus.add(() => {
      if (!naTela) return;
      const r = lista.getBoundingClientRect();
      const pct = (innerHeight * 0.62 - r.top) / r.height;
      preenche.style.height = Math.max(0, Math.min(1, pct)) * 100 + '%';
    });
  }

  /* ---------------------------------------------------------
     parallax discreto nas marcas d'agua
     --------------------------------------------------------- */
  function parallax() {
    const alvos = $$('[data-parallax]');
    if (!alvos.length || reduced || innerWidth < 900) return;

    scrollBus.add(y => {
      alvos.forEach(el => {
        const fator = parseFloat(el.dataset.parallax) || 0.1;
        const secao = el.parentElement;
        const topo = secao.offsetTop;
        el.style.transform = 'translate3d(0,' + ((y - topo) * fator).toFixed(1) + 'px,0)';
      });
    });
  }

  /* ---------------------------------------------------------
     logo: reexecuta a montagem do simbolo no hover
     --------------------------------------------------------- */
  function logo() {
    if (reduced) return;

    $$('.logo').forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (el.classList.contains('replay')) return;
        el.classList.add('replay');
        setTimeout(() => el.classList.remove('replay'), 780);
      });
    });
  }

  /* ---------------------------------------------------------
     ano
     --------------------------------------------------------- */
  function ano() {
    $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  }

  function iniciar() {
    try {
      preloader();
      setTimeout(abrirCortina, 3000);
      contato();
      navegacao();
      secaoAtiva();
      progressoEFlutuante();
      linhas();
      revelar();
      acordeao();
      marquee();
      pausarForaDaTela();
      conversa();
      linhaDoTempo();
      parallax();
      logo();
      ano();
    } catch (erro) {
      /* rede de seguranca: sem a classe js as regras que escondem o conteudo
         param de valer, entao a pagina aparece inteira, so que sem animacao */
      document.documentElement.classList.remove('js');
      document.documentElement.classList.remove('is-loading');
      const cortina = $('[data-preloader]');
      if (cortina) cortina.remove();
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', iniciar)
    : iniciar();
})();
