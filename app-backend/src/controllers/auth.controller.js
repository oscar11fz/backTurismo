const mysqlConnection = require("../middleware/database");
var crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config.json");
const authCtrl = {};

const signToken = (email) => {
  return jwt.sign(
    {
      email,
    },
    config["secret-token"],
    {
      expiresIn: 60 * 60 * 24, // 24 hrs
    }
  );
};

authCtrl.login = async (req, res) => {
  try {
    req.body = JSON.parse(req.body.data);
    const { email, password } = req.body;

    await mysqlConnection
      .query("SELECT * FROM AdminApp as ad WHERE ad.email = ?", email)
      .then((user) => {
        crypto.pbkdf2(
          password,
          user[0].password_salt,
          1000,
          64,
          "sha1",
          (err, key) => {
            const encryptPassword = key.toString("base64");
            if (user[0].password_hash === encryptPassword) {
              const token = signToken(user.email);
              return res.status(200).json({
                token: token,
                user: {
                  email: user[0].email,
                },
                msg: "Exito al ingresar",
              });
            }
            res.status(400).json({
              msg: "usuario y/o constraseña incorrecta",
              error: err,
            });
          }
        );
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Usuario y/o Contraseña incorrectas",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrio un error en el servidor",
      error: "Problemas para recibir los datos enviados",
    });
  }
};

authCtrl.logout = (req, res) => {
  res.status(200).json({
    msg: "Sesión terminada",
    status: true,
  });
};

module.exports = {
  authCtrl,
};
