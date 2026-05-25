const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

app.use(express.urlencoded({ extended: true }));

const uri = 'mongodb+srv://admin:admin123@cluster0.cklap49.mongodb.net/?appName=Cluster0';

const client = new MongoClient(uri);

let db;

async function conectarMongo() {
    try {
        await client.connect();
        console.log('Conectado ao MongoDB');
        db = client.db('biblioteca');
        const livros = db.collection('livros');
        
    }   catch (erro) {
        console.log('Erro ao conectar:', erro);
    }
}

conectarMongo();

function menu() {

    return `

    <nav>

        <a href="/dashboard">Dashboard</a>

        <a href="/cadastrar-livro.html">
            Cadastrar Livro
        </a>

        <a href="/livros">
            Livros
        </a>

        <a href="/livros-disponiveis">
            Disponíveis
        </a>

        <a href="/emprestimos-ativos">
            Empréstimos
        </a>

        <a href="/buscar-livro">
            Buscar
        </a>

        <a href="/relatorio-emprestimos">
            Relatórios
        </a>

    </nav>

    `;

}

function pagina(titulo, conteudo) {

    return `

    <html>

    <head>

        <meta charset="UTF-8">

        <title>${titulo}</title>

        <link rel="stylesheet" href="/style.css">

    </head>

    <body>

        ${menu()}

        <div class="container">

            ${conteudo}

        </div>

    </body>

    </html>

    `;

}

app.use(express.static('public'));

app.post('/cadastrar-livro', async (req, res) => {

    try {

        const { titulo, autor } = req.body;

        const livros = db.collection('livros');

        await livros.insertOne({
            titulo,
            autor,
            status: 'disponivel'
        });

        res.send('Livro cadastrado com sucesso!');

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao cadastrar livro');

    }

});

app.get('/livros', async (req, res) => {

    try {

        const livros = await db.collection('livros').find().toArray();

        let conteudo = `

            <h1>Lista de Livros</h1>

        `;

        livros.forEach(livro => {

            conteudo += `

                <div class="livro">

                    <strong>Título:</strong>
                    ${livro.titulo}

                    <br>

                    <strong>Autor:</strong>
                    ${livro.autor}

                    <br>

                    <strong>Status:</strong>
                    ${livro.status}

                    <br><br>

                    <a href="/editar-livro/${livro._id}">

                        <button>
                            Editar
                        </button>

                    </a>

                    <br><br>

                    <form action="/emprestar-livro/${livro._id}" method="POST">

                        <button type="submit">
                            Emprestar
                        </button>

                    </form>

                    <br>

                    <form action="/deletar-livro/${livro._id}" method="POST">

                        <button type="submit">
                            Excluir
                        </button>

                    </form>

                </div>

            `;

        });

        res.send(
            pagina('Livros', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao buscar livros');

    }

});

app.post('/deletar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        await db.collection('livros').deleteOne({
            _id: new ObjectId(id)
        });

        res.redirect('/livros');

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao deletar livro');

    }

});

app.get('/editar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const livro = await db.collection('livros').findOne({

            _id: new ObjectId(id)

        });

        let conteudo = `

            <h1>Editar Livro</h1>

            <form action="/editar-livro/${livro._id}" method="POST">

                <label>Título:</label>

                <input 
                    type="text"
                    name="titulo"
                    value="${livro.titulo}"
                    required
                >

                <label>Autor:</label>

                <input 
                    type="text"
                    name="autor"
                    value="${livro.autor}"
                    required
                >

                <button type="submit">

                    Salvar Alterações

                </button>

            </form>

        `;

        res.send(
            pagina('Editar Livro', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao abrir edição');

    }

});

app.post('/editar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const { titulo, autor } = req.body;

        await db.collection('livros').updateOne(

            { _id: new ObjectId(id) },

            {
                $set: {
                    titulo,
                    autor
                }
            }

        );

        res.redirect('/livros');

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao editar livro');

    }

});

app.post('/login', async (req, res) => {

    try {

        const { usuario, senha } = req.body;
        
        console.log(usuario);
        console.log(senha);

        const admin = await db.collection('usuarios').findOne({
            usuario,
            senha
        });

        if (admin) {

            res.redirect('/dashboard');

        } else {

            res.send('Usuário ou senha inválidos');

        }

    } catch (erro) {

        console.log(erro);

        res.send('Erro no login');

    }

});

