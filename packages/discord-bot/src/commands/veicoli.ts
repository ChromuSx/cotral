import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { getVehiclePositions } from '../apiHandlers/vehiclesApiHandler';

export const command = {
    data: new SlashCommandBuilder()
        .setName('veicoli')
        .setDescription('Posizione in tempo reale di un veicolo')
        .addStringOption(opt => opt
            .setName('codice')
            .setDescription('Codice del veicolo')
            .setRequired(true))
        .addBooleanOption(opt => opt
            .setName('privato')
            .setDescription('Mostra il risultato solo a te')),

    async execute(interaction: ChatInputCommandInteraction) {
        const ephemeral = interaction.options.getBoolean('privato') ?? false;
        await interaction.deferReply({ ephemeral });
        const codice = interaction.options.getString('codice', true);
        await getVehiclePositions(interaction, codice);
    },
};
