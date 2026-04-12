import {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, ComponentType,
    type CommandInteraction, type MessageComponentInteraction,
} from 'discord.js';
import type { Pole } from '@cotral/shared';
import { api } from '../services/axiosService';
import { Emoji, Color, mapsLink, mapsUrl, isValidCoord, divider, resultCountHeader, errorEmbed } from '../utils/formatting';
import { logger } from '../utils/logger';
import { handleApiError } from './errorHandler';

type Interaction = CommandInteraction | MessageComponentInteraction;

// ── Pole embed ───────────────────────────────────────────────

function buildPoleEmbed(pole: Pole): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Color.PRIMARY)
        .setTitle(`${Emoji.BUSSTOP} ${pole.nomePalina || pole.nomeStop || 'Palina'}`);

    const lines: string[] = [];
    if (pole.codicePalina) lines.push(`${Emoji.POINT} **Codice palina:** \`${pole.codicePalina}\``);
    if (pole.nomeStop || pole.codiceStop) {
        const stopInfo = [pole.nomeStop, pole.codiceStop ? `(${pole.codiceStop})` : ''].filter(Boolean).join(' ');
        lines.push(`${Emoji.POINT} **Fermata:** ${stopInfo}`);
    }
    if (pole.localita || pole.comune) {
        const loc = [pole.localita, pole.comune].filter(Boolean).join(', ');
        lines.push(`${Emoji.POINT} **Località:** ${loc}`);
    }
    if (pole.destinazioni?.length) {
        lines.push(`${Emoji.POINT} **Destinazioni:** ${pole.destinazioni.join(', ')}`);
    }
    if (pole.distanza) {
        lines.push(`${Emoji.POINT} **Distanza:** ${pole.distanza}`);
    }
    if (isValidCoord(pole.coordX, pole.coordY)) {
        lines.push(`${Emoji.PIN} ${mapsLink(pole.coordX!, pole.coordY!)}`);
    }

    embed.setDescription(lines.join('\n')).setTimestamp();
    return embed;
}

// ── Pole action buttons ──────────────────────────────────────

function buildPoleButtons(pole: Pole): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`transits:getTransits:${pole.codicePalina}`)
            .setLabel('Transiti')
            .setEmoji(Emoji.BUS)
            .setStyle(ButtonStyle.Primary),
    );

    if (pole.preferita) {
        row1.addComponents(
            new ButtonBuilder()
                .setCustomId(`poles:remove_favorite:${pole.codicePalina}`)
                .setLabel('Rimuovi preferito')
                .setEmoji(Emoji.CROSS)
                .setStyle(ButtonStyle.Danger),
        );
    } else if (isValidCoord(pole.coordX, pole.coordY)) {
        row1.addComponents(
            new ButtonBuilder()
                .setCustomId(`poles:fav:${pole.codicePalina}:${pole.coordX}:${pole.coordY}`)
                .setLabel('Preferito')
                .setEmoji(Emoji.STAR)
                .setStyle(ButtonStyle.Secondary),
        );
    }
    rows.push(row1);

    if (isValidCoord(pole.coordX, pole.coordY)) {
        rows.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setURL(mapsUrl(pole.coordX!, pole.coordY!))
                    .setLabel('Apri in Google Maps')
                    .setEmoji(Emoji.PIN)
                    .setStyle(ButtonStyle.Link),
            ),
        );
    }

    return rows;
}

// ── Pole select menu ─────────────────────────────────────────

