const { authCtrl } = require("../controllers/user.controller");
const express = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../middleware/formValidation");

const router = express.Router();

//GET
router.get("/getComment", authCtrl.getComment);

//POST
router.post(
  "/comment",
  [
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("email", "El correo es obligatorio").not().isEmpty(),
    check("coment", "Debe añadir un comentario").not().isEmpty(),
    validarCampos,
  ],
  authCtrl.Comment
);

module.exports = router;
