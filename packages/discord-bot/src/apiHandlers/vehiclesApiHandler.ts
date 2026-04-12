import {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    type CommandInteraction, type MessageComponentInteraction,
} from 'discord.js';
import type { VehiclePosition } from '@cotral/shared';
import { api } from '../services/axiosService';
import { Emoji, Color, mapsLink, mapsUrl, isValidCoord, errorEmbed } from '../utils/formatting';
import { handleApiError } from './errorHandler';

type Interaction = CommandInteraction | MessageComponentInteraction;

export async function getVehiclePositions(interaction: Interaction, vehicleCode: string) {
    try {
        const { data: position } = await api.get<VehiclePosition>(
            `/vehicles/${encodeURIComponent(vehicleCode)}`,
        );

        if (!position?.coordX?.length || !position?.coordY?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Posizione non disponibile per questo veicolo.')] });
            return;
        }

        const lastX = position.coordX[position.coordX.length - 1];
        const lastY = position.coordY[position.coordY.length - 1];

        if (!isValidCoord(lastX, lastY)) {
            await interaction.editReply({ embeds: [errorEmbed('Coordinate non valide per questo veicolo.')] });
            return;
        }

        const lines: string[] = [
            `${Emoji.GEAR} **Veicolo:** \`${vehicleCode}\``,
        ];
        if (position.time) {
            lines.push(`${Emoji.CLOCK} **Ultimo aggiornamento:** ${position.time}`);
        }
        lines.push(`${Emoji.PIN} ${mapsLink(lastX, lastY)}`);

        const embed = new EmbedBuilder()
            .setColor(Color.PRIMARY)
            .setTitle(`${Emoji.BUS} Posizione veicolo`)
            .setDescription(lines.join('\n'));

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setURL(mapsUrl(lastX, lastY))
                .setLabel('Apri in Google Maps')
                .setEmoji(Emoji.PIN)
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setCustomId(`vehicles:getVehicleRealTimePositions:${vehicleCode}`)
                .setLabel('Aggiorna')
                .setEmoji(Emoji.REFRESH)
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}
