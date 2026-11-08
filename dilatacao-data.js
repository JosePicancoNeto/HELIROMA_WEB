/* dilatacao-data.js — coeficientes de dilatação por tipo de tubo (HELIROMA-CALC).
   As chaves têm de coincidir com os nomes em heliroma-data.js → tubos
   (os diâmetros disponíveis vêm de lá; antes estavam duplicados em pipes-data.js).
     c     : constante do material C (braço de dilatação)
     alpha : coeficiente de dilatação linear α (mm/m·K) */
window.HELIROMA_DILATACAO = {
    "PP-R 100 PIPE SDR 6 HELISYSTEM": { "c": 20, "alpha": 0.150 },
    "PP-R 100 PIPE SDR 7,4 HELISYSTEM": { "c": 20, "alpha": 0.150 },
    "PP-R 100 PIPE WITH FIBERGLASS SDR 7,4 ROMAFASER": { "c": 20, "alpha": 0.035 },
    "PP-R 100 PIPE WITH FIBERGLASS SDR 11 ROMAKLIMA": { "c": 20, "alpha": 0.035 },
    "PP-R 100 PIPE WITH FIBERGLASS SDR 7,4 ANTI-UV ROMAFASER ANTI-UV": { "c": 20, "alpha": 0.035 },
    "PP-RCT 125 PIPE WITH FIBERGLASS SDR 11 ROMAFASER CT": { "c": 20, "alpha": 0.035 },
    "PP-RCT 125 PIPE WITH FIBERGLASS SDR 17 ROMAKLIMA CT": { "c": 20, "alpha": 0.035 },
    "PP-RCT 125 PIPE WITH FIBERGLASS SDR 9 ROMAFASER CT+": { "c": 20, "alpha": 0.035 }
};
