import { Vehicle } from './Vehicle';

export interface Transit {
    idCorsa: string;
    percorso: string;
    partenzaCorsa: string;
    orarioPartenzaCorsa: string;
    arrivoCorsa: string;
    orarioArrivoCorsa: string;
    soppressa: string;
    numeroOrdine: string;
    tempoTransito: string;
    ritardo: string;
    passato: string;
    automezzo: Vehicle;
    testoFermata: string;
    dataModifica: string;
    instradamento: string;
    banchina: string;
    monitorata: string;
    accessibile: string;
}
