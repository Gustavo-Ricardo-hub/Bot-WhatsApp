const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true }); // 👈 MOSTRA O QR
});

client.on('ready', () => {
    console.log('Bot conectado!');
});

client.on('message', message => {
    const msg = message.body.toLowerCase();

    if (msg === 'oi') {
        message.reply('Olá! 👋\n\n1 - Suporte Técnico\n2 - Dúvidas sobre sistemas\n3 - Outros assuntos');
    }
    else if (msg === '1') {
        message.reply('Você escolheu Suporte Técnico. Por favor, descreva seu problema.');
    }
    else if (msg === '2') {
        message.reply('Você escolheu Dúvidas sobre sistemas. Qual sistema você tem dúvidas?');
    }
    else if (msg === '3') {
        message.reply('Você escolheu Outros assuntos. Por favor, descreva seu assunto.');
    }
    else {
        message.reply('Desculpe, não entendi. Digite "oi" para ver o menu.');
    }
});

client.initialize();