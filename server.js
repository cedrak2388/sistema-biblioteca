// ========================================
// CONSTANTES
// ========================================
const COLECOES = {

    LIVROS: 'livros',

    USUARIOS: 'usuarios',

    EMPRESTIMOS: 'emprestimos'

};
const STATUS = {

    DISPONIVEL: 'disponivel',

    EMPRESTADO: 'emprestado',

    ATIVO: 'ativo',

    DEVOLVIDO: 'devolvido'

};
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
        const livros = db.collection(COLECOES.LIVROS);
        
    }   catch (erro) {
        console.log('Erro ao conectar:', erro);
    }
}

conectarMongo();

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
function menu() {

    return `

    <nav>

        <a href="/dashboard">Dashboard</a>

        <a href="/cadastrar-livro">
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

        <a href="/">
            Sair
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

function mensagem(titulo, texto, destino = '/dashboard') {

    return pagina(

        titulo,

        `

        <h2>${titulo}</h2>

        <p>${texto}</p>

        <br>

        <a href="${destino}">

            Voltar

        </a>

        `

    );

}

app.use(express.static('public'));

// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================
app.post('/login', async (req, res) => {

    try {

        const { usuario, senha } = req.body;
        
        const admin = await db.collection(COLECOES.USUARIOS).findOne({
            usuario,
            senha
        });

        if (admin) {

            res.redirect('/dashboard');

        } else {

            return res.send(

    mensagem(

        'Aviso',

        'Usuário ou senha inválidos',

        '/login.html'

    )

);

        }

    } catch (erro) {

        console.log(erro);

        return res.send(

    mensagem(

        'Aviso',

        'Erro no login',

        '/login.html'

    )

);

    }

});

app.get('/', (req, res) => {

    res.redirect('/login.html');

});

// ========================================
// ROTAS DE LIVROS
// ========================================
app.get('/livros', async (req, res) => {

    try {

        const livros = await db.collection(COLECOES.LIVROS).find().toArray();

        let conteudo = `

            <h1>Lista de Livros</h1>

        `;

        livros.forEach(livro => {

            conteudo += `

    <div class="livro">

        <div class="cabecalho-livro">

            <div>

                <strong>Título:</strong>
                ${livro.titulo}

            </div>

            <div class="acoes-livro">

                <a href="/editar-livro/${livro._id}">

                    <button type="button">

                        Editar

                    </button>

                </a>

                ${livro.status === STATUS.DISPONIVEL ? `

                <form action="/emprestar-livro/${livro._id}" method="POST">

                    <button type="submit">

                        Emprestar

                    </button>

                </form>

                ` : `

                <span>

                    Já emprestado

                </span>

                `}

                <form action="/deletar-livro/${livro._id}" method="POST">

                    <button type="submit">

                        Excluir

                    </button>

                </form>

            </div>

        </div>

        <br>

        <strong>Autor:</strong>
        ${livro.autor}

        <br>

        <strong>Status:</strong>
        ${livro.status === STATUS.DISPONIVEL

            ? '✅ Disponível'

            : '📕 Emprestado'

}

    </div>

`;

        });

        res.send(
            pagina('Livros', conteudo)
        );

    } catch (erro) {

        console.log(erro);

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao buscar livros'

    )

);

    }

});

app.get('/livros-disponiveis', async (req, res) => {

    try {

        const livros = await db.collection(COLECOES.LIVROS).find({

            status: STATUS.DISPONIVEL

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

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao buscar livros disponíveis'

    )

);

    }

});

app.get('/cadastrar-livro', (req, res) => {

    let conteudo = `

        <h1>Cadastrar Livro</h1>

        <form action="/cadastrar-livro" method="POST">

            <label>Título:</label>

            <input 
                type="text"
                name="titulo"
                required
            >

            <label>Autor:</label>

            <input 
                type="text"
                name="autor"
                required
            >

            <button type="submit">

                Cadastrar

            </button>

        </form>
 
    `;

    res.send(
        pagina('Cadastrar Livro', conteudo)
    );

});

app.post('/cadastrar-livro', async (req, res) => {

    try {

        const { titulo, autor } = req.body;

        const livros = db.collection(COLECOES.LIVROS);

        await livros.insertOne({
            titulo,
            autor,
            status: STATUS.DISPONIVEL
        });

        return res.send(

    mensagem(

        'Aviso',

        'Livro cadastrado com sucesso'

    )

);

    } catch (erro) {

        console.log(erro);

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao cadastrar livro'

    )

);

    }

});

app.get('/editar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const livro = await db.collection(COLECOES.LIVROS).findOne({

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

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao abrir edição'

    )

);

    }

});

app.post('/editar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const { titulo, autor } = req.body;

        await db.collection(COLECOES.LIVROS).updateOne(

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

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao editar livro'

    )

);

    }

});

app.post('/deletar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        await db.collection(COLECOES.LIVROS).deleteOne({
            _id: new ObjectId(id)
        });

        res.redirect('/livros');

    } catch (erro) {

        console.log(erro);

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao deletar livro'

    )

);

    }

});

// ========================================
// ROTAS DE EMPRÉSTIMOS
// ========================================
app.post('/emprestar-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const livros = db.collection(COLECOES.LIVROS);

        const emprestimos = db.collection(COLECOES.EMPRESTIMOS);

        const livro = await livros.findOne({
            _id: new ObjectId(id)
        });

        const emprestimoExistente = await db.collection(COLECOES.EMPRESTIMOS).findOne({

    titulo: livro.titulo,

    status: STATUS.ATIVO

});

if (emprestimoExistente) {

    return res.send(

    mensagem(

        'Aviso',

        'Livro já está emprestado',

        '/livros'

    )

);

}

        await livros.updateOne(

            { _id: new ObjectId(id) },

            {
                $set: {
                    status: STATUS.EMPRESTADO
                }
            }

        );

        await emprestimos.insertOne({

            livroId: livro._id,

            titulo: livro.titulo,

            usuario: 'admin',

            dataEmprestimo: new Date(),

            status: STATUS.ATIVO

        });

        res.redirect('/livros');

    } catch (erro) {

        console.log(erro);

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao emprestar livro'

    )

);

    }

});

app.get('/emprestimos-ativos', async (req, res) => {

    try {

        const emprestimos = await db.collection(COLECOES.EMPRESTIMOS).find({

            status: STATUS.ATIVO

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

                    <br><br>

                    <form action="/devolver-livro/${emprestimo._id}" method="POST">

                        <button type="submit">

                        Devolver Livro

                        </button>

                    </form>

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

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao buscar empréstimos'

    )

);

    }

});

app.post('/devolver-livro/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const emprestimo = await db.collection(COLECOES.EMPRESTIMOS).findOne({

            _id: new ObjectId(id)

        });

        if (emprestimo.status === 'devolvido') {

            return res.send(

    mensagem(

        'Aviso',

        'Livro já devolvido'

    )

);

        }

        if (!emprestimo) {

            return res.send(

    mensagem(

        'Aviso',

        'Empréstimo não encontrado'

    )

);

        }

        await db.collection(COLECOES.EMPRESTIMOS).updateOne(

            {

                _id: new ObjectId(id)

            },

            {

                $set: {

                    status: STATUS.DEVOLVIDO

                }

            }

        );

        await db.collection(COLECOES.LIVROS).updateOne(

            {

                titulo: emprestimo.titulo

            },

            {

                $set: {

                    status: STATUS.DISPONIVEL

                }

            }

        );

        res.redirect('/emprestimos-ativos');

    } catch (erro) {

        console.log(erro);

        return res.send(

    mensagem(

        'Aviso',

        'Erro ao devolver livro'

    )

);

    }

});

// ========================================
// RELATÓRIOS E CONSULTAS
// ========================================
app.get('/dashboard', async (req, res) => {

    try {

        const totalLivros = await db.collection(COLECOES.LIVROS).countDocuments();

        const livrosDisponiveis = await db.collection(COLECOES.LIVROS).countDocuments({

            status: STATUS.DISPONIVEL

        });

        const livrosEmprestados = await db.collection(COLECOES.LIVROS).countDocuments({

            status: STATUS.EMPRESTADO

        });

        const emprestimosAtivos = await db.collection(COLECOES.EMPRESTIMOS).countDocuments({

            status: STATUS.ATIVO

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

        return res.send(

    mensagem(

        'Aviso',

        'Erro no dashboard'

    )

);

    }

});

app.get('/relatorio-emprestimos', async (req, res) => {

    try {

        const relatorio = await db.collection(COLECOES.EMPRESTIMOS).aggregate([

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

        return res.send(

    mensagem(

        'Aviso',

        'Erro no relatório'

    )

);

    }

});

app.get('/buscar-livro', async (req, res) => {

    try {

        const termo = req.query.termo || '';

        let livros = [];

        if (termo !== '') {

            livros = await db.collection(COLECOES.LIVROS).find({

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

        return res.send(

    mensagem(

        'Aviso',

        'Erro na busca'

    )

);

    }

});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
})