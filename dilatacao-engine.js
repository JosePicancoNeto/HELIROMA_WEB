(function (root) {
'use strict';

/* dilatacao-engine.js — motor de decisão do "Cálculo padrão" e cálculo do "Cálculo avançado".
   Funções puras: recebem os dados e as entradas, devolvem a solução. Não tocam no DOM
   (testável em Node: ver tests/dilatacao-engine.test.js).

   Entrada "dados" (montada por HELIROMA-CALC.html a partir das fontes únicas do repositório):
     tubos     : { tipo: [DN, ...] }                    ← heliroma-data.js
     dilatacao : { tipo: { c, alpha, suporte } }        ← dilatacao-data.js
     suportes  : SUPPORT_INTERVALS_DATA                 ← suportes-data.js
     deltaT    : { analise: { sistema: K } }            ← DELTA_T_TABLE da página
     sistemas, analises : [{ id, label }]               ← opções da página */

const CFG = {
    LIMITE_VAO_M: 12,     // critério Heliroma: a partir de 12 m é preciso braço ou lira
    MS_MM: 200,           // margem de segurança da largura da lira (valor atual do programa)
    MAX_LIRAS: 6,         // limite de liras que o motor experimenta num vão
    ALPHA_FIBRA: 0.035    // α dos tubos com fibra de vidro (para a sugestão de material)
};

function arred10(v) { return Math.ceil((v - 1e-9) / 10) * 10; }
function fmt(v, dec) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    return Number(v).toFixed(dec === undefined ? 2 : dec).replace('.', ',');
}
function rotulo(lista, id) { const o = (lista || []).find(x => x.id === id); return o ? o.label : id; }

/** α, C, d e ΔT a partir das seleções. Devolve null se faltar alguma. */
function paramsTubo(dados, typeName, d, system, analysis) {
    const dil = dados.dilatacao[typeName];
    const dT = dados.deltaT && dados.deltaT[analysis] ? dados.deltaT[analysis][system] : undefined;
    d = parseFloat(d);
    if (!dil || !(d > 0) || !(dT > 0)) return null;
    return { typeName, d, alpha: parseFloat(dil.alpha), C: parseFloat(dil.c), dT, system, analysis };
}

/** ΔL e Ls para um troço de comprimento Lm (m) que dilata para um só lado. */
function calcTroco(p, Lm) {
    const dL = p.alpha * Lm * p.dT;
    const Ls = p.C * Math.sqrt(p.d * dL);
    return { L: Lm, dL, Ls, LsCom: arred10(Ls) };
}

/** k liras iguais num vão Lm: cada perna recebe a dilatação de Lm / (2k). */
function calcLira(p, Lm, k) {
    const t = calcTroco(p, Lm / (2 * k));
    const Lc = 2 * t.dL + CFG.MS_MM;
    return { k, Lh: t.L, dL: t.dL, Ls: t.Ls, LsCom: t.LsCom, Lc, LcCom: arred10(Lc) };
}

/** Intervalo de suporte (cm) da tabela do catálogo para o tubo, diâmetro e ΔT. */
function suporte(dados, typeName, d, dT) {
    const id = dados.dilatacao[typeName] && dados.dilatacao[typeName].suporte;
    const tipo = dados.suportes.tipos.find(t => t.id === id);
    if (!tipo) return null;
    const linha = tipo.diametros.find(r => r.d === d);
    if (!linha) return { tabela: tipo.nome, semDiametro: true };
    const cols = dados.suportes.temperaturas;
    let i = cols.findIndex(t => t >= dT);
    const foraTabela = i === -1;
    if (foraTabela) i = cols.length - 1;
    const cm = linha.v[i];
    // valor muito abaixo do resto da linha (ex.: gralha de catálogo)
    const ordenados = linha.v.slice().sort((a, b) => a - b);
    const suspeito = cm < 0.5 * ordenados[Math.floor(ordenados.length / 2)];
    return { tabela: tipo.nome, pagina: tipo.pagina, coluna: cols[i], cm, foraTabela, suspeito };
}

/** Nº mínimo de pontos móveis num troço entre dois apoios extremos. */
function nPM(Lm, cm) { return Math.max(0, Math.ceil(Lm * 100 / cm - 1e-9) - 1); }

function cabe(disponivelMm, necessarioMm) { return disponivelMm === null || disponivelMm >= necessarioMm; }

/**
 * Decide a solução para um vão.
 * inp: { typeName, d, system, analysis, L (m), esquema: 'reto' | 'L', Lu (m, opcional), prof (m, opcional) }
 */
function decidir(dados, inp) {
    const erros = [];
    const L = parseFloat(inp.L);
    const p = paramsTubo(dados, inp.typeName, inp.d, inp.system, inp.analysis);
    if (!(L > 0)) erros.push('Indique o comprimento do vão livre, em metros.');
    if (!p) erros.push('Selecione o tipo de tubo, o diâmetro, o sistema e a análise.');
    if (erros.length) return { ok: false, erros };

    const passos = [], avisos = [], candidatas = [];
    const total = calcTroco(p, L);
    const necessita = L >= CFG.LIMITE_VAO_M;
    const LuMm = inp.Lu > 0 ? inp.Lu * 1000 : null;
    const profMm = inp.prof > 0 ? inp.prof * 1000 : null;

    passos.push(`ΔT = ${p.dT} K (sistema ${rotulo(dados.sistemas, p.system).toLowerCase()}, análise ${rotulo(dados.analises, p.analysis).toLowerCase()}).`);
    passos.push(`ΔL = α × L × ΔT = ${fmt(p.alpha, 3)} × ${fmt(L, 2)} × ${p.dT} = ${fmt(total.dL, 1)} mm.`);

    let sol, LmaxBraco = null;

    if (!necessita) {
        sol = { tipo: 'nenhuma' };
        passos.push(`L = ${fmt(L, 2)} m é inferior a ${CFG.LIMITE_VAO_M} m: não é necessário braço nem lira de dilatação.`);
        passos.push('Segue-se apenas a tabela de intervalos de suporte: no vão sem compensação todos os apoios são pontos fixos.');
        avisos.push({ nivel: 'info', txt: `A dilatação de ${fmt(total.dL, 1)} mm do vão fica contida pelos pontos fixos, sem braço nem lira.` });
    } else {
        passos.push(`L = ${fmt(L, 2)} m é igual ou superior a ${CFG.LIMITE_VAO_M} m: é necessário compensar com braço ou lira.`);

        // --- Candidata 1: braço (só existe se houver mudança de direção)
        let bracoValido = false;
        if (inp.esquema === 'L') {
            const b = total;
            bracoValido = cabe(LuMm, b.LsCom);
            passos.push('Vão com mudança de direção no fim: a perna perpendicular pode servir de braço.');
            passos.push(`Ls = C × √(d × ΔL) = ${fmt(p.C, 0)} × √(${fmt(p.d, 0)} × ${fmt(b.dL, 1)}) = ${fmt(b.Ls, 1)} mm, arredondado a ${b.LsCom} mm.`);
            let motivo;
            if (LuMm === null) {
                motivo = `Precisa de ${b.LsCom} mm livres até ao ponto fixo.`;
                passos.push(`Sem comprimento disponível indicado: garanta pelo menos ${b.LsCom} mm livres entre o cotovelo e o ponto fixo.`);
            } else if (bracoValido) {
                motivo = `Lu = ${fmt(LuMm, 0)} mm chega para Ls = ${b.LsCom} mm.`;
                passos.push(`Lu = ${fmt(LuMm, 0)} mm ≥ ${b.LsCom} mm: o braço chega.`);
            } else {
                LmaxBraco = Math.pow(LuMm / p.C, 2) / (p.d * p.alpha * p.dT);
                motivo = `Lu = ${fmt(LuMm, 0)} mm é menor que Ls = ${b.LsCom} mm.`;
                passos.push(`Lu = ${fmt(LuMm, 0)} mm < ${b.LsCom} mm: o braço não chega. Com este Lu, o braço só absorve um vão até ${fmt(LmaxBraco, 2)} m.`);
                passos.push('Passa-se a lira no vão, com um ponto fixo junto ao cotovelo.');
            }
            candidatas.push({ id: 'braco', nome: 'Braço de dilatação', troco: L, dL: b.dL, LsCom: b.LsCom, LcCom: null,
                              estado: bracoValido ? 'valida' : 'nao-cabe', motivo });
            if (bracoValido) sol = { tipo: 'braco', L, dL: b.dL, Ls: b.Ls, LsCom: b.LsCom };
        } else {
            passos.push('Vão reto, sem mudança de direção: o braço não se aplica, a solução é a lira.');
            candidatas.push({ id: 'braco', nome: 'Braço de dilatação', troco: null, dL: null, LsCom: null, LcCom: null,
                              estado: 'na', motivo: 'O vão não tem mudança de direção.' });
        }

        // --- Candidatas 2..n: k liras iguais
        let liraEscolhida = null;
        const liras = [];
        for (let k = 1; k <= CFG.MAX_LIRAS; k++) {
            const li = calcLira(p, L, k);
            li.valida = cabe(profMm, li.LsCom);
            liras.push(li);
            if (!liraEscolhida && li.valida) liraEscolhida = li;
        }
        const mostrar = Math.min(CFG.MAX_LIRAS, Math.max(3, liraEscolhida ? liraEscolhida.k + 1 : CFG.MAX_LIRAS));
        liras.slice(0, mostrar).forEach(li => {
            candidatas.push({ id: 'lira-' + li.k, nome: li.k === 1 ? '1 lira' : li.k + ' liras', k: li.k, troco: li.Lh,
                              dL: li.dL, LsCom: li.LsCom, LcCom: li.LcCom,
                              estado: li.valida ? 'valida' : 'nao-cabe',
                              motivo: li.valida ? (profMm === null ? `Precisa de ${li.LsCom} mm de profundidade.` : `Cabe em ${fmt(profMm, 0)} mm de profundidade.`)
                                                : `Ls = ${li.LsCom} mm excede os ${fmt(profMm, 0)} mm disponíveis.` });
        });

        if (!sol) {
            if (liraEscolhida) {
                const li = liraEscolhida;
                sol = { tipo: 'lira', k: li.k, Lh: li.Lh, dL: li.dL, Ls: li.Ls, LsCom: li.LsCom, Lc: li.Lc, LcCom: li.LcCom };
                if (li.k > 1) passos.push(`Com menos de ${li.k} liras, a profundidade Ls não cabe nos ${fmt(profMm, 0)} mm disponíveis.`);
                passos.push(`${li.k === 1 ? '1 lira ao centro' : li.k + ' liras iguais'}: cada perna recebe a dilatação de ${fmt(li.Lh, 2)} m, ΔL = ${fmt(li.dL, 1)} mm.`);
                passos.push(`Ls = ${fmt(p.C, 0)} × √(${fmt(p.d, 0)} × ${fmt(li.dL, 1)}) = ${fmt(li.Ls, 1)} mm, arredondado a ${li.LsCom} mm.`);
                passos.push(`Lc = 2 × ΔL + ${CFG.MS_MM} = ${fmt(li.Lc, 1)} mm, arredondado a ${li.LcCom} mm.`);
            } else {
                sol = { tipo: 'sem-solucao' };
                passos.push(`Nem com ${CFG.MAX_LIRAS} liras a profundidade Ls cabe nos ${fmt(profMm, 0)} mm disponíveis.`);
            }
        }
    }

    // --- Marca a escolhida na lista de candidatas
    candidatas.forEach(c => {
        if ((sol.tipo === 'braco' && c.id === 'braco') || (sol.tipo === 'lira' && c.id === 'lira-' + sol.k)) c.estado = 'escolhida';
    });

    // --- Suportes e contagem de apoios
    const sup = suporte(dados, p.typeName, p.d, p.dT);
    let apoios = null;
    if (!sup) {
        avisos.push({ nivel: 'aviso', txt: 'Não há tabela de suportes associada a este tipo de tubo.' });
    } else if (sup.semDiametro) {
        avisos.push({ nivel: 'aviso', txt: `A tabela de suportes ${sup.tabela} não tem o diâmetro ${fmt(p.d, 0)} mm.` });
    } else {
        if (sup.foraTabela) avisos.push({ nivel: 'aviso', txt: `ΔT = ${p.dT} K está acima da última coluna da tabela de suportes (${sup.coluna}). Usou-se essa coluna; confirme com a Heliroma.` });
        if (sup.suspeito) avisos.push({ nivel: 'aviso', txt: `O valor ${sup.cm} cm da tabela ${sup.tabela} (Ø ${fmt(p.d, 0)}, coluna ${sup.coluna}) foge à sequência da linha. Pode ser gralha do catálogo; confirme antes de usar.` });
        if (sol.tipo === 'lira') apoios = { pf: 2 * sol.k + 1, pm: 2 * sol.k * nPM(sol.Lh, sup.cm), pmPorTroco: nPM(sol.Lh, sup.cm) };
        else if (sol.tipo === 'nenhuma') apoios = { pf: 2 + nPM(L, sup.cm), pm: 0, pfInter: nPM(L, sup.cm) };
        else if (sol.tipo !== 'sem-solucao') apoios = { pf: 2, pm: nPM(L, sup.cm), pmPorTroco: nPM(L, sup.cm) };
        passos.push(`Intervalo de suporte: ${sup.cm} cm (tabela ${sup.tabela}, Ø ${fmt(p.d, 0)} mm, coluna ΔT ${sup.coluna}).`);
    }

    // --- Sugestão de material: o mesmo vão com tubo com fibra de vidro
    let fibra = null;
    const apertado = sol.tipo === 'sem-solucao' || (sol.tipo === 'lira' && (sol.k > 1 || inp.esquema === 'L'));
    if (necessita && apertado && p.alpha > CFG.ALPHA_FIBRA + 1e-9) {
        const pf = Object.assign({}, p, { alpha: CFG.ALPHA_FIBRA });
        if (inp.esquema === 'L') {
            const b = calcTroco(pf, L);
            fibra = { tipo: 'braco', LsCom: b.LsCom, dL: b.dL, valida: cabe(LuMm, b.LsCom) };
        } else {
            const li = calcLira(pf, L, 1);
            fibra = { tipo: 'lira', LsCom: li.LsCom, LcCom: li.LcCom, dL: li.dL, valida: cabe(profMm, li.LsCom) };
        }
    }

    return { ok: true, p, L, total, necessita, esquema: inp.esquema, sol, candidatas, passos, avisos, sup, apoios, fibra, LmaxBraco };
}


const api = { CFG, arred10, fmt, paramsTubo, calcTroco, calcLira, suporte, nPM, decidir };
root.HELIROMA_ENGINE = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
