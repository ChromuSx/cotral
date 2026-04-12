import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { Emoji, Color } from '../utils/formatting';

export const command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Mostra tutti i comandi disponibili'),

    async execute(interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setColor(Color.PRIMARY)
            .setTitle(`${Emoji.BUS} Cotral Bot — Comandi`)
            .setDescription('Bot per consultare orari, paline e transiti Cotral in tempo reale.')
            .addFields(
                {
                    name: `${Emoji.BUSSTOP} /paline`,
                    value: [
                        '`/paline codice <codice>` — Cerca palina per codice',
                        '`/paline posizione <lat> <lon>` — Cerca paline vicine',
                        '`/paline percorso <partenza> <destinazione>` — Cerca per percorso',
                        '`/paline destinazioni <località>` — Destinazioni da una località',
                    ].join('\n'),
                },
                {
                    name: `${Emoji.BUS} /transiti`,
                    value: '`/transiti <codice>` — Transiti in tempo reale da una palina',
                },
                {
                    name: `${Emoji.BUSSTOP} /fermate`,
                    value: [
                        '`/fermate cerca <località>` — Cerca fermate per località',
                        '`/fermate prima <località>` — Prima fermata di una località',
                    ].join('\n'),
                },
                {
                    name: `${Emoji.PIN} /veicoli`,
                    value: '`/veicoli <codice>` — Posizione in tempo reale di un veicolo',
                },
                {
                    name: `${Emoji.STAR} /preferiti`,
                    value: '`/preferiti` — Mostra le tue paline preferite',
                },
                {
                    name: `${Emoji.GEAR} Opzioni`,
                    value: 'Aggiungi `privato: True` a qualsiasi comando per rendere la risposta visibile solo a te.',
                },
            )
            .setFooter({ text: 'Cotral Bot • Dati in tempo reale da Cotral S.p.A.' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
