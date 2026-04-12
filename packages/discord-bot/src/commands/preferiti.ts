import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { displayFavoritePoles } from '../apiHandlers/polesApiHandler';

export const command = {
    data: new SlashCommandBuilder()
        .setName('preferiti')
        .setDescription('Mostra le tue paline preferite')
        .addBooleanOption(opt => opt
            .setName('privato')
            .setDescription('Mostra il risultato solo a te')),

    async execute(interaction: ChatInputCommandInteraction) {
        const ephemeral = interaction.options.getBoolean('privato') ?? false;
        await interaction.deferReply({ ephemeral });
        await displayFavoritePoles(interaction, interaction.user.id);
    },
};
