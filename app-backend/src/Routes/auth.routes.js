const { authCtrl } = require("../controllers/auth.controller");
var crypto = require("crypto");
const express = require("express");
const { check } = require("express-validator");
var db = require("../middleware/database");
const { validarCampos } = require("../middleware/formValidation");

const router = express.Router();

//POST
router.post(
  "/login",
  /*    [
    check("email", "El correo es obligatorio").not().isEmpty(),
    check("email", "El email ingresado no es válido").isEmail(),
    check("password", "La contraseña es obligatoria").not().isEmpty(),
    validarCampos,
  ],  */
  authCtrl.login
);

router.get("/register", (req, res) => {
  //función para registrar al usuario que será coordinador en el sistema, se debe ejecutar una unica vez, y luego no se modifica más.
  crypto.randomBytes(16, (err, salt) => {
    if (err) {
      return res.status(400).json({
        err,
        msg: "error1",
      });
    }
    const newSalt = salt.toString("base64");
    crypto.pbkdf2("ovalleturismo538", newSalt, 1000, 64, "sha1", (err, key) => {
      if (err) {
        return res.status(400).json({
          err,
          msg: "error2",
        });
      }
      const encryptPass = key.toString("base64");
      db.query(
        `INSERT INTO AdminApp(idAdmin,email,password_hash,password_salt) VALUES(1, 'Appovalleturismo@gmail.com','${encryptPass}','${newSalt}')`
      )
        .then(() => {
          return res.status(200).json({
            msg: "usuario registrado",
          });
        })
        .catch((err) => {
          return res.status(400).json({
            err,
            msg: "error4",
          });
        });
    });
  });
});

router.post("/logout", authCtrl.logout);

module.exports = router;