function buildPoleSelectMenu(poles: Pole[], page: number = 0): ActionRowBuilder<StringSelectMenuBuilder> {
    const pageSize = 25;
    const start = page * pageSize;
    const slice = poles.slice(start, start + pageSize);

    const options = slice.map(p => ({
        label: (p.nomePalina || p.nomeStop || 'Palina').slice(0, 100),
        description: [p.localita, p.distanza ? `${p.distanza}` : ''].filter(Boolean).join(' • ').slice(0, 100) || undefined,
        value: `sel:pole:${p.codicePalina}`,
    }));

    const menu = new StringSelectMenuBuilder()
        .setCustomId('pole_select')
        .setPlaceholder('Seleziona una palina...')
        .addOptions(options);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function buildPaginationButtons(currentPage: number, totalPages: number, callbackPrefix: string): ActionRowBuilder<ButtonBuilder> | null {
    if (totalPages <= 1) return null;
    const row = new ActionRowBuilder<ButtonBuilder>();

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`${callbackPrefix}:page:${currentPage - 1}`)
            .setLabel('Precedente')
            .setEmoji(Emoji.BACK)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0),
        new ButtonBuilder()
            .setCustomId('page_info')
            .setLabel(`${currentPage + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId(`${callbackPrefix}:page:${currentPage + 1}`)
            .setLabel('Successivo')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= totalPages - 1),
    );

    return row;
}

// ── Public handlers ──────────────────────────────────────────

export async function getPolesByCode(interaction: Interaction, code: string, userId?: string) {
    try {
        const url = userId
            ? `/poles/${encodeURIComponent(code)}?userId=${userId}`
            : `/poles/${encodeURIComponent(code)}`;
        const { data: poles } = await api.get<Pole[]>(url);

        if (!poles?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Nessuna palina trovata.')] });
            return;
        }

        if (poles.length === 1) {
            const embed = buildPoleEmbed(poles[0]);
            const components = buildPoleButtons(poles[0]);
            await interaction.editReply({ embeds: [embed], components });
        } else {
            const embed = new EmbedBuilder()
                .setColor(Color.SUCCESS)
                .setDescription(`${resultCountHeader(poles.length, 'paline')}\n\nSeleziona una palina dal menu.`);
            await interaction.editReply({ embeds: [embed], components: [buildPoleSelectMenu(poles)] });
        }
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function getPolesByPosition(interaction: Interaction, latitude: number, longitude: number) {
    try {
        const { data: poles } = await api.get<Pole[]>(
            `/poles/position?latitude=${latitude}&longitude=${longitude}`,
        );

        if (!poles?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Nessuna palina trovata nelle vicinanze.')] });
            return;
        }

        if (poles.length === 1) {
            await interaction.editReply({ embeds: [buildPoleEmbed(poles[0])], components: buildPoleButtons(poles[0]) });
        } else {
            const embed = new EmbedBuilder()
                .setColor(Color.SUCCESS)
                .setDescription(`${resultCountHeader(poles.length, 'paline')}\n\nSeleziona una palina dal menu.`);
            await interaction.editReply({ embeds: [embed], components: [buildPoleSelectMenu(poles)] });
        }
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function getPolesByArrivalDestination(interaction: Interaction, arrival: string, destination: string) {
    try {
        const { data: poles } = await api.get<Pole[]>(
            `/poles/${encodeURIComponent(arrival)}/${encodeURIComponent(destination)}`,
        );

        if (!poles?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Nessuna palina trovata per questo percorso.')] });
            return;
        }

        if (poles.length === 1) {
            await interaction.editReply({ embeds: [buildPoleEmbed(poles[0])], components: buildPoleButtons(poles[0]) });
        } else {
            const title = `${Emoji.COMPASS} Paline ${arrival} → ${destination}`;
            const embed = new EmbedBuilder()
                .setColor(Color.SUCCESS)
                .setDescription(`${title}\n\n${resultCountHeader(poles.length, 'paline')}`);
            await interaction.editReply({ embeds: [embed], components: [buildPoleSelectMenu(poles)] });
        }
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function getDestinationsByArrival(interaction: Interaction, arrivalLocality: string) {
    try {
        const { data: destinations } = await api.get<string[]>(
            `/poles/destinations/${encodeURIComponent(arrivalLocality)}`,
        );

        if (!destinations?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Nessuna destinazione trovata.')] });
            return;
        }

        const options = destinations.slice(0, 25).map(dest => ({
            label: dest.slice(0, 100),
            value: `search:arrdest:${encodeURIComponent(arrivalLocality)}:${encodeURIComponent(dest)}`,
        }));

        const menu = new StringSelectMenuBuilder()
            .setCustomId('destination_select')
            .setPlaceholder('Seleziona una destinazione...')
            .addOptions(options);

        const embed = new EmbedBuilder()
            .setColor(Color.PRIMARY)
            .setDescription(`${Emoji.COMPASS} **Destinazioni da ${arrivalLocality}**\n\nTrovate ${destinations.length} destinazioni.`);

        await interaction.editReply({
            embeds: [embed],
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
        });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function displayFavoritePoles(interaction: Interaction, userId: string) {
    try {
        const { data: poles } = await api.get<Pole[]>(`/poles/favorites/${userId}`);

        if (!poles?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Non hai ancora paline preferite.')] });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Color.PRIMARY)
            .setTitle(`${Emoji.STAR} Le tue paline preferite (${poles.length})`)
            .setDescription(poles.map(p =>
                `${Emoji.BUSSTOP} **${p.nomePalina || p.nomeStop || p.codicePalina}** — \`${p.codicePalina}\``
            ).join('\n'));

        await interaction.editReply({ embeds: [embed], components: [buildPoleSelectMenu(poles)] });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function addFavoritePole(interaction: MessageComponentInteraction, poleCode: string, lat: string, lon: string, userId: string) {
    try {
        await api.post('/poles/favorites', { userId, poleCode, poleLat: lat, poleLon: lon });

        // Rebuild components with updated favorite button
        const updatedComponents = interaction.message.components
            .filter(row => row.type === ComponentType.ActionRow)
            .map(row => {
                const newRow = new ActionRowBuilder<ButtonBuilder>();
                for (const comp of row.components) {
                    const btn = ButtonBuilder.from(comp as any);
                    if (comp.type === ComponentType.Button && 'customId' in comp && comp.customId?.startsWith('poles:fav:')) {
                        btn.setCustomId(`poles:remove_favorite:${poleCode}`)
                            .setLabel('Rimuovi preferito')
                            .setEmoji(Emoji.CROSS)
                            .setStyle(ButtonStyle.Danger);
                    }
                    newRow.addComponents(btn);
                }
                return newRow;
            });

        await interaction.editReply({ components: updatedComponents });
        await interaction.followUp({ content: `${Emoji.STAR} Aggiunta ai preferiti!`, ephemeral: true });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function removeFavoritePole(interaction: MessageComponentInteraction, poleCode: string, userId: string) {
    try {
        await api.delete('/poles/favorites', { data: { userId, poleCode } });

        const updatedComponents = interaction.message.components
            .filter(row => row.type === ComponentType.ActionRow)
            .map(row => {
                const newRow = new ActionRowBuilder<ButtonBuilder>();
                for (const comp of row.components) {
                    const btn = ButtonBuilder.from(comp as any);
                    if (comp.type === ComponentType.Button && 'customId' in comp && comp.customId?.startsWith('poles:remove_favorite:')) {
                        btn.setCustomId(`poles:fav_done:${poleCode}`)
                            .setLabel('Preferito rimosso')
                            .setEmoji(Emoji.CHECK)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);
                    }
                    newRow.addComponents(btn);
                }
                return newRow;
            });

        await interaction.editReply({ components: updatedComponents });
        await interaction.followUp({ content: `${Emoji.CROSS} Rimossa dai preferiti.`, ephemeral: true });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function displaySinglePoleDetails(interaction: Interaction, poleCode: string, userId?: string) {
    try {
        const url = userId
            ? `/poles/${encodeURIComponent(poleCode)}?userId=${userId}`
            : `/poles/${encodeURIComponent(poleCode)}`;
        const { data: poles } = await api.get<Pole[]>(url);
        const pole = poles?.[0];

        if (!pole) {
            await interaction.editReply({ embeds: [errorEmbed('Palina non trovata.')] });
            return;
        }

        await interaction.editReply({ embeds: [buildPoleEmbed(pole)], components: buildPoleButtons(pole) });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}
