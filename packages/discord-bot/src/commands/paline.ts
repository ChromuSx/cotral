import { SlashCommandBuilder, type ChatInputCommandInteraction, type AutocompleteInteraction } from 'discord.js';
import { getPolesByCode, getPolesByPosition, getPolesByArrivalDestination, getDestinationsByArrival } from '../apiHandlers/polesApiHandler';
import { searchLocalitiesAutocomplete } from '../services/autocompleteService';

export const command = {
    data: new SlashCommandBuilder()
        .setName('paline')
        .setDescription('Cerca paline Cotral')
        .addSubcommand(sub => sub
            .setName('codice')
            .setDescription('Cerca palina per codice')
            .addStringOption(opt => opt
                .setName('codice')
                .setDescription('Codice della palina (es. 30125)')
                .setRequired(true))
            .addBooleanOption(opt => opt
                .setName('privato')
                .setDescription('Mostra il risultato solo a te')))
        .addSubcommand(sub => sub
            .setName('posizione')
            .setDescription('Cerca paline vicine a una posizione')
            .addNumberOption(opt => opt
                .setName('latitudine')
                .setDescription('Latitudine (es. 41.9028)')
                .setRequired(true))
            .addNumberOption(opt => opt
                .setName('longitudine')
                .setDescription('Longitudine (es. 12.4964)')
                .setRequired(true))
            .addBooleanOption(opt => opt
                .setName('privato')
                .setDescription('Mostra il risultato solo a te')))
        .addSubcommand(sub => sub
            .setName('percorso')
            .setDescription('Cerca paline per arrivo e destinazione')
            .addStringOption(opt => opt
                .setName('partenza')
                .setDescription('Località di partenza')
                .setRequired(true)
                .setAutocomplete(true))
            .addStringOption(opt => opt
                .setName('destinazione')
                .setDescription('Località di destinazione')
                .setRequired(true)
                .setAutocomplete(true))
            .addBooleanOption(opt => opt
                .setName('privato')
                .setDescription('Mostra il risultato solo a te')))
        .addSubcommand(sub => sub
            .setName('destinazioni')
            .setDescription('Mostra tutte le destinazioni da una località')
            .addStringOption(opt => opt
                .setName('localita')
                .setDescription('Località di partenza')
                .setRequired(true)
                .setAutocomplete(true))
            .addBooleanOption(opt => opt
                .setName('privato')
                .setDescription('Mostra il risultato solo a te'))),

    async autocomplete(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused();
        await searchLocalitiesAutocomplete(interaction, focused);
    },

    async execute(interaction: ChatInputCommandInteraction) {
        const ephemeral = interaction.options.getBoolean('privato') ?? false;
        await interaction.deferReply({ ephemeral });
        const sub = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        switch (sub) {
            case 'codice': {
                const codice = interaction.options.getString('codice', true);
                await getPolesByCode(interaction, codice, userId);
                break;
            }
            case 'posizione': {
                const lat = interaction.options.getNumber('latitudine', true);
                const lon = interaction.options.getNumber('longitudine', true);
                await getPolesByPosition(interaction, lat, lon);
                break;
            }
            case 'percorso': {
                const partenza = interaction.options.getString('partenza', true);
                const destinazione = interaction.options.getString('destinazione', true);
                await getPolesByArrivalDestination(interaction, partenza, destinazione);
                break;
            }
            case 'destinazioni': {
                const localita = interaction.options.getString('localita', true);
                await getDestinationsByArrival(interaction, localita);
                break;
            }
        }
    },
};
