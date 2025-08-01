// Discord bot that calculates eBay Australia fees for a Basic Store (Managed Payments only)
// Required packages: discord.js, dotenv

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// eBay Australia Basic Store managed payments fee % (as of recent rules)
const FINAL_VALUE_FEE_PERCENTAGE = 0.131; // 13.1% includes GST
const FIXED_FEE = 0.3; // AUD

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

client.on('messageCreate', message => {
  if (!message.content.startsWith('!fees')) return;

  const args = message.content.slice('!fees'.length).trim().split(/\s+/);
  const params = {};

  for (const arg of args) {
    const [key, value] = arg.split('=');
    if (key && value) params[key] = parseFloat(value);
  }

  const salePrice = params.price;
  const buyerPostage = params.postage_to_buyer || 0;
  const sellerPostageCost = params.postage_cost || 0;

  if (isNaN(salePrice)) {
    return message.reply('Please enter a valid sale price using `!fees price=VALUE [postage_to_buyer=VALUE] [postage_cost=VALUE]`');
  }

  const result = calculateFees(salePrice, buyerPostage, sellerPostageCost);

  message.reply(
    `💸 **eBay Fee Breakdown (AUD)**\n` +
    `• Final Value Fee: $${result.finalValueFee}\n` +
    `• Total Fees: $${result.totalFees}\n` +
    `• Net Profit: $${result.netProfit}\n` +
    `• Profit Margin: ${result.profitMargin}%`
  );
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
