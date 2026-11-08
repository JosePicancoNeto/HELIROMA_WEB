# vendor/ — dependências alojadas no próprio site

Antes eram carregadas de CDNs externas (cdn.tailwindcss.com, cdnjs, jsdelivr, Google Fonts).
Agora o site só pede ficheiros a si próprio: sem risco de uma CDN alterada injetar código,
sem envio do IP dos visitantes à Google (RGPD) e com uma Content-Security-Policy restrita
(`<meta http-equiv="Content-Security-Policy">` em cada página).

| Pasta / ficheiro | Origem | Versão |
|---|---|---|
| `three/three.module.min.js`, `three/addons/…` | npm `three` | 0.152.2 |
| `ifc/IFCLoader.bundle.js` | npm `web-ifc-three` + `web-ifc` (esbuild, ESM, minificado; `three` externo) | 0.0.126 + 0.0.74 |
| `ifc/web-ifc.wasm` | npm `web-ifc` | 0.0.74 |
| `katex/` | npm `katex` (só fontes woff2) | 0.16.9 |
| `fontawesome/` | npm `@fortawesome/fontawesome-free` (só woff2) | 6.4.0 |
| `fonts/` | npm `@fontsource/ibm-plex-sans`, `ibm-plex-mono`, `jetbrains-mono` (latin + latin-ext) | — |
| `tailwind.min.css` | Tailwind CLI a partir das classes usadas nas páginas | 3.4 |

## Recompilar o Tailwind (quando mudar classes em CALC / RESISTÊNCIA / TEORIA)
```bash
npx tailwindcss@3.4 -c vendor/tailwind.config.js -i vendor/tailwind.input.css -o vendor/tailwind.min.css --minify
```
(na raiz do repositório). Sem isto, classes Tailwind novas não têm efeito.

## Recriar o bundle do IFCLoader
```bash
npm i three@0.152.2 web-ifc-three@0.0.126 web-ifc@0.0.74 esbuild --legacy-peer-deps
echo "export * from './node_modules/web-ifc-three/IFCLoader.js';" > entry.js
npx esbuild entry.js --bundle --format=esm --minify --outfile=vendor/ifc/IFCLoader.bundle.js \
  --external:three --external:'three/examples/jsm/*' --alias:web-ifc=./node_modules/web-ifc/web-ifc-api.js
```

## Limitação conhecida
O visualizador 3D usa módulos JavaScript; os browsers bloqueiam módulos abertos por
duplo clique (`file://`). Para testar localmente: `python -m http.server` na pasta e abrir
`http://localhost:8000`. As restantes páginas funcionam também por duplo clique.
