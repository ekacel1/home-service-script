// script-template.js — Contenu réel du workflow peintre-en-batiment
// Variables : {code_dept} et {nom_departement} (minuscules, sans accents, tirets)

/**
 * Normalise un nom de département en slug minuscule sans accents
 * Ex: "Bouches-du-Rhône" → "bouches-du-rhone"
 */
function slugify(nom) {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // supprime les accents
    .replace(/[^a-z0-9]+/g, "-")      // remplace tout sauf lettres/chiffres par tiret
    .replace(/^-+|-+$/g, "");         // trim tirets
}

// ─── ÉTAPE 2 — Créer les dossiers ────────────────────────────────────────────
function generateStep2(dept) {
  const slug = slugify(dept.nom);
  return `mkdir -p /var/www/peintre-en-batiment-${dept.code}
mkdir -p /var/www/peintres/${slug}`;
}

// ─── ÉTAPE 3 — Déployer les fichiers et définir les permissions ───────────────
function generateStep3(dept) {
  const slug = slugify(dept.nom);
  return `# Copier les fichiers du site principal
cp -r /chemin/source/* /var/www/peintre-en-batiment-${dept.code}/

# Permissions
chown -R www-data:www-data /var/www/peintre-en-batiment-${dept.code}
chown -R www-data:www-data /var/www/peintres/${slug}`;
}

// ─── ÉTAPE 4 — Créer le fichier de configuration Nginx ───────────────────────
function generateStep4_cmd(dept) {
  return `nano /etc/nginx/sites-available/peintre-en-batiment-${dept.code}`;
}

function generateStep4_config(dept) {
  const slug = slugify(dept.nom);
  return `# DOMAINE PRINCIPAL
server {
    listen 80;
    server_name peintre-en-batiment-${dept.code}.com www.peintre-en-batiment-${dept.code}.com;

    root /var/www/peintre-en-batiment-${dept.code};
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# SOUS-DOMAINES DYNAMIQUES
server {
    listen 80;
    server_name ~^(?<subdomain>(?!www$)[^.]+)\\.peintre-en-batiment-${dept.code}\\.com$;

    root /var/www/peintres/${slug}/$subdomain;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}`;
}

// ─── ÉTAPE 5 — Activer le site ────────────────────────────────────────────────
function generateStep5(dept) {
  return `ln -s /etc/nginx/sites-available/peintre-en-batiment-${dept.code} /etc/nginx/sites-enabled/`;
}

// ─── ÉTAPE 6 — Tester et recharger Nginx ─────────────────────────────────────
function generateStep6(dept) {
  return `nginx -t && systemctl reload nginx`;
}

// ─── ÉTAPE 7 — Vérifications finales ─────────────────────────────────────────
function generateStep7(dept) {
  return `# Aucune redirection HTTPS parasite (doit retourner 0)
nginx -T 2>/dev/null | grep -c "return 301"

# Domaine principal répond bien (→ HTTP/1.1 200 OK)
curl -I http://peintre-en-batiment-${dept.code}.com

# Un sous-domaine répond bien (le dossier /test doit exister)
curl -I http://test.peintre-en-batiment-${dept.code}.com`;
}
