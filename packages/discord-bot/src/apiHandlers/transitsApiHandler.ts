import {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, type CommandInteraction, type MessageComponentInteraction,
} from 'discord.js';
import type { Pole, Transit } from '@cotral/shared';
import { api } from '../services/axiosService';
import { Emoji, Color, divider, relativeTime, nowTimestamp, parseTime, errorEmbed } from '../utils/formatting';
import { handleApiError } from './errorHandler';

type Interaction = CommandInteraction | MessageComponentInteraction;

interface TransitsResponse {
    pole: Pole;
    transits: Transit[];
}

// ── Sorting & helpers ────────────────────────────────────────

function sortTransitsByDeparture(transits: Transit[]): Transit[] {
    return [...transits].sort((a, b) => {
        const ta = parseTime(a.orarioPartenzaCorsa);
        const tb = parseTime(b.orarioPartenzaCorsa);
        if (!ta || !tb) return 0;
        return ta.getTime() - tb.getTime();
    });
}

function findNextDepartureIndex(transits: Transit[]): number {
    const now = Date.now() - 60_000;
    return transits.findIndex(t => {
        const time = parseTime(t.orarioPartenzaCorsa);
        return time && time.getTime() >= now;
    });
}

// ── Embed builders ───────────────────────────────────────────

function hasAnyDelay(transits: Transit[]): boolean {
    return transits.some(t => t.ritardo && t.ritardo !== '00:00');
}

function buildTransitsEmbed(pole: Pole, transits: Transit[], nextIndex: number): EmbedBuilder {
    const title = `${Emoji.BUS} Transiti da ${pole.nomePalina || pole.codicePalina}`;
    const lines: string[] = [];

    transits.forEach((t, i) => {
        const isNext = i === nextIndex;
        const prefix = isNext ? Emoji.NEXT : Emoji.BUS;
        const route = `**${t.partenzaCorsa} → ${t.arrivoCorsa}**`;
        const time = t.orarioPartenzaCorsa || '??:??';
        const rel = relativeTime(t.orarioPartenzaCorsa);
        const delay = t.ritardo && t.ritardo !== '00:00'
            ? `${Emoji.DELAY} +${t.ritardo}`
            : `${Emoji.GREEN} Puntuale`;

        lines.push(`${prefix} ${route} — \`${time}\` ${rel} — ${delay}`);
    });

    if (!lines.length) lines.push('*Nessun transito disponibile.*');

    // Color: red if any delay, gold if next found, blue default
    let color = Color.PRIMARY;
    if (hasAnyDelay(transits)) color = Color.ERROR;
    else if (nextIndex >= 0) color = Color.NEXT;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(lines.join('\n'))
        .setFooter({ text: `Codice: ${pole.codicePalina}` })
        .setTimestamp();

    return embed;
}

function buildTransitDetailEmbed(transit: Transit, isNext: boolean): EmbedBuilder {
    const isDelayed = transit.ritardo && transit.ritardo !== '00:00';
    let color = Color.PRIMARY;
    if (isDelayed) color = Color.ERROR;
    else if (isNext) color = Color.NEXT;
    else color = Color.SUCCESS;
    const embed = new EmbedBuilder().setColor(color).setTimestamp();

    const lines: string[] = [];
    if (isNext) lines.push(`${Emoji.NEXT} **PROSSIMA PARTENZA**\n`);

    lines.push(`${Emoji.BUS} **${transit.partenzaCorsa} → ${transit.arrivoCorsa}**`);
    lines.push(divider());

    if (transit.orarioPartenzaCorsa) {
        lines.push(`${Emoji.CLOCK} **Partenza:** \`${transit.orarioPartenzaCorsa}\` ${relativeTime(transit.orarioPartenzaCorsa)}`);
    }
    if (transit.orarioArrivoCorsa) {
        lines.push(`${Emoji.CLOCK} **Arrivo:** \`${transit.orarioArrivoCorsa}\``);
    }
    if (transit.tempoTransito) {
        lines.push(`${Emoji.CLOCK} **Durata:** ${transit.tempoTransito}`);
    }

    if (transit.ritardo && transit.ritardo !== '00:00') {
        lines.push(`${Emoji.DELAY} **Ritardo:** ${transit.ritardo}`);
    } else {
        lines.push(`${Emoji.GREEN} **Puntuale**`);
    }

    if (transit.instradamento) {
        lines.push(`${Emoji.ROUTE} **Percorso:** ${transit.instradamento}`);
    }

    if (transit.automezzo?.codice) {
        const status = transit.automezzo.isAlive ? `${Emoji.GREEN} In tempo reale` : `${Emoji.RED} Ultima posizione nota`;
        lines.push(`${Emoji.GEAR} **Mezzo:** \`${transit.automezzo.codice}\` — ${status}`);
    }

    embed.setDescription(lines.join('\n'));
    return embed;
}

