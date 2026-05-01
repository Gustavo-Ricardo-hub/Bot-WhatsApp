const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mysql = require('mysql2/promise');

const client = new Client();
const sessions = {};

// 🔌 CONEXÃO MYSQL
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // coloque sua senha
    database: 'suporte_bot'
});

// 🔢 CONTADOR (simples - depois podemos melhorar)
let contadorChamados = 1;

// 🧠 GERAR NÚMERO
function gerarNumeroChamado() {
    const data = new Date();

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    const numero = String(contadorChamados).padStart(4, '0');

    contadorChamados++;

    return `CH${ano}${mes}${dia}-${numero}`;
}

// 💾 SALVAR NO BANCO
async function salvarChamado(numero, usuario, problema) {
    await db.query(
        'INSERT INTO chamados (numero, usuario, problema, status, data_abertura) VALUES (?, ?, ?, ?, NOW())',
        [numero, usuario, problema, 'aberto']
    );
}

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot conectado!');
});

client.on('message', async message => {
    const user = message.from;
    const msg = message.body.toLowerCase();

    if (!sessions[user]) {
        sessions[user] = { etapa: 'inicio', dados: {} };
    }

    const session = sessions[user];

    // 🔁 RESET
    if (msg === 'menu' || msg === '0') {
        session.etapa = 'menu';
        session.dados = {};
        return message.reply('🔄 Menu reiniciado!\n\n1 - Suporte\n2 - Dúvidas\n3 - Outros');
    }

    // 🚀 INÍCIO
    if (msg === 'oi') {
        session.etapa = 'menu';
        return message.reply(
            'Olá! 👋\n\n1 - Suporte Técnico\n2 - Dúvidas\n3 - Outros\n\nDigite 0 para voltar.'
        );
    }

    // 📋 MENU
    if (session.etapa === 'menu') {
        if (msg === '1') {
            session.etapa = 'suporte';
            return message.reply('Descreva seu problema:');
        }
        if (msg === '2') {
            session.etapa = 'duvidas';
            return message.reply('Qual sua dúvida?');
        }
        if (msg === '3') {
            session.etapa = 'outros';
            return message.reply('Descreva seu assunto:');
        }

        return message.reply('Escolha 1, 2 ou 3.');
    }

    // 🛠️ SUPORTE
    if (session.etapa === 'suporte') {
        session.dados.problema = msg;
        session.etapa = 'confirmar_suporte';

        return message.reply(
            `Você disse:\n"${msg}"\n\nAbrir chamado?\n1 - Sim\n2 - Não`
        );
    }

    // ✅ CONFIRMAÇÃO
    if (session.etapa === 'confirmar_suporte') {
        if (msg === '1') {
            try {
                const numeroChamado = gerarNumeroChamado();

                await salvarChamado(
                    numeroChamado,
                    user,
                    session.dados.problema
                );

                session.dados.numero = numeroChamado;
                session.etapa = 'fim';

                return message.reply(
                    `✅ Chamado aberto!\n\n📌 Nº: ${numeroChamado}`
                );
            } catch (erro) {
                console.error(erro);
                return message.reply('❌ Erro ao salvar chamado.');
            }
        }

        if (msg === '2') {
            session.etapa = 'menu';
            session.dados = {};
            return message.reply('❌ Cancelado. Voltando ao menu...');
        }

        return message.reply('Digite 1 ou 2.');
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
        return message.reply('Digite "menu" para novo atendimento.');
    }

    message.reply('Digite "oi" para começar.');
});

client.initialize();