/* dilatacao-padrao.js — interface do separador "Cálculo padrão" de HELIROMA-CALC.html.
   Pede o vão livre, o tubo, o diâmetro, o sistema e a análise; decide (com dilatacao-engine.js)
   entre sem compensação, braço ou lira, e desenha o esquema com as cotas calculadas.
   Não calcula nada por si: toda a lógica está em dilatacao-engine.js.

   Uso (HELIROMA-CALC.html, depois de dilatacao-engine.js):
       HELIROMA_PADRAO.init({ tubos, dilatacao, suportes, deltaT, sistemas, analises });
   O markup do separador (#tab-padrao) está em HELIROMA-CALC.html; estilos em dilatacao-padrao.css. */
(function (root) {
'use strict';

const { CFG, fmt, paramsTubo, decidir } = root.HELIROMA_ENGINE;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let DADOS = null;

function preencher(sel, itens, valor) {
    sel.innerHTML = itens.map(i => `<option value="${esc(i.value)}">${esc(i.label)}</option>`).join('');
    if (valor !== undefined && itens.some(i => String(i.value) === String(valor))) sel.value = valor;
}
function preencherDiametros() {
    const selD = $('pd-d'), atual = selD.value;
    const lista = DADOS.tubos[$('pd-tipo').value] || [];
    preencher(selD, lista.map(d => ({ value: d, label: 'Ø ' + d })), lista.map(String).includes(atual) ? atual : (lista.includes(63) ? 63 : lista[0]));
}
function ajudaTubo() {
    const p = paramsTubo(DADOS, $('pd-tipo').value, $('pd-d').value, $('pd-sistema').value, $('pd-analise').value);
    $('pd-tipo-help').textContent = p ? `α = ${fmt(p.alpha, 3)} mm/m·K · C = ${fmt(p.C, 0)}` : 'α e C definidos pelo tipo de tubo';
    $('pd-dt-help').textContent = p ? `ΔT = ${p.dT} K, definido pelo sistema e pela análise.` : 'ΔT definido pelo sistema e pela análise';
}

/* ------------------------------ Esquemas ------------------------------ */
const T2 = 'var(--dp-text-2)', T3 = 'var(--dp-text-3)';
function defs(id) {
    return `<defs>
      <marker id="${id}m" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" fill="${T2}"/></marker>
      <pattern id="${id}h" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="${T3}" stroke-width="2"/></pattern>
      <g id="${id}pf"><line x1="0" y1="92" x2="0" y2="117" stroke="${T3}" stroke-width="2"/><rect x="-10" y="117" width="20" height="26" fill="var(--dp-pf)" stroke="${T2}" stroke-width="1"/></g>
      <g id="${id}pm"><line x1="0" y1="92" x2="0" y2="117" stroke="${T3}" stroke-width="2"/><circle cx="0" cy="130" r="13" fill="none" stroke="${T2}" stroke-width="2"/></g>
    </defs>`;
}
const rot = (x, y, t, anchor) => `<text x="${x}" y="${y}" text-anchor="${anchor || 'middle'}" fill="${T2}" font-size="13" font-weight="600">${t}</text>`;
const cota = (x, y, t, anchor) => `<text x="${x}" y="${y}" text-anchor="${anchor || 'middle'}" fill="var(--dp-text)" font-size="14" font-family="JetBrains Mono, monospace">${t}</text>`;
const seta = (id, x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${T2}" stroke-width="1.2" marker-start="url(#${id}m)" marker-end="url(#${id}m)"/>`;
const chamada = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${T3}" stroke-width="1" stroke-dasharray="3 3"/>`;
function legenda(x, y, extra, soPF) {
    return `<rect x="${x}" y="${y - 11}" width="14" height="14" fill="var(--dp-pf)" stroke="${T2}" stroke-width="1"/>
      <text x="${x + 24}" y="${y + 1}" fill="${T3}" font-size="12" font-weight="600">PF: ponto fixo</text>
      ${soPF ? '' : `<circle cx="${x + 157}" cy="${y - 4}" r="7" fill="none" stroke="${T2}" stroke-width="2"/>
      <text x="${x + 174}" y="${y + 1}" fill="${T3}" font-size="12" font-weight="600">PM: ponto móvel</text>`}
      ${extra ? `<text x="${x + 320}" y="${y + 1}" fill="${T3}" font-size="12" font-weight="600">${extra}</text>` : ''}`;
}

function svgReto(r) {
    const id = 'r', s = r.sup && r.sup.cm ? `s = ${r.sup.cm} cm` : 's';
    const sub = n => `<tspan dy="3" font-size="11">${n}</tspan>`;
    return `<svg class="dp-svg" viewBox="0 0 680 300" role="img" aria-label="Vão sem compensação com pontos fixos ao intervalo de suporte">${defs(id)}
      <rect x="60" y="84" width="560" height="8" fill="url(#${id}h)"/>
      <path d="M52,130 H628" fill="none" stroke="var(--dp-pipe)" stroke-width="14"/>
      <use href="#${id}pf" x="90"/><use href="#${id}pf" x="190"/><use href="#${id}pf" x="290"/><use href="#${id}pf" x="490"/><use href="#${id}pf" x="590"/>
      ${rot(90, 76, 'PF')}${rot(190, 76, 'PF' + sub(1))}${rot(290, 76, 'PF' + sub(2))}${rot(390, 76, '…')}${rot(490, 76, 'PF' + sub('N'))}${rot(590, 76, 'PF')}
      ${chamada(190, 148, 190, 186)}${chamada(290, 148, 290, 186)}${chamada(90, 148, 90, 236)}${chamada(590, 148, 590, 236)}
      ${seta(id, 192, 180, 288, 180)}${cota(240, 172, s)}
      ${seta(id, 92, 230, 588, 230)}${cota(340, 222, 'L = ' + fmt(r.L, 2) + ' m')}
      ${legenda(30, 280, '', true)}</svg>`;
}
function svgBraco(r) {
    const id = 'b';
    return `<svg class="dp-svg" viewBox="0 0 740 470" role="img" aria-label="Braço de dilatação em L com as cotas calculadas">${defs(id)}
      <rect x="60" y="84" width="360" height="8" fill="url(#${id}h)"/>
      <path d="M10,130 H52" fill="none" stroke="var(--dp-pipe)" stroke-opacity="0.45" stroke-width="14" stroke-dasharray="8 6"/>
      <path d="M470,332 V362" fill="none" stroke="var(--dp-pipe)" stroke-opacity="0.45" stroke-width="14" stroke-dasharray="8 6"/>
      <path d="M52,130 H470 V332" fill="none" stroke="var(--dp-pipe)" stroke-width="14"/>
      <use href="#${id}pf" x="90"/><use href="#${id}pm" x="170"/><use href="#${id}pm" x="250"/><use href="#${id}pm" x="400"/>
      ${rot(90, 76, 'PF')}${rot(170, 76, 'PM<tspan dy="3" font-size="11">1</tspan>')}${rot(250, 76, 'PM<tspan dy="3" font-size="11">2</tspan>')}${rot(325, 76, '…')}${rot(400, 76, 'PM<tspan dy="3" font-size="11">N</tspan>')}
      <rect x="457" y="291" width="26" height="18" fill="var(--dp-pf)" stroke="${T2}" stroke-width="1"/>
      <line x1="457" y1="300" x2="410" y2="300" stroke="${T3}" stroke-width="2"/><rect x="402" y="285" width="8" height="30" fill="url(#${id}h)"/>
      ${rot(392, 305, 'PF', 'end')}
      ${chamada(486, 130, 600, 130)}${chamada(486, 300, 600, 300)}${chamada(90, 148, 90, 401)}${chamada(470, 362, 470, 401)}
      ${seta(id, 575, 132, 575, 298)}${cota(590, 220, 'Ls = ' + r.sol.LsCom + ' mm', 'start')}
      ${seta(id, 92, 395, 468, 395)}${cota(280, 386, 'L = ' + fmt(r.L, 2) + ' m')}
      ${legenda(30, 446)}</svg>`;
}
function svgLira(r) {
    const id = 'l', s = r.sol, lado = fmt(s.Lh, 2) + ' m';
    return `<svg class="dp-svg" viewBox="0 0 770 470" role="img" aria-label="Lira de dilatação com as cotas calculadas">${defs(id)}
      <rect x="40" y="84" width="160" height="8" fill="url(#${id}h)"/><rect x="400" y="84" width="160" height="8" fill="url(#${id}h)"/>
      <path d="M8,130 H32" fill="none" stroke="var(--dp-pipe)" stroke-opacity="0.45" stroke-width="14" stroke-dasharray="8 6"/>
      <path d="M568,130 H592" fill="none" stroke="var(--dp-pipe)" stroke-opacity="0.45" stroke-width="14" stroke-dasharray="8 6"/>
      <path d="M32,130 H230 V330 H370 V130 H568" fill="none" stroke="var(--dp-pipe)" stroke-width="14"/>
      <use href="#${id}pf" x="50"/><use href="#${id}pm" x="100"/><use href="#${id}pm" x="190"/><use href="#${id}pm" x="410"/><use href="#${id}pm" x="500"/><use href="#${id}pf" x="550"/>
      <rect x="287" y="319" width="26" height="22" fill="var(--dp-pf)" stroke="${T2}" stroke-width="1"/><line x1="300" y1="341" x2="300" y2="362" stroke="${T3}" stroke-width="2"/><rect x="285" y="362" width="30" height="8" fill="url(#${id}h)"/>
      ${rot(50, 76, 'PF')}${rot(100, 76, 'PM<tspan dy="3" font-size="11">1</tspan>')}${rot(145, 76, '…')}${rot(190, 76, 'PM<tspan dy="3" font-size="11">N</tspan>')}
      ${rot(410, 76, 'PM<tspan dy="3" font-size="11">N</tspan>')}${rot(455, 76, '…')}${rot(500, 76, 'PM<tspan dy="3" font-size="11">1</tspan>')}${rot(550, 76, 'PF')}${rot(322, 358, 'PF', 'start')}
      ${chamada(230, 66, 230, 122)}${chamada(370, 66, 370, 122)}${chamada(50, 148, 50, 416)}${chamada(300, 374, 300, 416)}${chamada(550, 148, 550, 416)}${chamada(598, 130, 650, 130)}${chamada(386, 330, 650, 330)}
      ${seta(id, 232, 70, 368, 70)}${cota(300, 58, 'Lc = ' + s.LcCom + ' mm')}
      ${seta(id, 52, 410, 298, 410)}${cota(175, 402, lado)}${seta(id, 302, 410, 548, 410)}${cota(425, 402, lado)}
      ${seta(id, 632, 132, 632, 328)}${cota(644, 235, 'Ls = ' + s.LsCom + ' mm', 'start')}
      ${legenda(30, 453, s.k > 1 ? s.k + ' liras iguais ao longo do vão' : '')}</svg>`;
}

/* --------------------------- Cálculo padrão --------------------------- */
const ESTADO = { escolhida: 'Escolhida', valida: 'Válida', 'nao-cabe': 'Não cabe', na: 'Não se aplica' };
const tile = (k, v, s, main) => `<div class="dp-tile${main ? ' main' : ''}"><span class="k">${k}</span><span class="v">${v}</span>${s ? `<span class="s">${s}</span>` : ''}</div>`;
const FS_BTN = '<button type="button" class="dp-fsbtn" aria-label="Ver esquema em ecrã inteiro" title="Ecrã inteiro"><svg class="ico-in" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4"/></svg><svg class="ico-out" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 3v4H3M13 3v4h4M7 17v-4H3M13 17v-4h4"/></svg></button>';
const secao = (titulo, corpo) => `<section class="card p-6"><h2 class="dp-title">${titulo}</h2>${corpo}</section>`;

function ler() {
    return {
        typeName: $('pd-tipo').value, d: $('pd-d').value, system: $('pd-sistema').value, analysis: $('pd-analise').value,
        L: parseFloat($('pd-L').value), esquema: $('pd-esq-reto').checked ? 'reto' : 'L',
        Lu: parseFloat($('pd-Lu').value), prof: parseFloat($('pd-prof').value)
    };
}

function render() {
    ajudaTubo();
    const inp = ler();
    const precisa = inp.L >= CFG.LIMITE_VAO_M;
    $('pd-compensacao').hidden = !precisa;
    $('pd-Lu-field').hidden = inp.esquema !== 'L';
    $('pd-L-help').textContent = !(inp.L > 0) ? 'Distância entre pontos fixos, sem mudança de direção' : precisa
        ? `${CFG.LIMITE_VAO_M} m ou mais: é preciso braço ou lira. Indique abaixo como termina o vão.`
        : `Menos de ${CFG.LIMITE_VAO_M} m: não é preciso braço nem lira.`;

    const r = decidir(DADOS, inp);
    const out = $('pd-resultado');
    if (!r.ok) { out.innerHTML = `<section class="card p-6"><div class="dp-err">${r.erros.map(esc).join('<br>')}</div></section>`; return; }

    const s = r.sol, sup = r.sup && r.sup.cm ? r.sup : null;
    let cls = '', pill, titulo, texto, tiles = '', svg, cap;
    const tSup = sup ? tile('Intervalo de suporte', sup.cm + ' cm', `${esc(sup.tabela)} · coluna ΔT ${sup.coluna}`) : tile('Intervalo de suporte', '-', 'Sem dados na tabela');
    const tApoios = r.apoios ? (s.tipo === 'nenhuma'
        ? tile('Pontos fixos', `${r.apoios.pf} PF`, `2 nas extremidades + ${r.apoios.pfInter} intermédios`)
        : tile('Apoios', `${r.apoios.pf} PF + ${r.apoios.pm} PM`, 'Número mínimo de pontos móveis')) : '';

    if (s.tipo === 'nenhuma') {
        cls = 'ok'; pill = 'Sem compensação';
        titulo = 'Não é necessário braço nem lira de dilatação';
        texto = `O vão de ${fmt(r.L, 2)} m fica abaixo dos ${CFG.LIMITE_VAO_M} m. Basta respeitar o intervalo de suporte.`;
        tiles = tile('Dilatação do vão, ΔL', fmt(r.total.dL, 1) + ' mm', `ΔT = ${r.p.dT} K`) + tSup.replace('class="dp-tile"', 'class="dp-tile main"') + tApoios;
        svg = svgReto(r); cap = 'Vão sem compensação: pontos fixos espaçados ao intervalo de suporte.';
    } else if (s.tipo === 'braco') {
        pill = 'Braço de dilatação';
        titulo = `Braço de dilatação com Ls = ${s.LsCom} mm`;
        texto = `A mudança de direção absorve os ${fmt(s.dL, 1)} mm de dilatação. Coloque o ponto fixo do braço a ${s.LsCom} mm do cotovelo, ou mais, e só apoios móveis até lá.`;
        tiles = tile('Braço, Ls', s.LsCom + ' mm', `Calculado: ${fmt(s.Ls, 1)} mm`, true) + tile('Dilatação, ΔL', fmt(s.dL, 1) + ' mm', `ΔT = ${r.p.dT} K`) + tSup + tApoios;
        svg = svgBraco(r); cap = 'Braço de dilatação com as cotas deste cálculo.';
    } else if (s.tipo === 'lira') {
        pill = s.k === 1 ? 'Lira de dilatação' : s.k + ' liras de dilatação';
        titulo = `${s.k === 1 ? '1 lira' : s.k + ' liras'} com Ls = ${s.LsCom} mm e Lc = ${s.LcCom} mm`;
        texto = (r.esquema === 'L' ? 'O braço disponível não chega, por isso a dilatação é absorvida no vão. Coloque um ponto fixo junto ao cotovelo. ' : '')
              + `${s.k === 1 ? 'A lira fica a meio do vão, com um ponto fixo na base' : 'As liras ficam igualmente espaçadas, com um ponto fixo na base de cada uma'}. Cada lado tem ${fmt(s.Lh, 2)} m.`;
        tiles = tile('Profundidade, Ls', s.LsCom + ' mm', `Calculado: ${fmt(s.Ls, 1)} mm`, true) + tile('Largura, Lc', s.LcCom + ' mm', `2 × ΔL + ${CFG.MS_MM}`, true)
              + tile('Dilatação por lado, ΔL', fmt(s.dL, 1) + ' mm', `Troço de ${fmt(s.Lh, 2)} m`) + tSup + tApoios;
        svg = svgLira(r); cap = 'Lira de dilatação com as cotas deste cálculo.';
    } else {
        cls = 'bad'; pill = 'Sem solução';
        titulo = 'Nenhuma solução cabe no espaço indicado';
        texto = `Nem com ${CFG.MAX_LIRAS} liras a profundidade necessária cabe. Aumente o espaço disponível, reduza o vão entre pontos fixos ou mude o tipo de tubo.`;
        tiles = tile('Dilatação do vão, ΔL', fmt(r.total.dL, 1) + ' mm', `ΔT = ${r.p.dT} K`) + tSup;
    }

    const notas = [];
    if (r.fibra) {
        const f = r.fibra;
        const dim = f.tipo === 'braco' ? `um braço de ${f.LsCom} mm` : `uma só lira com Ls = ${f.LsCom} mm e Lc = ${f.LcCom} mm`;
        notas.push(`<div class="dp-note tip"><b>Alternativa de material.</b> Com tubo com fibra de vidro (α = ${fmt(CFG.ALPHA_FIBRA, 3)}), o mesmo vão pede ${dim}${f.valida ? ', que cabe no espaço indicado.' : ', que ainda não cabe no espaço indicado.'}</div>`);
    }
    r.avisos.forEach(a => notas.push(`<div class="dp-note ${a.nivel === 'info' ? 'info' : ''}">${esc(a.txt)}</div>`));

    const linhas = r.candidatas.map(c => `<tr class="${c.estado === 'escolhida' ? 'chosen' : ''}">
        <td>${esc(c.nome)}<span class="why">${esc(c.motivo)}</span></td>
        <td class="num">${c.troco ? fmt(c.troco, 2) + ' m' : '-'}</td>
        <td class="num">${c.dL !== null ? fmt(c.dL, 1) + ' mm' : '-'}</td>
        <td class="num">${c.LsCom !== null ? c.LsCom + ' mm' : '-'}</td>
        <td class="num">${c.LcCom !== null ? c.LcCom + ' mm' : '-'}</td>
        <td><span class="dp-st ${c.estado}">${ESTADO[c.estado]}</span></td></tr>`).join('');

    out.innerHTML = `
      <div class="dp-verdict ${cls}"><span class="dp-pill">${pill}</span><h3>${titulo}</h3><p>${texto}</p></div>
      <div class="dp-tiles">${tiles}</div>
      ${notas.length ? `<div class="dp-notes">${notas.join('')}</div>` : ''}
      ${svg ? `<div class="dp-diagram">${FS_BTN}${svg}<p>${cap}</p><p class="dp-fsrot">Rode o telemóvel para ver o esquema na horizontal.</p></div>` : ''}
      ${secao('Como o programa decidiu', `<ol class="dp-steps">${r.passos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>`)}
      ${r.candidatas.length ? secao('Soluções comparadas', `<div class="dp-tablewrap"><table class="dp-table">
          <thead><tr><th>Solução</th><th>Troço que dilata</th><th>ΔL</th><th>Ls</th><th>Lc</th><th>Estado</th></tr></thead><tbody>${linhas}</tbody></table></div>`) : ''}`;
}

/* ----------------------- Esquema em ecrã inteiro ----------------------- */
function fsFechar() {
    const d = document.querySelector('#tab-padrao .dp-diagram.dp-fs');
    if (!d) return;
    d.classList.remove('dp-fs'); document.body.classList.remove('dp-fs-open');
    const b = d.querySelector('.dp-fsbtn'); if (b) { b.setAttribute('aria-label', 'Ver esquema em ecrã inteiro'); b.title = 'Ecrã inteiro'; b.focus({ preventScroll: true }); }
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (_) { /* sem suporte neste browser: segue sem */ }
    if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (_) { /* sem suporte neste browser: segue sem */ } }
}
function fsAbrir(d) {
    d.classList.add('dp-fs'); document.body.classList.add('dp-fs-open');   // sobreposição: funciona em todos os browsers, incl. iOS
    const b = d.querySelector('.dp-fsbtn'); b.setAttribute('aria-label', 'Sair do ecrã inteiro'); b.title = 'Sair do ecrã inteiro';
    try {   // ecrã inteiro nativo e bloqueio horizontal, onde o browser permitir
        const p = d.requestFullscreen && d.requestFullscreen();
        if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (_) { /* sem suporte neste browser: segue sem */ } }).catch(() => {});
    } catch (_) { /* sem suporte neste browser: segue sem */ }
}

/* ------------------------------ Arranque ------------------------------ */
const PRESETS = [
    { label: '8 m, abaixo do limite', L: 8, esquema: 'L', Lu: '', prof: '' },
    { label: '20 m em L', L: 20, esquema: 'L', Lu: '', prof: '' },
    { label: '20 m em L, braço de 1,5 m', L: 20, esquema: 'L', Lu: 1.5, prof: '' },
    { label: '30 m reto', L: 30, esquema: 'reto', Lu: '', prof: '' },
    { label: '30 m reto, 1 m de profundidade', L: 30, esquema: 'reto', Lu: '', prof: 1 },
    { label: '60 m reto, 0,3 m de profundidade', L: 60, esquema: 'reto', Lu: '', prof: 0.3 }
];
function aplicarPreset(p) {
    $('pd-L').value = p.L; $('pd-Lu').value = p.Lu; $('pd-prof').value = p.prof;
    $('pd-esq-L').checked = p.esquema === 'L'; $('pd-esq-reto').checked = p.esquema === 'reto';
    render();
}

function init(dados) {
    DADOS = dados;
    const tipos = Object.keys(dados.tubos).filter(t => dados.dilatacao[t]);
    if (!tipos.length) {
        $('pd-resultado').innerHTML = '<section class="card p-6"><div class="dp-err">Não foi possível carregar os dados dos tubos (heliroma-data.js / dilatacao-data.js).</div></section>';
        return;
    }
    preencher($('pd-tipo'), tipos.map(t => ({ value: t, label: t })), tipos[0]);
    preencherDiametros();
    preencher($('pd-sistema'), dados.sistemas.map(s => ({ value: s.id, label: s.label })), 'quente');
    preencher($('pd-analise'), dados.analises.map(s => ({ value: s.id, label: s.label })), 'normal');

    $('pd-presets').innerHTML = PRESETS.map((p, i) => `<button type="button" data-i="${i}">${esc(p.label)}</button>`).join('');
    $('pd-presets').addEventListener('click', ev => { const b = ev.target.closest('button[data-i]'); if (b) aplicarPreset(PRESETS[+b.dataset.i]); });

    $('pd-tipo').addEventListener('change', () => { preencherDiametros(); render(); });
    ['pd-d', 'pd-sistema', 'pd-analise', 'pd-esq-L', 'pd-esq-reto'].forEach(id => $(id).addEventListener('change', render));
    ['pd-L', 'pd-Lu', 'pd-prof'].forEach(id => $(id).addEventListener('input', render));
    $('form-padrao').addEventListener('submit', ev => ev.preventDefault());

    // ecrã inteiro do esquema (delegação: o esquema é redesenhado a cada cálculo)
    $('tab-padrao').addEventListener('click', ev => {
        const b = ev.target.closest('.dp-fsbtn'); if (!b) return;
        const d = b.closest('.dp-diagram');
        d.classList.contains('dp-fs') ? fsFechar() : fsAbrir(d);
    });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') fsFechar(); });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) fsFechar(); });

    render();
}

root.HELIROMA_PADRAO = { init };
})(window);