// ── Components ───────────────────────────────────────────────

function buildTransitSelectMenu(poleCode: string, transits: Transit[]): ActionRowBuilder<StringSelectMenuBuilder> {
    const options = transits.slice(0, 25).map((t, i) => ({
        label: `${t.orarioPartenzaCorsa || '??:??'} — ${t.partenzaCorsa} → ${t.arrivoCorsa}`.slice(0, 100),
        value: `td:${poleCode}:${i}`,
        emoji: i === findNextDepartureIndex(transits) ? Emoji.NEXT : Emoji.BUS,
    }));

    const menu = new StringSelectMenuBuilder()
        .setCustomId('transit_select')
        .setPlaceholder('Seleziona un transito per i dettagli...')
        .addOptions(options);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function buildRefreshButton(poleCode: string): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`transits:refresh:${poleCode}`)
            .setLabel('Aggiorna')
            .setEmoji(Emoji.REFRESH)
            .setStyle(ButtonStyle.Secondary),
    );
}

function buildTransitDetailButtons(poleCode: string, transit: Transit): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const row = new ActionRowBuilder<ButtonBuilder>();

    if (transit.automezzo?.codice) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`vehicles:getVehicleRealTimePositions:${transit.automezzo.codice}`)
                .setLabel('Posizione veicolo')
                .setEmoji(Emoji.PIN)
                .setStyle(ButtonStyle.Primary),
        );
    }

    row.addComponents(
        new ButtonBuilder()
            .setCustomId(`transits:getTransits:${poleCode}`)
            .setLabel('Tutti i transiti')
            .setEmoji(Emoji.BACK)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`transits:refresh:${poleCode}`)
            .setLabel('Aggiorna')
            .setEmoji(Emoji.REFRESH)
            .setStyle(ButtonStyle.Secondary),
    );

    rows.push(row);
    return rows;
}

// ── Public handlers ──────────────────────────────────────────

export async function getTransitsByPoleCode(interaction: Interaction, poleCode: string) {
    try {
        const { data } = await api.get<TransitsResponse>(`/transits/${encodeURIComponent(poleCode)}`);

        if (!data?.transits?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Nessun transito trovato per questa palina.')] });
            return;
        }

        const sorted = sortTransitsByDeparture(data.transits);
        const nextIndex = findNextDepartureIndex(sorted);
        const embed = buildTransitsEmbed(data.pole, sorted, nextIndex);

        const components: ActionRowBuilder<any>[] = [];
        if (sorted.length > 0) components.push(buildTransitSelectMenu(poleCode, sorted));
        components.push(buildRefreshButton(poleCode));

        await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function refreshTransitsByPoleCode(interaction: Interaction, poleCode: string) {
    try {
        const { data } = await api.get<TransitsResponse>(`/transits/${encodeURIComponent(poleCode)}`);

        if (!data?.transits?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Nessun transito trovato.')] });
            return;
        }

        const sorted = sortTransitsByDeparture(data.transits);
        const nextIndex = findNextDepartureIndex(sorted);
        const embed = buildTransitsEmbed(data.pole, sorted, nextIndex);

        const components: ActionRowBuilder<any>[] = [];
        if (sorted.length > 0) components.push(buildTransitSelectMenu(poleCode, sorted));
        components.push(buildRefreshButton(poleCode));

        await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}

export async function showTransitDetail(interaction: Interaction, poleCode: string, index: number) {
    try {
        const { data } = await api.get<TransitsResponse>(`/transits/${encodeURIComponent(poleCode)}`);

        if (!data?.transits?.length) {
            await interaction.editReply({ embeds: [errorEmbed('Transito non trovato.')] });
            return;
        }

        const sorted = sortTransitsByDeparture(data.transits);
        const nextIndex = findNextDepartureIndex(sorted);
        const transit = sorted[index];

        if (!transit) {
            await interaction.editReply({ embeds: [errorEmbed('Transito non trovato.')] });
            return;
        }

        const embed = buildTransitDetailEmbed(transit, index === nextIndex);
        const components = buildTransitDetailButtons(poleCode, transit);
        await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
        await handleApiError(interaction, error);
    }
}
