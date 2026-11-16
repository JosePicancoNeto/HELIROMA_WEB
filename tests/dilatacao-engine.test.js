/* tests/dilatacao-engine.test.js — testes do motor do "Cálculo padrão".
   Correr:  node tests/dilatacao-engine.test.js   (sai com código 1 se algum teste falhar)
   Usa os ficheiros de dados REAIS do repositório (nenhuma cópia), montados como em HELIROMA-CALC.html. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..');
const ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(ler('heliroma-data.js'), ctx);
vm.runInContext(ler('dilatacao-data.js'), ctx);
const SUP = vm.runInContext(ler('suportes-data.js') + '; SUPPORT_INTERVALS_DATA', ctx);
const E = require(path.join(raiz, 'dilatacao-engine.js'));

const tubos = {};
for (const [k, v] of Object.entries(ctx.window.HELIROMA_DATA_EXTERNAL.tubos)) tubos[k] = v.map(r => r.dn);
const DADOS = {
    tubos, dilatacao: ctx.window.HELIROMA_DILATACAO, suportes: SUP,
    deltaT: { normal: { frio: 20, retorno: 40, quente: 60 }, media: { frio: 25, retorno: 45, quente: 70 }, critica: { frio: 30, retorno: 50, quente: 80 } },
    sistemas: [{ id: 'frio', label: 'Frio' }, { id: 'retorno', label: 'Retorno' }, { id: 'quente', label: 'Quente' }],
    analises: [{ id: 'normal', label: 'Normal' }, { id: 'media', label: 'Média' }, { id: 'critica', label: 'Crítica' }]
};
let fails = 0;
function eq(nome, obtido, esperado) { const ok = obtido === esperado; if (!ok) fails++; console.log((ok ? 'OK  ' : 'FAIL') + ' ' + nome + ': ' + obtido + (ok ? '' : ' (esperado ' + esperado + ')')); }
const H6 = 'PP-R 100 PIPE SDR 6 HELISYSTEM', RF = 'PP-R 100 PIPE WITH FIBERGLASS SDR 7,4 ROMAFASER';
const base = { typeName: H6, d: 63, system: 'quente', analysis: 'normal' };
// 1. abaixo de 12 m
let r = E.decidir(DADOS, { ...base, L: 8, esquema: 'reto' });
eq('8 m tipo', r.sol.tipo, 'nenhuma'); eq('8 m dL', +r.total.dL.toFixed(1), 72); eq('8 m suporte', r.sup.cm, 120); eq('8 m PF intermédios', r.apoios.pfInter, 6); eq('8 m PF total', r.apoios.pf, 8); eq('8 m PM', r.apoios.pm, 0);
r = E.decidir(DADOS, { ...base, L: 11.99, esquema: 'L' }); eq('11,99 m', r.sol.tipo, 'nenhuma');
// 2. limiar
r = E.decidir(DADOS, { ...base, L: 12, esquema: 'L' }); eq('12 m L', r.sol.tipo, 'braco');
// 3. 20 m em L sem Lu: dL=180, Ls=20*sqrt(63*180)=2129.8 -> 2130
r = E.decidir(DADOS, { ...base, L: 20, esquema: 'L' });
eq('20 L tipo', r.sol.tipo, 'braco'); eq('20 L dL', +r.sol.dL.toFixed(1), 180); eq('20 L LsCom', r.sol.LsCom, 2130); eq('20 L PM', r.apoios.pm, 16);
// 4. Lu curto -> lira, 1 lira: Lh=10, dL=90, Ls=20*sqrt(5670)=1505.99 -> 1510; Lc=380
r = E.decidir(DADOS, { ...base, L: 20, esquema: 'L', Lu: 1.5 });
eq('20 L Lu1.5 tipo', r.sol.tipo, 'lira'); eq('k', r.sol.k, 1); eq('LsCom', r.sol.LsCom, 1510); eq('LcCom', r.sol.LcCom, 380);
eq('Lmax', +r.LmaxBraco.toFixed(2), +(Math.pow(1500/20,2)/(63*0.15*60)).toFixed(2)); eq('fibra braço', r.fibra.LsCom, 1030); eq('fibra valida', r.fibra.valida, true);
// 5. Lu exatamente igual
r = E.decidir(DADOS, { ...base, L: 20, esquema: 'L', Lu: 2.13 }); eq('Lu=Ls', r.sol.tipo, 'braco');
// 6. 30 m reto
r = E.decidir(DADOS, { ...base, L: 30, esquema: 'reto' });
eq('30 reto', r.sol.tipo, 'lira'); eq('k', r.sol.k, 1); eq('dL', +r.sol.dL.toFixed(1), 135); eq('LsCom', r.sol.LsCom, 1850); eq('LcCom', r.sol.LcCom, 470); eq('PF', r.apoios.pf, 3);
// 7. 30 m reto, 1 m prof -> k=4
r = E.decidir(DADOS, { ...base, L: 30, esquema: 'reto', prof: 1 });
eq('30 reto prof1 k', r.sol.k, 4); eq('LsCom', r.sol.LsCom, 930); eq('fibra lira', r.fibra.LsCom, 900); eq('PF', r.apoios.pf, 9);
// 8. sem solução
r = E.decidir(DADOS, { ...base, L: 60, esquema: 'reto', prof: 0.3 }); eq('sem solução', r.sol.tipo, 'sem-solucao');
// 9. fibra, exemplo do catálogo adaptado, ΔT 80 fora da tabela
r = E.decidir(DADOS, { typeName: RF, d: 110, system: 'quente', analysis: 'critica', L: 40, esquema: 'reto' });
eq('RF dL', +r.sol.dL.toFixed(1), 56); eq('RF fora tabela', r.sup.foraTabela, true); eq('RF cm', r.sup.cm, 170);
// 10. gralha do catálogo (CT+ Ø250, coluna 60 = 20 cm; vizinhos 215 e 190): deve ser sinalizada
r = E.decidir(DADOS, { typeName: 'PP-RCT 125 PIPE WITH FIBERGLASS SDR 9 ROMAFASER CT+', d: 250, system: 'quente', analysis: 'normal', L: 8, esquema: 'reto' });
eq('gralha cm', r.sup.cm, 20); eq('gralha suspeito', r.sup.suspeito, true);
// 11. diâmetro sem tabela de suportes
r = E.decidir(DADOS, { typeName: 'PP-R 100 PIPE SDR 7,4 HELISYSTEM', d: 160, system: 'frio', analysis: 'normal', L: 8, esquema: 'reto' });
eq('sem diâmetro', r.sup.semDiametro, true);
// 12. exemplo do catálogo: 4 m, Ø25, ΔT 40 -> ΔL 24 mm, Ls 490 mm
const t = E.calcTroco(E.paramsTubo(DADOS, H6, 25, 'retorno', 'normal'), 4);
eq('catálogo dL', +t.dL.toFixed(1), 24); eq('catálogo Ls', t.LsCom, 490);
// 13. Cálculo avançado com k liras = motor: L=10 m, Ø63, ΔT 60, 1 lira -> L_cálc 5 m, Ls 1064,89; 2 liras -> L_cálc 2,5 m
const p63 = E.paramsTubo(DADOS, H6, 63, 'quente', 'normal');
let l = E.calcLira(p63, 10, 1); eq('k=1 Ls', +l.Ls.toFixed(2), 1064.89); eq('k=1 LsCom', l.LsCom, 1070);
l = E.calcLira(p63, 10, 2); eq('k=2 Ls', +l.Ls.toFixed(2), 752.99); eq('k=2 LsCom', l.LsCom, 760);
// 14. cada tipo de tubo tem tabela de suportes
let semMapa = 0, susp = 0;
for (const tp of Object.keys(DADOS.tubos)) {
    const dil = DADOS.dilatacao[tp];
    if (!dil || !dil.suporte || !SUP.tipos.some(x => x.id === dil.suporte)) { semMapa++; console.log('  sem suporte válido:', tp); }
    for (const d of DADOS.tubos[tp]) for (const dT of [20, 25, 30, 40, 45, 50, 60, 70, 80]) { const s = E.suporte(DADOS, tp, d, dT); if (s && s.suspeito) susp++; }
}
eq('tipos sem tabela de suportes', semMapa, 0);
console.log('células suspeitas nos suportes (esperado: só a gralha CT+ Ø250/60):', susp);
console.log(fails ? fails + ' FALHAS' : 'TODOS OK');
process.exit(fails ? 1 : 0);
