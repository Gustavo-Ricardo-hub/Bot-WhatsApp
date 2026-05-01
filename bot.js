const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mysql = require('mysql2/promise');

const client = new Client();
const sessions = {};

// 🔌 MYSQL
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'suporte_bot'
});

// 🧠 CRIAR CHAMADO
async function criarChamado(usuario, problema) {
    const [result] = await db.query(
        'INSERT INTO chamados (usuario, problema, status, data_abertura) VALUES (?, ?, ?, NOW())',
        [usuario, problema, 'aberto']
    );

    const id = result.insertId;

    const data = new Date();
    const numero = `CH${data.getFullYear()}${String(data.getMonth()+1).padStart(2,'0')}${String(data.getDate()).padStart(2,'0')}-${String(id).padStart(4,'0')}`;

    await db.query(
        'UPDATE chamados SET numero = ? WHERE id = ?',
        [numero, id]
    );

    return numero;
}

// 🔎 BUSCAR (COM SEGURANÇA)
async function buscarChamado(numero, usuario) {
    const [rows] = await db.query(
        'SELECT * FROM chamados WHERE numero = ? AND usuario = ?',
        [numero, usuario]
    );

    return rows[0];
}

// 🔒 FECHAR (COM SEGURANÇA)
async function fecharChamado(numero, usuario) {
    const [result] = await db.query(
        'UPDATE chamados SET status = ? WHERE numero = ? AND usuario = ?',
        ['fechado', numero, usuario]
    );

    return result.affectedRows;
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

    // 🔎 STATUS SEGURO
    if (msg.startsWith('status')) {
        const numero = msg.split(' ')[1];

        if (!numero) return message.reply('❌ Use: status CHxxxx');

        const chamado = await buscarChamado(numero, user);

        if (!chamado) {
            return message.reply('❌ Você não tem acesso a esse chamado.');
        }

        return message.reply(
            `📌 ${chamado.numero}\n🛠 ${chamado.problema}\n📊 ${chamado.status}`
        );
    }

    // 🔒 FECHAR SEGURO
    if (msg.startsWith('fechar')) {
        const numero = msg.split(' ')[1];

        if (!numero) return message.reply('❌ Use: fechar CHxxxx');

        const atualizado = await fecharChamado(numero, user);

        if (atualizado === 0) {
            return message.reply('❌ Você não pode fechar esse chamado.');
        }

        return message.reply(`✅ Chamado ${numero} fechado!`);
    }

    // 🔁 RESET
    if (msg === 'menu' || msg === '0') {
        session.etapa = 'menu';
        session.dados = {};
        return message.reply('🔄 Menu\n1 - Suporte\n2 - Dúvidas\n3 - Outros');
    }

    // 🚀 INÍCIO
    if (msg === 'oi') {
        session.etapa = 'menu';
        return message.reply('Olá! 👋\n\n1 - Suporte\n2 - Dúvidas\n3 - Outros');
    }

    // 📋 MENU
    if (session.etapa === 'menu') {
        if (msg === '1') {
            session.etapa = 'suporte';
            return message.reply('Descreva seu problema:');
        }
        return message.reply('Escolha válida: 1');
    }

    // 🛠 SUPORTE
    if (session.etapa === 'suporte') {
        session.dados.problema = msg;
        session.etapa = 'confirmar';

        return message.reply('Abrir chamado?\n1 - Sim\n2 - Não');
    }

    // ✅ CONFIRMAR
    if (session.etapa === 'confirmar') {
        if (msg === '1') {
            const numero = await criarChamado(user, session.dados.problema);

            session.etapa = 'fim';

            return message.reply(`✅ Chamado aberto!\n📌 ${numero}`);
        }

        session.etapa = 'menu';
        return message.reply('Cancelado.');
    }

    if (session.etapa === 'fim') {
        return message.reply('Digite "menu" para novo atendimento.');
    }

    message.reply('Digite "oi" para começar.');
});

client.initialize();