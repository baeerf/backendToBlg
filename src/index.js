require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

//===== Configura para express reconhecer o JSON
//===== Use do cors

app.use(express.json());
app.use(cors());

//=== Rota aberta - Open Route

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vindo ao blog!" });
});

//=== Verifica se o usuário existe

const user = await User.findById(id, "-password");

if (!user) {
  return res.status(404).json({ msg: "Usuário não encontrado" });
}

res.status(200).json({ user });

//==== Models

const User = require("./models/User");
const Messages = require("./models/Posts");

//=== Verifica o token

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado!" });
  }

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    next();
  } catch (err) {
    res.status(400).json({ msg: "Token invalid" });
  }
}

//=== Pega todas as mensagens

app.get("/get/allMessages", async (req, res) => {
  const messages = await Messages.find();

  try {
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ warning: "deu bbiziu" });
  }
});

//=== Pega todos os usuários

app.get("/get/allUsers", async (req, res) => {
  const user = await User.find();

  try {
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ warning: "deu biziu" });
  }
});

//=== Register usuário

app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  //==== Validação

  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório" });
  }
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória" });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "As senhas não conferem" });
  }

  //=== Ve se ja existe algum usuário cadastro com esse email

  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
  }

  //==== Cria senha

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const userSave = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await userSave.save();

    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ msg: "Erro interno no servidor, tente novamente mais tarde" });
  }
});

//==== Login

app.post("/auth/login", async (req, res) => {
  const { name, password } = req.body;

  //=== Validação

  if (!name) {
    return res.status(422).json({ msg: "O username é obrigatóro" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória" });
  }

  //==== Ve se o usuário existe

  const user = await User.findOne({ name: name });

  if (!user) {
    return res.status(422).json({ msg: "Usuário não encontrado ou incorreto" });
  }

  //=== Ve se a senha é valida - coincide

  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha incorreta" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({ msg: "Autenticação realizada com sucesso", token });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ msg: "Erro interno no servidor, tente novamente mais tarde" });
  }
});

app.post("/create/msg", async (req, res) => {
  const { name, idFrom, idTo, msg } = req.body;

  if (!name) {
    return res.status(422).json({ msg: "Nome undefined" });
  }
  if (!idFrom) {
    return res.status(422).json({ msg: "IdFrom undefined" });
  }
  if (!idTo) {
    return res.status(422).json({ msg: "IdTo undefined" });
  }
  if (!msg) {
    return res.status(422).json({ msg: "Mensagem undefined" });
  }

  const messageSave = new Messages({
    name,
    idFrom,
    idTo,
    msg,
  });

  try {
    await messageSave.save();

    res.status(201).json({ msg: "tudo ok" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "deu biziu" });
  }
});

//== Conexão com o banco

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPass}@cluster0.qyoyd9j.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Database connected");
    app.listen(3030);
  })
  .catch((err) => console.log(err));
