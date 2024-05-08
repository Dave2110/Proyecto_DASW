"use strict;";
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const randomize = require("randomatic");
const cors = require("cors");
mongoose.set("strictQuery", true);

const app = express();
const port = 3000;

app.use(express.json());
app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

/* Conexión con base de datos */
let mongoConnection = process.env.MONGO_URI;
mongoose.connect(mongoConnection);

const db = mongoose.connection;

db.on(
  "error",
  console.error.bind(console, "Error de conexión a la base de datos:")
);
db.once("open", () => {
  console.log("Conexión exitosa a la base de datos");
});

/* USER */
let userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  pass: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
});

let NFTSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  precio: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  rareza: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
});
let CarritoSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  nftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NFT",
    required: true,
  },
  cantidad: {
    type: Number,
    default: 1,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

let User = mongoose.model("users", userSchema);
let NFT = mongoose.model("nfts", NFTSchema);
let Carrito = mongoose.model("carritos", CarritoSchema);

/*USERS */
app.get("/api/users", (req, res) => {
  User.find(
    {
      email: { $regex: req.query.email },
    },
    function (err, docs) {
      res.status(200);
      res.send(docs);
    }
  );
});

app.post("/api/users", (req, res) => {
  if (req.body.email == undefined) {
    res.status(400);
    res.send("No se agregó email");
    return;
  }
  if (req.body.pass == undefined) {
    res.status(400);
    res.send("No se agregó contraseña");
    return;
  }
  User.find({
    email: req.body.email,
  }).then((docs) => {
    if (docs.length != 0) {
      res.status(400);
      res.send("Email ya registrado");
      return;
    }
    let hash = bcrypt.hashSync(req.body.pass, 10);
    req.body.email = req.body.email.toLowerCase();
    let email = req.body.email;
    let newUser = { email: email, pass: hash };
    let user = User(newUser);

    user.save();
    res.status(200);
    res.send("Usuario agregado con exito");
  });
});

/* NFTS */
app.post("/api/nfts", (req, res) => {
  const { nombre, precio, descripcion, rareza, imageUrl } = req.body;

  if (!nombre || !precio || !descripcion || !rareza || !imageUrl) {
    res.status(400).send("Todos los campos son obligatorios");
    return;
  }

  const newNFT = new NFT({
    nombre,
    precio,
    descripcion,
    rareza,
    imageUrl,
  });

  newNFT
    .save()
    .then((doc) => {
      res.status(201).json({
        message: "NFT creado exitosamente",
        nft: doc,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error al guardar el NFT");
    });
});

app.get("/api/nfts", (req, res) => {
  const { nombre, rareza } = req.query;
  let queryConditions = {};
  if (nombre) {
    queryConditions.nombre = { $regex: new RegExp(nombre, "i") };
  }
  if (rareza) {
    queryConditions.rareza = { $regex: new RegExp(rareza, "i") };
  }

  NFT.find(queryConditions)
    .then((docs) => {
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error en el servidor");
    });
});

app.get("/api/nfts/:nftId", (req, res) => {
  const nftId = req.params.nftId;

  NFT.findById(nftId)
    .then((nft) => {
      if (!nft) {
        return res.status(404).json({ message: "NFT no encontrado" });
      }
      res.status(200).json(nft);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error en el servidor");
    });
});

/* Carrito*/
app.post("/api/carritos", authenticator, (req, res) => {
  const { userId, nftId, cantidad } = req.body;

  Carrito.findOne({ userId, nftId }).then((existingCartItem, err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error al buscar en el carrito");
    }

    if (existingCartItem) {
      existingCartItem.cantidad += cantidad;
      existingCartItem
        .save()
        .then((updatedCartItem) => {
          res.status(200).json({
            message: "Cantidad actualizada en el carrito exitosamente",
            carrito: updatedCartItem,
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Error al actualizar la cantidad en el carrito");
        });
    } else {
      const newCartItem = new Carrito({
        userId,
        nftId,
        cantidad,
      });

      newCartItem
        .save()
        .then((doc) => {
          res.status(201).json({
            message: "Elemento agregado al carrito exitosamente",
            carrito: doc,
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Error al agregar elemento al carrito");
        });
    }
  });
});

app.get("/api/carritos/:userId", authenticator, (req, res) => {
  const userId = req.params.userId;

  Carrito.find({ userId })
    .then((docs) => {
      res.status(200).json(docs);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error al obtener elementos del carrito");
    });
});

app.delete("/api/carritos/:carritoId", authenticator, (req, res) => {
  const carritoId = req.params.carritoId;

  Carrito.findByIdAndDelete(carritoId)
    .then(() => {
      res.status(200).send("Elemento eliminado del carrito exitosamente");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error al eliminar elemento del carrito");
    });
});

/* LOGIN */
app.post("/api/login", (req, res) => {
  if (!req.body.email) {
    res.status(400);
    res.send("No se agregó email");
    return;
  }
  if (!req.body.pass) {
    res.status(400);
    res.send("No se agregó contraseña");
    return;
  }

  User.find({
    email: req.body.email,
  }).then((docs) => {
    if (docs.length === 0) {
      res.status(401);
      res.send("Email incorrecto");
      return;
    }

    if (!bcrypt.compareSync(req.body.pass, docs[0].pass)) {
      res.status(401);
      res.send("Contraseña incorrecta");
      return;
    }

    let jObject = docs[0];

    if (jObject.token == undefined) {
      jObject.token = randomize("Aa0", "10") + "-" + jObject._id;
      let objectToUpdate = {
        _id: jObject._id,
        email: jObject.email,
        pass: jObject.pass,
        token: jObject.token,
      };

      User.findByIdAndUpdate(jObject._id, objectToUpdate, { new: true }).then(
        (err, doc) => {
          if (err) {
            res.send(err);
          } else {
            res.status(200);
            res.send(doc.token);
            return;
          }
        }
      );
    } else {
      User.findById(jObject._id).then((err, doc) => {
        if (err) {
          res.send(err);
        } else {
          res.status(200);
          res.send(doc.token);
          return;
        }
      });
    }
  });
});

/* AUTH */
function authenticator(req, res, next) {
  let token = req.get("x-user-token");

  if (token) {
    User.find({
      token: token,
    }).then((doc, err) => {
      if (err) {
        res.send(err);
      } else {
        if (doc.length == 0) {
          res.status(401);
          res.send("Usuario no autenticado");
          return;
        } else {
          next();
        }
      }
    });
  } else {
    return res.status(401).send("Usuario no autenticado");
  }
}

app.listen(port, () => {
  console.log("Aplicacion corriendo en puerto " + port);
});
