/* tabs.js — abas com seletor <select> para mobile.
   Partilhado por HELIROMA-CALC.html e TEORIA-DILATACAO.html (antes cada página tinha uma cópia).
   Espera: botões .tab-button[data-tab], painéis .tab-content[id] e, opcionalmente, #tabSelectorMobile.
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
