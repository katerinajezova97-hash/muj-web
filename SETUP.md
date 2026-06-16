# Goldea Content Hub – Setup & Deployment

## Struktura projektu

```
goldea-content-hub/
├── netlify/
│   └── functions/
│       └── claude-proxy.js   ← serverová proxy pro Anthropic API
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   └── index.js
├── netlify.toml              ← říká Netlify kde jsou funkce a build
├── package.json
└── .env                      ← LOKÁLNÍ API klíč (NENAHRÁVAT na GitHub!)
```

---

## Proč proxy?

Prohlížeč blokuje přímá volání na `api.anthropic.com` kvůli CORS.
Netlify Function běží na serveru – tam CORS neplatí.
API klíč je bezpečně jen v Netlify Environment Variables, nikdy v kódu.

```
Prohlížeč → /.netlify/functions/claude-proxy → api.anthropic.com
```

---

## 1. Lokální vývoj

### Požadavky
- Node.js 18+
- Netlify CLI (nainstaluje se přes npm)

```bash
# 1. Nainstaluj závislosti (včetně netlify-cli)
npm install

# 2. Vytvoř soubor .env v kořenu projektu
#    (tento soubor NENAHRÁVEJ na GitHub – je v .gitignore)
echo "ANTHROPIC_API_KEY=sk-ant-api03-tvůj-klíč-zde" > .env

# 3. Spusť vývojový server s Netlify Functions
npm run dev
# → otevře se na http://localhost:8888
# → proxy poběží automaticky na stejném portu
```

> Příkaz `netlify dev` spustí React app i Netlify Functions zároveň na jednom portu.
> Volání `/.netlify/functions/claude-proxy` tak funguje i lokálně bez jakéhokoli CORS problému.

---

## 2. Nahrání na GitHub

```bash
# 1. Vytvoř .gitignore (pokud ještě neexistuje)
cat > .gitignore << 'EOF'
node_modules/
.env
build/
.DS_Store
*.env.local
EOF

# 2. Inicializuj git a nahraj
git init
git add .
git commit -m "feat: Goldea Content Hub MVP"

# 3. Na github.com vytvoř nový prázdný repozitář "goldea-content-hub"
#    Pak propoj a nahraj:
git remote add origin https://github.com/TVŮJ-USERNAME/goldea-content-hub.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy na Netlify

### Krok 1 – Propoj GitHub repozitář

1. Přihlás se na [app.netlify.com](https://app.netlify.com)
2. Klikni **Add new site → Import an existing project**
3. Vyber **GitHub** a autorizuj přístup
4. Vyber repozitář `goldea-content-hub`

### Krok 2 – Build nastavení (Netlify je detekuje automaticky z netlify.toml)

Zkontroluj že jsou správně nastaveny:
- **Build command:** `npm run build`
- **Publish directory:** `build`
- **Functions directory:** `netlify/functions`

### Krok 3 – Přidej API klíč (KRITICKÉ)

Bez tohoto kroku generování nebude fungovat.

1. V Netlify projektu jdi do **Site configuration → Environment variables**
2. Klikni **Add a variable**
3. Zadej:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-tvůj-klíč` (celý klíč z console.anthropic.com)
4. Klikni **Save**

### Krok 4 – Spusť deploy

1. Jdi do záložky **Deploys**
2. Klikni **Trigger deploy → Deploy site**
3. Počkej na zelený stav (cca 1–2 minuty)
4. Netlify ti dá URL ve tvaru `goldea-content-hub-xxx.netlify.app`

### Vlastní doména (volitelné)

1. **Domain management → Add custom domain**
2. Zadej svou doménu (např. `hub.goldea.cz`)
3. Nastav CNAME záznam u svého DNS providera podle pokynů Netlify

---

## 4. Získání Anthropic API klíče

1. Jdi na [console.anthropic.com](https://console.anthropic.com)
2. Přihlás se nebo vytvoř účet
3. **Settings → API Keys → Create Key**
4. Klíč zkopíruj ihned – zobrazí se jen jednou
5. Vlož do Netlify Environment Variables (viz Krok 3 výše)

---

## 5. Ověření že vše funguje

Po deployi otestuj:

```
https://tvoje-appka.netlify.app/.netlify/functions/claude-proxy
```

Měl bys dostat odpověď `405 Method Not Allowed` (to je správně – funkce čeká POST).

Pokud vidíš `500 ANTHROPIC_API_KEY není nastaven` → vrať se ke Kroku 3.

---

## Časté problémy

| Problém | Příčina | Řešení |
|---------|---------|--------|
| `Load failed` | Voláš API přímo z prohlížeče | Vždy používej `/.netlify/functions/claude-proxy` |
| `500 ANTHROPIC_API_KEY není nastaven` | Chybí env variable | Přidej v Netlify → Site config → Env variables |
| `Function not found` | Špatná cesta k funkci | Zkontroluj `functions = "netlify/functions"` v netlify.toml |
| Lokálně nefunguje proxy | Spouštíš `npm start` místo `npm run dev` | Používej `netlify dev` pro lokální vývoj |

