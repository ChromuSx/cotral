import {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, type CommandInteraction, type MessageComponentInteraction,
} from 'discord.js';
import type { Stop } from '@cotral/shared';
import { api } from '../services/axiosService';
import { Emoji, Color, mapsLink, mapsUrl, isValidCoord, resultCountHeader, errorEmbed } from '../utils/formatting';
import { handleApiError } from './errorHandler';

type Interaction = CommandInteraction | MessageComponentInteraction;

function buildStopEmbed(stop: Stop): EmbedBuilder {
    const lines: string[] = [];
    if (stop.codiceStop) lines.push(`${Emoji.POINT} **Codice:** \`${stop.codiceStop}\``);
    if (stop.localita) lines.push(`${Emoji.POINT} **Località:** ${stop.localita}`);
    if (isValidCoord(stop.coordX, stop.coordY)) {
        lines.push(`${Emoji.PIN} ${mapsLink(stop.coordX, stop.coordY)}`);
    }

    return new EmbedBuilder()
        .setColor(Color.PRIMARY)
        .setTitle(`${Emoji.BUSSTOP} ${stop.nomeStop || 'Fermata'}`)
        .setDescription(lines.join('\n'));
}

function buildStopButtons(stop: Stop): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const row = new ActionRowBuilder<ButtonBuilder>();

    if (isValidCoord(stop.coordX, stop.coordY)) {
        row.addComponents(
            new ButtonBuilder()
                .setURL(mapsUrl(stop.coordX, stop.coordY))
                .setLabel('Apri in Google Maps')
                .setEmoji(Emoji.PIN)
                .setStyle(ButtonStyle.Link),
        );
    }

    if (row.components.length) rows.push(row);
    return rows;
}

function buildStopSelectMenu(stops: Stop[]): ActionRowBuilder<StringSelectMenuBuilder> {
    const options = stops.slice(0, 25).map(s => ({
        label: (s.nomeStop || 'Fermata').slice(0, 100),
        description: s.localita?.slice(0, 100) || undefined,
        value: `sel:stop:${s.codiceStop}:${s.coordX}:${s.coordY}:${encodeURIComponent((s.nomeStop || '').slice(0, 30))}`,
    }));

    const menu = new StringSelectMenuBuilder()
        .setCustomId('stop_select')
        .setPlaceholder('Seleziona una fermata...')
        .addOptions(options);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export async function getStopsByLocality(interaction: Interaction, locality: string) {
    try {
        const { data: stops } = await api.get<Stop[]>(`/stops/locality/${encodeURIComponent(locality)}`);

        if (!stops?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Nessuna fermata trovata.')] });
            return;
        }

        if (stops.length === 1) {
            await interaction.editReply({
                embeds: [buildStopEmbed(stops[0])],
                components: buildStopButtons(stops[0]),
            });
        } else {
            const embed = new EmbedBuilder()
                .setColor(Color.SUCCESS)
                .setDescription(`${resultCountHeader(stops.length, 'fermate')}\n\nSeleziona una fermata dal menu.`);
            await interaction.editReply({ embeds: [embed], components: [buildStopSelectMenu(stops)] });
        }
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function getFirstStopByLocality(interaction: Interaction, locality: string) {
    try {
        const { data: stop } = await api.get<Stop>(`/stops/locality/${encodeURIComponent(locality)}/first`);

        if (!stop) {
            await interaction.editReply({ embeds: [errorEmbed('Nessuna fermata trovata.')] });
            return;
        }

        await interaction.editReply({
            embeds: [buildStopEmbed(stop)],
            components: buildStopButtons(stop),
        });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}
