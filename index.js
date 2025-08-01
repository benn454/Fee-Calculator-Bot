// Discord bot with Slash Commands for eBay Australia fee calculator (Basic Store only)

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // Optional: for testing in a specific server

const FINAL_VALUE_FEE_PERCENTAGE = 0.131;
const FIXED_FEE = 0.3;

function calculateFees(salePrice, buyerPostage, sellerPostageCost) {
  const totalChargedToBuyer = salePrice + buyerPostage;
  const finalValueFee = totalChargedToBuyer * FINAL_VALUE_FEE_PERCENTAGE + FIXED_FEE;
  const totalFees = finalValueFee;
  const netProfit = salePrice - sellerPostageCost - totalFees;
  const profitMargin = (netProfit / totalChargedToBuyer) * 100;

  return {
    finalValueFee: finalValueFee.toFixed(2),
    totalFees: totalFees.toFixed(2),
    netProfit: netProfit.toFixed(2),
    profitMargin: profitMargin.toFixed(2)
  };
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'fees') {
    const price = interaction.options.getNumber('price');
    const buyerPostage = interaction.options.getNumber('postage_to_buyer') || 0;
    const sellerPostageCost = interaction.options.getNumber('postage_cost') || 0;

    const result = calculateFees(price, buyerPostage, sellerPostageCost);

    await interaction.reply(
      `💸 **eBay Fee Breakdown (AUD)**\n` +
      `• Final Value Fee: $${result.finalValueFee}\n` +
      `• Total Fees: $${result.totalFees}\n` +
      `• Net Profit: $${result.netProfit}\n` +
      `• Profit Margin: ${result.profitMargin}%`
    );
  }
});

client.login(TOKEN);

// -------- SLASH COMMAND REGISTRATION --------

const commands = [
  new SlashCommandBuilder()
    .setName('fees')
    .setDescription('Calculate eBay AU selling fees (Basic Store)')
    .addNumberOption(option =>
      option.setName('price')
        .setDescription('Sale price of the item')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('postage_to_buyer')
        .setDescription('Postage charged to buyer')
        .setRequired(false))
    .addNumberOption(option =>
      option.setName('postage_cost')
        .setDescription('Your actual postage cost')
        .setRequired(false))
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('🔁 Refreshing application (/) commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered application commands.');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
})();
