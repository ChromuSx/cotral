import { SlashCommandBuilder, type ChatInputCommandInteraction, type AutocompleteInteraction } from 'discord.js';
import { getStopsByLocality, getFirstStopByLocality } from '../apiHandlers/stopsApiHandler';
import { searchLocalitiesAutocomplete } from '../services/autocompleteService';

export const command = {
    data: new SlashCommandBuilder()
        .setName('fermate')
        .setDescription('Cerca fermate per località')
        .addSubcommand(sub => sub
            .setName('cerca')
            .setDescription('Cerca tutte le fermate in una località')
            .addStringOption(opt => opt
                .setName('localita')
                .setDescription('Nome della località')
                .setRequired(true)
                .setAutocomplete(true))
            .addBooleanOption(opt => opt
                .setName('privato')
                .setDescription('Mostra il risultato solo a te')))
        .addSubcommand(sub => sub
            .setName('prima')
            .setDescription('Mostra la prima fermata di una località')
            .addStringOption(opt => opt
                .setName('localita')
                .setDescription('Nome della località')
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
        const localita = interaction.options.getString('localita', true);

        switch (sub) {
            case 'cerca':
                await getStopsByLocality(interaction, localita);
                break;
            case 'prima':
                await getFirstStopByLocality(interaction, localita);
                break;
        }
    },
};
