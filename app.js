// app.js — Logique principale de l'application

// ── DOM ──────────────────────────────────────────────────────────────────────
const searchInput   = document.getElementById('dept-search');
const clearSearch   = document.getElementById('clear-search');
const deptSelect    = document.getElementById('dept-select');
const selectedDiv   = document.getElementById('selected-dept');
const badgeCode     = document.getElementById('badge-code');
const badgeName     = document.getElementById('badge-name');
const badgeSlug     = document.getElementById('badge-slug');
const resetBtn      = document.getElementById('reset-btn');
const placeholder   = document.getElementById('placeholder-state');
const outputBlocks  = document.getElementById('output-blocks');
const expandBtn4b   = document.getElementById('expand-step4b');
const wrapper4b     = document.getElementById('step4b-wrapper');

let currentDept   = null;
let expanded4b    = false;
let toastTimeout  = null;

// ── POPULATE SELECT ───────────────────────────────────────────────────────────
function normalizeStr(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function populateSelect(filter = '') {
  const f = normalizeStr(filter);
  const regions = {};

  DEPARTMENTS.forEach(dept => {
    const nomN = normalizeStr(dept.nom);
    if (!f || nomN.includes(f) || dept.code.toLowerCase().includes(f)) {
      (regions[dept.region] = regions[dept.region] || []).push(dept);
    }
  });

  deptSelect.innerHTML = '<option value="">— Choisir un département —</option>';
  Object.entries(regions).sort().forEach(([region, depts]) => {
    const grp = document.createElement('optgroup');
    grp.label = region;
    depts.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.code;
      opt.textContent = `${dept.code} — ${dept.nom}`;
      if (currentDept?.code === dept.code) opt.selected = true;
      grp.appendChild(opt);
    });
    deptSelect.appendChild(grp);
  });
}

populateSelect();

// ── SEARCH ────────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  const val = searchInput.value.trim();
  clearSearch.classList.toggle('visible', val.length > 0);
  populateSelect(val);

  // Auto-select si un seul résultat
  const f = normalizeStr(val);
  const matches = DEPARTMENTS.filter(d =>
    normalizeStr(d.nom).includes(f) || d.code.toLowerCase().includes(f)
  );
  if (matches.length === 1) {
    selectDept(matches[0]);
    deptSelect.value = matches[0].code;
  }
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  clearSearch.classList.remove('visible');
  populateSelect();
  searchInput.focus();
});

// ── SELECT CHANGE ─────────────────────────────────────────────────────────────
deptSelect.addEventListener('change', () => {
  const code = deptSelect.value;
  if (!code) { resetAll(); return; }
  const dept = DEPARTMENTS.find(d => d.code === code);
  if (dept) selectDept(dept);
});

// ── SELECT DEPT ───────────────────────────────────────────────────────────────
function selectDept(dept) {
  currentDept = dept;

  const slug = slugify(dept.nom);

  // Badge
  badgeCode.textContent = dept.code;
  badgeName.textContent = dept.nom;
  badgeSlug.textContent = slug;
  selectedDiv.style.display = 'flex';

  // Remplir tous les blocs
  document.getElementById('step2-content').textContent  = generateStep2(dept);
  document.getElementById('step4a-content').textContent = generateStep4_cmd(dept);
  document.getElementById('step4b-content').textContent = generateStep4_config(dept);
  document.getElementById('step5-content').textContent  = generateStep5(dept);
  document.getElementById('step6-content').textContent  = generateStep6(dept);

  // Afficher
  placeholder.style.display  = 'none';
  outputBlocks.style.display = 'flex';

  // Reset expand état
  expanded4b = false;
  wrapper4b.classList.add('collapsed');
  wrapper4b.classList.remove('expanded');
  expandBtn4b.classList.remove('active');
  expandBtn4b.querySelector('span').textContent = 'Développer';
  setExpandIcon(expandBtn4b, false);

  // Sync select
  deptSelect.value = dept.code;
}

// ── RESET ─────────────────────────────────────────────────────────────────────
function resetAll() {
  currentDept = null;
  selectedDiv.style.display = 'none';
  placeholder.style.display  = 'flex';
  outputBlocks.style.display = 'none';
  deptSelect.value = '';
  searchInput.value = '';
  clearSearch.classList.remove('visible');
  populateSelect();
}

resetBtn.addEventListener('click', resetAll);

// ── EXPAND / COLLAPSE CONFIG NGINX ────────────────────────────────────────────
function setExpandIcon(btn, isExpanded) {
  const svg = btn.querySelector('svg');
  if (isExpanded) {
    svg.innerHTML = `
      <polyline points="4 14 10 14 10 20"/>
      <polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
      <line x1="3" y1="21" x2="14" y2="10"/>`;
  } else {
    svg.innerHTML = `
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>`;
  }
}

expandBtn4b.addEventListener('click', () => {
  expanded4b = !expanded4b;
  if (expanded4b) {
    wrapper4b.classList.remove('collapsed');
    wrapper4b.classList.add('expanded');
    expandBtn4b.classList.add('active');
    expandBtn4b.querySelector('span').textContent = 'Réduire';
  } else {
    wrapper4b.classList.add('collapsed');
    wrapper4b.classList.remove('expanded');
    expandBtn4b.classList.remove('active');
    expandBtn4b.querySelector('span').textContent = 'Développer';
  }
  setExpandIcon(expandBtn4b, expanded4b);
});

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg = 'Copié !') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── COPY BUTTON ───────────────────────────────────────────────────────────────
function setupCopy(btnId, targetId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const svgCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const svgCheck = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

  btn.addEventListener('click', async () => {
    const el = document.getElementById(targetId);
    const text = el?.textContent?.trim();
    if (!text) { showToast('Rien à copier'); return; }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback sans HTTPS
      const ta = Object.assign(document.createElement('textarea'), {
        value: text,
        style: 'position:fixed;opacity:0'
      });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    // Feedback
    const origLabel = btn.querySelector('span').textContent;
    btn.classList.add('copied');
    btn.querySelector('svg').outerHTML;
    btn.innerHTML = svgCheck + `<span>Copié !</span>`;
    btn.classList.add('copied');

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = svgCopy + `<span>${origLabel}</span>`;
    }, 2000);

    showToast('Copié dans le presse-papiers !');
  });
}

setupCopy('copy-step2',  'step2-content');
setupCopy('copy-step4a', 'step4a-content');
setupCopy('copy-step4b', 'step4b-content');
setupCopy('copy-step5',  'step5-content');
setupCopy('copy-step6',  'step6-content');

// ── RACCOURCIS CLAVIER ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape' && document.activeElement !== searchInput) {
    resetAll();
  }
});
