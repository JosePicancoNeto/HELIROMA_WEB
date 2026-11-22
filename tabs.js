/* tabs.js — abas com seletor <select> para mobile.
   Partilhado por HELIROMA-CALC.html e TEORIA-DILATACAO.html (antes cada página tinha uma cópia).
   Espera: botões .tab-button[data-tab], painéis .tab-content[id] e, opcionalmente, #tabSelectorMobile.
   setupSubTabs() (no fim deste ficheiro) trata das sub-abas.
   Carregar com <script src="tabs.js"> ANTES do script da página que chama setupTabs(). */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabSelector = document.getElementById('tabSelectorMobile');

    function activateTab(tabName) {
        tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        tabContents.forEach(content => content.classList.toggle('active', content.id === tabName));
        if (tabSelector && tabSelector.value !== tabName) {
            tabSelector.value = tabName;
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => activateTab(button.dataset.tab));
    });

    if (tabSelector) {
        tabSelector.addEventListener('change', () => activateTab(tabSelector.value));
    }
}

/* Sub-abas dentro de uma aba (ex.: Calculadora Detalhada → Cálculo Padrão / Cálculo Avançado).
   Espera, dentro de um contentor [data-subtabs]: botões .subtab-button[data-subtab] e painéis
   .subtab-content[id]. Independente de setupTabs(), por isso não interfere com as abas principais. */
function setupSubTabs() {
    document.querySelectorAll('[data-subtabs]').forEach(group => {
        const buttons = group.querySelectorAll('.subtab-button');
        const panels = group.querySelectorAll('.subtab-content');
        buttons.forEach(btn => btn.addEventListener('click', () => {
            buttons.forEach(b => {
                const on = b === btn;
                b.classList.toggle('active', on);
                b.setAttribute('aria-selected', String(on));
            });
            panels.forEach(p => p.classList.toggle('active', p.id === btn.dataset.subtab));
        }));
    });
}
