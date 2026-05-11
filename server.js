const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();

const uri = 'STRING_MONGODB';

const client = new MongoClient(uri);

async function conectarMongo() {
    try {
        await client.connect();
        console.log('Conectado ao MongoDB');
        const db = client.db('biblioteca');
        const livros = db.collection('livros');
        await livros.insertOne({
            titulo: 'Dom Casmurro',
            autor: 'Machado de Assis'
        });
console.log('Livro inserido');
    }   catch (erro) {
        console.log('Erro ao conectar:', erro);
    }
}

conectarMongo();

app.use(express.static('public'));

/*app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});*/

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
})