(() => {
  const CONTACT_EMAIL = 'aosteplomberie@orange.fr';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Statut ouvert / fermé (heure de Paris) ---------- */
  function updateStatus() {
    const el = $('[data-status]');
    if (!el) return;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const minutes = Number(get('hour')) * 60 + Number(get('minute'));
    const weekday = !['Sat', 'Sun'].includes(get('weekday'));
    const morning = minutes >= 480 && minutes < 720;
    const afternoon = minutes >= 840 && minutes < 1080;
    const open = weekday && (morning || afternoon);
    el.classList.toggle('is-open', open);
    $('[data-status-text]', el).textContent = open
      ? `Ouvert jusqu'à ${morning ? '12h' : '18h'}`
      : 'Fermé : laissez un message';
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Maison interactive ---------- */
  const HOUSE = {
    plomberie: 'Fuite, robinetterie, chauffe-eau, débouchage ou réseau à refaire : nos plombiers interviennent en urgence ou sur rendez-vous.',
    chauffage: 'Chaudière, pompe à chaleur ou poêle à granulés : nous posons, remplaçons et mettons en route votre chauffage.',
    clim: 'Clim réversible pour une pièce, un logement entier, des bureaux ou un commerce : pose, remplacement et entretien.',
    sanitaire: "Salle de bains et WC créés ou rénovés, douche à l'italienne, équipements PMR et maintien à domicile.",
    entretien: 'Entretien et dépannage de chaudières gaz, fioul et bois, toutes marques, avec contrat annuel si vous le souhaitez.'
  };
  const house = $('[data-house]');
  if (house) {
    // Ajoute la couche animée au-dessus de chaque tuyau.
    $$('.pipe', house).forEach((pipe) => {
      const flow = pipe.cloneNode();
      flow.classList.remove('pipe');
      flow.classList.add('pipe-flow');
      pipe.after(flow);
    });
    const buttons = $$('[data-target]', house);
    const circuitParts = $$('.pipes path, .device', house);
    const text = $('[data-house-text]', house);
    const link = $('[data-house-link]', house);
    let timer;

    const activate = (key) => {
      house.dataset.active = key;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.target === key)));
      circuitParts.forEach((p) => p.classList.toggle('is-on', p.classList.contains(`c-${key}`)));
      text.textContent = HOUSE[key];
      link.href = `#svc-${key}`;
    };
    const stopAuto = () => clearInterval(timer);

    buttons.forEach((b) => b.addEventListener('click', () => {
      stopAuto();
      activate(b.dataset.target);
    }));
    activate('chauffage');

    if (!reduceMotion) {
      const order = Object.keys(HOUSE);
      timer = setInterval(() => {
        if (document.hidden) return;
        activate(order[(order.indexOf(house.dataset.active) + 1) % order.length]);
      }, 5000);
      // L'animation automatique s'arrête dès que le visiteur explore lui-même.
      ['pointerenter', 'focusin'].forEach((evt) => house.addEventListener(evt, stopAuto));
    }
  }

  /* ---------- Diagnostic ---------- */
  const GAS_WARNING = "Odeur de gaz ? Ne touchez à aucun interrupteur, ouvrez les fenêtres, sortez et appelez Urgence Sécurité Gaz au <a href=\"tel:0800473333\">0 800 47 33 33</a>.";
  const TRIAGE = {
    fuite: {
      tag: 'À traiter vite', tagColor: '#f15b24', title: "Coupez l'eau, puis appelez-nous.", need: 'Plomberie',
      steps: ["Fermez le robinet d'arrêt général, souvent près du compteur.", "Si l'eau approche des prises ou d'un appareil, coupez l'électricité de la zone.", 'Appelez-nous : une photo de la fuite nous aidera à préparer l\'intervention.']
    },
    eauchaude: {
      tag: 'À traiter rapidement', tagColor: '#ff9a73', title: 'Quelques vérifications avant notre venue.', need: 'Entretien ou dépannage',
      steps: ["Regardez si le disjoncteur du chauffe-eau n'a pas sauté.", 'Sur une chaudière, notez le code ou le message affiché.', "Appelez-nous avec la marque et le modèle si vous les avez."],
      warning: GAS_WARNING
    },
    panne: {
      tag: 'À traiter rapidement', tagColor: '#ff9a73', title: 'Notez le code panne et ne forcez pas.', need: 'Entretien ou dépannage',
      steps: ["Relevez le code d'erreur et la pression affichée.", 'Ne relancez pas la chaudière à répétition et ne démontez rien.', 'Appelez-nous : nous intervenons sur les chaudières gaz, fioul et bois, toutes marques.'],
      warning: GAS_WARNING
    },
    bouche: {
      tag: 'À traiter rapidement', tagColor: '#ff9a73', title: "Arrêtez d'utiliser l'appareil concerné.", need: 'Plomberie',
      steps: ["Évitez de tirer la chasse ou de faire couler l'eau pour ne pas provoquer de débordement.", 'Évitez les déboucheurs chimiques, agressifs pour vos canalisations.', 'Dites-nous si un seul appareil est touché ou plusieurs : cela change le diagnostic.']
    },
    entretien: {
      tag: 'À planifier', tagColor: '#8fe3e0', title: 'Prenez rendez-vous pour votre visite annuelle.', need: 'Entretien ou dépannage',
      steps: ['Indiquez le type et la marque de votre équipement.', 'Nous vérifions, nettoyons et réglons la combustion de votre chaudière.', 'Vous recevez votre attestation et nos conseils de bon usage.']
    },
    projet: {
      tag: 'Devis gratuit', tagColor: '#8fe3e0', title: 'Parlons de votre projet.', need: 'Autre demande',
      steps: ['Décrivez votre logement ou vos locaux et ce que vous souhaitez changer.', 'Nous réalisons un diagnostic adapté à vos besoins et à votre budget.', 'Vous recevez un devis gratuit, personnalisé et détaillé.']
    }
  };
  const triage = $('[data-triage]');
  let triageNeed = 'Plomberie';
  if (triage) {
    const options = $$('[data-key]', triage);
    const answer = $('.triage-answer', triage);
    const tag = $('[data-t-tag]', triage);
    const title = $('[data-t-title]', triage);
    const steps = $('[data-t-steps]', triage);
    const warning = $('[data-t-warning]', triage);

    const showTriage = (key, animate = true) => {
      const data = TRIAGE[key];
      options.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === key)));
      tag.textContent = data.tag;
      answer.style.setProperty('--tag', data.tagColor);
      title.textContent = data.title;
      steps.replaceChildren(...data.steps.map((s) => {
        const li = document.createElement('li');
        li.textContent = s;
        return li;
      }));
      warning.hidden = !data.warning;
      warning.innerHTML = data.warning || '';
      triageNeed = data.need;
      if (animate) {
        answer.classList.remove('is-switching');
        void answer.offsetWidth;
        answer.classList.add('is-switching');
      }
    };
    options.forEach((b) => b.addEventListener('click', () => showTriage(b.dataset.key)));
    showTriage('fuite', false);
  }

  /* ---------- Formulaire ---------- */
  const form = $('[data-form]');
  const needSelect = $('#f-need');
  const prefill = (need) => { if (needSelect && need) needSelect.value = need; };
  $$('[data-need]').forEach((a) => a.addEventListener('click', () => prefill(a.dataset.need)));
  const triageLink = $('[data-t-form]');
  if (triageLink) triageLink.addEventListener('click', () => prefill(triageNeed));

  // Un lien vers un service ouvre sa ligne d'accordéon.
  const openServiceFromHash = (hash) => {
    if (!hash || !hash.startsWith('#svc-')) return;
    const details = $(hash);
    if (details) details.open = true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#svc-"]');
    if (a) openServiceFromHash(a.getAttribute('href'));
  });
  openServiceFromHash(location.hash);

  if (form) {
    const error = $('[data-form-error]', form);
    const note = $('[data-form-note]', form);
    form.addEventListener('input', (e) => e.target.removeAttribute('aria-invalid'));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = $$('[required]', form).filter((f) => !f.value.trim());
      $$('[required]', form).forEach((f) => f.toggleAttribute('aria-invalid', false));
      if (invalid.length) {
        invalid.forEach((f) => f.setAttribute('aria-invalid', 'true'));
        error.textContent = 'Merci de compléter les champs indiqués en rouge.';
        error.hidden = false;
        invalid[0].focus();
        return;
      }
      error.hidden = true;
      const d = new FormData(form);
      const subject = `Demande ${d.get('besoin')} – ${d.get('commune')}`;
      const body = [
        `Besoin : ${d.get('besoin')}`,
        `Nom : ${d.get('nom')}`,
        `Téléphone : ${d.get('telephone')}`,
        `Commune : ${d.get('commune')}`,
        '',
        d.get('message')
      ].join('\n');
      location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      note.textContent = "Votre messagerie s'est ouverte : il ne reste qu'à envoyer le message. Rien ne s'ouvre ? Appelez le 04 76 37 88 45.";
    });
  }

  /* ---------- Défilement : progression, tuyau du déroulement, menu actif ---------- */
  const flow = $('.flow');
  const flowSteps = flow ? $$('.flow-steps li', flow) : [];
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    doc.style.setProperty('--scroll', max > 0 ? (scrollY / max).toFixed(4) : 0);
    if (flow) {
      const r = flow.getBoundingClientRect();
      const start = innerHeight * .85;
      const end = innerHeight * .4;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * .5)));
      flow.style.setProperty('--p', p.toFixed(3));
      flowSteps.forEach((li, i) => li.classList.toggle('is-reached', p >= (i / flowSteps.length) * .98 + .02));
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Apparitions et menu actif ---------- */
  const revealTargets = $$('.section-head, .triage-grid, .svc-list, .flow, .about-copy, .gallery, .zone-map, .zone-copy, .contact-side, .quote-form');
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el) => io.observe(el));
  }
  const navLinks = $$('.main-nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${en.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => {
      const section = $(a.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
