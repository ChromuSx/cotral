export interface Pole {
    codicePalina?: string;
    codiceStop?: string | number;
    nomePalina?: string;
    nomeStop?: string;
    localita?: string;
    comune?: string;
    coordX?: number;
    coordY?: number;
    zonaTariffaria?: string;
    distanza?: string;
    destinazioni?: string[];
    isCotral?: number | null;
    isCapolinea?: number | null;
    isBanchinato?: number | null;
    preferita?: boolean;
}
