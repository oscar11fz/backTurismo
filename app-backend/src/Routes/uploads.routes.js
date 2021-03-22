const { authCtrl } = require("../controllers/uploads.controller");
const express = require("express");
const { check } = require("express-validator");
const { validarCampos } = require("../middleware/formValidation");

const router = express.Router();

//GET

//POST
router.post("/uploads", authCtrl.UpFileNews);

module.exports = router;
