const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();
const sessions = {};

// 🔢 CONTADOR DE CHAMADOS
let contadorChamados = 1;

// 🧠 FUNÇÃO PARA GERAR NÚMERO DO CHAMADO
function gerarNumeroChamado() {
    const data = new Date();

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    const numero = String(contadorChamados).padStart(4, '0');

    contadorChamados++;

    return `CH${ano}${mes}${dia}-${numero}`;
}

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot conectado!');
});

client.on('message', message => {
    const user = message.from;
    const msg = message.body.toLowerCase();

    // 🆕 cria sessão se não existir
    if (!sessions[user]) {
        sessions[user] = { etapa: 'inicio', dados: {} };
    }

    const session = sessions[user];

    // 🔁 RESET GLOBAL
    if (msg === 'menu' || msg === '0') {
        session.etapa = 'menu';
        session.dados = {};
        return message.reply(
            '🔄 Menu reiniciado!\n\n1 - Suporte Técnico\n2 - Dúvidas\n3 - Outros'
        );
    }

    // 🚀 INÍCIO
    if (msg === 'oi') {
        session.etapa = 'menu';
        return message.reply(
            'Olá! 👋\n\n1 - Suporte Técnico\n2 - Dúvidas sobre sistemas\n3 - Outros assuntos\n\nDigite 0 para voltar ao menu.'
        );
    }

    // 📋 MENU
    if (session.etapa === 'menu') {
        if (msg === '1') {
            session.etapa = 'suporte';
            return message.reply('Descreva seu problema técnico:');
        }
        if (msg === '2') {
            session.etapa = 'duvidas';
            return message.reply('Qual sistema você tem dúvidas?');
        }
        if (msg === '3') {
            session.etapa = 'outros';
            return message.reply('Descreva seu assunto:');
        }

        return message.reply('Escolha uma opção válida (1, 2 ou 3).');
    }

    // 🛠️ SUPORTE
    if (session.etapa === 'suporte') {
        session.dados.problema = msg;
        session.etapa = 'confirmar_suporte';

        return message.reply(
            `Você descreveu:\n"${msg}"\n\nDeseja abrir chamado?\n1 - Sim\n2 - Não`
        );
    }

    // ✅ CONFIRMAÇÃO DO CHAMADO
    if (session.etapa === 'confirmar_suporte') {
        if (msg === '1') {
            const numeroChamado = gerarNumeroChamado();

            session.dados.numero = numeroChamado;
            session.etapa = 'fim';

            return message.reply(
                `✅ Chamado aberto com sucesso!\n\n📌 Número do chamado: ${numeroChamado}\n\nGuarde esse número para acompanhamento.`
            );
        }

        if (msg === '2') {
            session.etapa = 'menu';
            session.dados = {};
            return message.reply('❌ Chamado cancelado.\n\nVoltando ao menu...');
        }

        return message.reply('Digite 1 para confirmar ou 2 para cancelar.');
    }

    // 📚 DÚVIDAS
    if (session.etapa === 'duvidas') {
        session.etapa = 'fim';
        return message.reply('📚 Sua dúvida foi registrada!');
    }

    // 💬 OUTROS
    if (session.etapa === 'outros') {
        session.etapa = 'fim';
        return message.reply('👍 Recebemos sua mensagem!');
    }

    // 🔚 FIM
    if (session.etapa === 'fim') {
        return message.reply('Digite "menu" para iniciar um novo atendimento.');
    }

    message.reply('Digite "oi" para começar.');
});

client.initialize();