import { Telegraf, Context } from "telegraf";
require('dotenv').config();

export const bot = new Telegraf<Context>(process.env.BOT_TOKEN || 'bruh...'); 

bot.start((ctx) => {
  ctx.reply('Привет! Я простой бот. Напиши мне что-нибудь!');
  console.log(`User started the bot.`, ctx.from);

  ctx.replyWithPhoto('', {
          caption: 'Aboba',
          reply_markup: options.reply_markup,
        })
        .catch((err) => {
          console.error(err);
        });
});

const options = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Launch bot', web_app: { url: 'https://anonim-chat-frontend.onrender.com/' } }],
    ],
  },
};




const webhookUrl = 'https://anonim-chat-backend.onrender.com/bot'; // URL вашего сервиса на Render
bot.telegram.setWebhook(webhookUrl).then(() => console.log('Webhook установлен'));


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));