app.get('/dashboard', async (req, res) => {

    try {

        const totalLivros = await db.collection('livros').countDocuments();

        const livrosDisponiveis = await db.collection('livros').countDocuments({

            status: 'disponivel'

        });

        const livrosEmprestados = await db.collection('livros').countDocuments({

            status: 'emprestado'

        });

        const emprestimosAtivos = await db.collection('emprestimos').countDocuments({

            status: 'ativo'

        });

        let conteudo = `

            <h1>Painel Administrativo</h1>

            <div class="livro">

                <strong>Total de Livros:</strong>
                ${totalLivros}

            </div>

            <div class="livro">

                <strong>Livros Disponíveis:</strong>
                ${livrosDisponiveis}

            </div>

            <div class="livro">

                <strong>Livros Emprestados:</strong>
                ${livrosEmprestados}

            </div>

            <div class="livro">

                <strong>Empréstimos Ativos:</strong>
                ${emprestimosAtivos}

            </div>

        `;

        res.send(
            pagina('Dashboard', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        res.send('Erro no dashboard');

    }

});

app.post('/emprestar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const livros = db.collection('livros');

        const emprestimos = db.collection('emprestimos');

        const livro = await livros.findOne({
            _id: new ObjectId(id)
        });

        await livros.updateOne(

            { _id: new ObjectId(id) },

            {
                $set: {
                    status: 'emprestado'
                }
            }

        );

        await emprestimos.insertOne({

            livroId: livro._id,

            titulo: livro.titulo,

            usuario: 'admin',

            dataEmprestimo: new Date(),

            status: 'ativo'

        });

        res.redirect('/livros');

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao emprestar livro');

    }

});

app.get('/livros-disponiveis', async (req, res) => {

    try {

        const livros = await db.collection('livros').find({

            status: 'disponivel'

        }).toArray();

        let conteudo = `

            <h1>Livros Disponíveis</h1>

        `;

        livros.forEach(livro => {

            conteudo += `

                <div class="livro">

                    <strong>Título:</strong>
                    ${livro.titulo}

                    <br>

                    <strong>Autor:</strong>
                    ${livro.autor}

                    <br>

                    <strong>Status:</strong>
                    ${livro.status}

                </div>

            `;

        });

        res.send(
            pagina('Livros Disponíveis', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao buscar livros disponíveis');

    }

});

app.get('/emprestimos-ativos', async (req, res) => {

    try {

        const emprestimos = await db.collection('emprestimos').find({

            status: 'ativo'

        }).toArray();

        let conteudo = `

            <h1>Empréstimos Ativos</h1>

        `;

        emprestimos.forEach(emprestimo => {

            conteudo += `

                <div class="livro">

                    <strong>Livro:</strong>
                    ${emprestimo.titulo}

                    <br>

                    <strong>Usuário:</strong>
                    ${emprestimo.usuario}

                    <br>

                    <strong>Status:</strong>
                    ${emprestimo.status}

                    <br>

                    <strong>Data:</strong>
                    ${new Date(
                        emprestimo.dataEmprestimo
                    ).toLocaleDateString()}

                </div>

            `;

        });

        res.send(
            pagina('Empréstimos Ativos', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        res.send('Erro ao buscar empréstimos');

    }

});

app.get('/buscar-livro', async (req, res) => {

    try {

        const termo = req.query.termo || '';

        let livros = [];

        if (termo !== '') {

            livros = await db.collection('livros').find({

                titulo: {
                    $regex: termo,
                    $options: 'i'
                }

            }).toArray();

        }

        let conteudo = `

            <h1>Buscar Livro</h1>

            <form method="GET" action="/buscar-livro">

                <input 
                    type="text"
                    name="termo"
                    placeholder="Digite o título"
                >

                <button type="submit">
                    Buscar
                </button>

            </form>

        `;

        livros.forEach(livro => {

            conteudo += `

                <div class="livro">

                    <strong>Título:</strong>
                    ${livro.titulo}

                    <br>

                    <strong>Autor:</strong>
                    ${livro.autor}

                    <br>

                    <strong>Status:</strong>
                    ${livro.status}

                </div>

            `;

        });

        res.send(
            pagina('Buscar Livro', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        res.send('Erro na busca');

    }

});

app.get('/relatorio-emprestimos', async (req, res) => {

    try {

        const relatorio = await db.collection('emprestimos').aggregate([

            {
                $group: {

                    _id: '$titulo',

                    totalEmprestimos: {
                        $sum: 1
                    }

                }

            },

            {
                $sort: {
                    totalEmprestimos: -1
                }
            }

        ]).toArray();

        let conteudo = `

            <h1>Relatório de Empréstimos</h1>

        `;

        relatorio.forEach(item => {

            conteudo += `

                <div class="livro">

                    <strong>Livro:</strong>
                    ${item._id}

                    <br>

                    <strong>Total de Empréstimos:</strong>
                    ${item.totalEmprestimos}

                </div>

            `;

        });

        res.send(
            pagina('Relatório', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        res.send('Erro no relatório');

    }

});
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
})