/* dilatacao-data.js — coeficientes de dilatação por tipo de tubo (HELIROMA-CALC).
   As chaves têm de coincidir com os nomes em heliroma-data.js → tubos
   (os diâmetros disponíveis vêm de lá; antes estavam duplicados em pipes-data.js).
     c     : constante do material C (braço de dilatação)
     alpha : coeficiente de dilatação linear α (mm/m·K)
     suporte : id da tabela de intervalos de suporte (suportes-data.js → tipos[].id) usada pelo
               "Cálculo padrão" de HELIROMA-CALC.html */
window.HELIROMA_DILATACAO = {
    "PP-R 100 PIPE SDR 6 HELISYSTEM": { "c": 20, "alpha": 0.150, "suporte": "helisystem" },
    "PP-R 100 PIPE SDR 7,4 HELISYSTEM": { "c": 20, "alpha": 0.150, "suporte": "helisystem" },
    "PP-R 100 PIPE WITH FIBERGLASS SDR 7,4 ROMAFASER": { "c": 20, "alpha": 0.035, "suporte": "romafaser" },
    "PP-R 100 PIPE WITH FIBERGLASS SDR 11 ROMAKLIMA": { "c": 20, "alpha": 0.035, "suporte": "romaklima-red-fire" },
    "PP-R 100 PIPE WITH FIBERGLASS SDR 7,4 ANTI-UV ROMAFASER ANTI-UV": { "c": 20, "alpha": 0.035, "suporte": "romafaser" },
    "PP-RCT 125 PIPE WITH FIBERGLASS SDR 11 ROMAFASER CT": { "c": 20, "alpha": 0.035, "suporte": "romafaser-ct" },
    "PP-RCT 125 PIPE WITH FIBERGLASS SDR 17 ROMAKLIMA CT": { "c": 20, "alpha": 0.035, "suporte": "romaklima-ct" },
    "PP-RCT 125 PIPE WITH FIBERGLASS SDR 9 ROMAFASER CT+": { "c": 20, "alpha": 0.035, "suporte": "romafaser-ct-plus" }
};
