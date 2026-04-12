import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { getTransitsByPoleCode } from '../apiHandlers/transitsApiHandler';

export const command = {
    data: new SlashCommandBuilder()
        .setName('transiti')
        .setDescription('Mostra i transiti in tempo reale da una palina')
        .addStringOption(opt => opt
            .setName('codice')
            .setDescription('Codice della palina (es. 30125)')
            .setRequired(true))
        .addBooleanOption(opt => opt
            .setName('privato')
            .setDescription('Mostra il risultato solo a te')),

    async execute(interaction: ChatInputCommandInteraction) {
        const ephemeral = interaction.options.getBoolean('privato') ?? false;
        await interaction.deferReply({ ephemeral });
        const codice = interaction.options.getString('codice', true);
        await getTransitsByPoleCode(interaction, codice);
    },
};
