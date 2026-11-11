const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

// Environment variables used for 24/7 free cloud security
const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!BOT_TOKEN || !CLIENT_ID) {
  console.error('❌ Error: BOT_TOKEN and CLIENT_ID must be configured in Environment Variables.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName('buildserver')
    .setDescription('Creates categories and channels from structural JSON payload.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('data')
        .setDescription('Paste your minified structure JSON payload here')
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
  try {
    console.log('Registering /buildserver command globally...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Command registered successfully.');
  } catch (error) {
    console.error('Failed to register slash command:', error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'buildserver') {
    const rawData = interaction.options.getString('data');
    await interaction.deferReply();

    try {
      const categoriesData = JSON.parse(rawData);
      const guild = interaction.guild;

      for (const categoryData of categoriesData) {
        const categoryChannel = await guild.channels.create({
          name: categoryData.name,
          type: ChannelType.GuildCategory
        });

        for (const channelData of categoryData.channels) {
          const isVoice = channelData.type === 'voice';

          await guild.channels.create({
            name: channelData.name,
            type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
            parent: categoryChannel.id
          });
        }
      }

      await interaction.editReply('✅ Server layout generated successfully!');
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Execution failed. Ensure valid JSON was provided and the bot has "Manage Channels" permission.');
    }
  }
});

client.login(BOT_TOKEN);
