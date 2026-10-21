import express from 'express';
import cors from 'cors';
import 'dotenv/config';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.port || 5500;
const modelo = 'openai/gpt-oss-120b';

const url_api = process.env.url_api || "https://api.groq.com/openai/v1/chat/completions";

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const user = [];

app.get('/', (req, res)=>{
    return res.json(user);
})

app.post('/cadastro', (req, res)=>{
    const {usuario, email, senha} = req.body;

    if (!usuario || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    if (senha.length < 6) {
        return res.status(400).json({
            erro: "A senha deve ter 6 caracteres ou mais"
        });
    }

    const emailUsado = user.find((busca) => busca.email === email);

    if (emailUsado) {
        return res.status(409).json({
            erro: "Email já está em uso"
        });
    }

    console.log("Usuários no sistema:", usuarios);

    user.push({usuario, email, senha});

    return res.status(201).json({mensagem: "Cadastrado com Sucesso!"});
});

app.post('/login', (req, res)=>{
    const {email, senha} = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({erro:"Preencha todos os campos"});
    }

    const emailExiste = user.find((busca)=> busca.email.toLowerCase() === email.toLowerCase());

    if (!emailExiste || emailExiste.senha != senha) {
        return res.status(400).json({erro:"Email ou senha incorretos"});
    }

    return res.status(201).json({
        mensagem: "Login realizado com Sucesso!",
        usuario: emailExiste.usuario
    });
})

app.post('/chat', async (req, res)=>{
    try {
        const api_key = process.env.api_key;
        const historico = req.body.historico || [];

        const persona = [
            {
                "role": "system",
                "content": "Você é Tony Stark, responda como um bilhonario de forma curta e objetiva"
            }
        ];

        persona.push(...historico);

        const respostaBruta = await fetch(url_api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${api_key}`
            },
            body: JSON.stringify({
                model: modelo,
                messages: persona
            })
        });

        const resultado = await respostaBruta.json();

        if (!respostaBruta.ok) {
            console.log(" Erro retornado pela Groq:", resultado);
            return res.status(500).json({ erro: "Erro na comunicação com a Groq." });
        }

        return res.json({resposta: resultado.choices[0].message.content});
    } catch (erro) {
        return res.status(500).json({erro: "Falha interna no servidor."});
    }
});

app.listen(PORT, ()=>{
    console.log(`Servidor rodando na porta ${PORT}`);
});