const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

//CONFIGURAÇÕES

//CHAVE SECRETA para assinar os tokens JWT.

const JWT_SECRET = 'chave_secreta_e_aleatoria_12345';

//Middleware para permitir que o Express entenda JSON no corpo das requisições
app.use(express.json());

//BANCO DE DADOS SIMULADO (Em memória)

const usersMockDb = [
    {
        id: 1,
        email: 'usuario@teste.com',
        //Em um banco real, a senha estaria "hasheada"
        password: '123456', 
        name: 'Amanda da Silva',
        createdAt: '2023-01-15T10:30:00Z'
    },
    {
        id: 2,
        email: 'outro@teste.com',
        password: 'abcdef',
        name: 'Carla Santos',
        createdAt: '2023-05-20T14:00:00Z'
    }
];

//MIDDLEWARE DE AUTENTICAÇÃO

function authenticateToken(req, res, next) {
    
    const authHeader = req.headers['authorization'];
    
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        //Se não houver token, retorna 401
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) {
            //Se o token for inválido ou expirado, retorna 403
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }

        //Se o token for válido, anexamos os dados do usuário ao objeto da requisição (req)
        
        req.user = userPayload;
        
        //Passa para a próxima função
        next();
    });
}

//ROTAS

//Rota de LOGIN (Auxiliar, apenas para gerar o token para teste)
//POST http://localhost:3000/login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    //Procura o usuário no "banco de dados"
    const user = usersMockDb.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    //Se o usuário existe, cria o payload
    const payload = { id: user.id, email: user.email };

    //Gera o token assinado
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token: token });
});

//A ROTA SOLICITADA
//Consultar Perfil (GET)

app.get('/users/profile', authenticateToken, (req, res) => {
    
    const userIdFromToken = req.user.id;

    //Buscamos os dados completos do usuário no "banco de dados" usando o ID do token
    const completeUserData = usersMockDb.find(u => u.id === userIdFromToken);

    if (!completeUserData) {
        //Caso raro onde o token é válido, mas o usuário foi deletado do banco nesse meio tempo
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    //Montamos a resposta apenas com os dados básicos solicitados.
    
    const responseData = {
        name: completeUserData.name,
        email: completeUserData.email,
        createdAt: completeUserData.createdAt
    };

    res.json(responseData);
});

//INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`\nPara testar:`);
    console.log(`1. Faça POST em /login com {"email": "usuario@teste.com", "password": "123456"} para obter o token.`);
    console.log(`2. Copie o token.`);
    console.log(`3. Faça GET em /users/profile adicionando o Header 'Authorization: Bearer SEU_TOKEN_AQUI'.`);
});




