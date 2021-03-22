const { authCtrl } = require("../controllers/news.controller");
const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { validarCampos } = require("../middleware/formValidation");

//GET
router.get("/getNews", authCtrl.getNews);
router.get("/getDataNews/:idNews", authCtrl.getDataNews);
router.get("/getNewsApp", authCtrl.getNewsApp);

//POST
router.post(
  "/news",
  /* [
    check("title", "El titulo de la noticia es obligatorio").not().isEmpty(),
    validarCampos,
  ], */
  authCtrl.news
);
router.post(
  "/postNews",
  [
    check("title", "El titulo de la noticia es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  authCtrl.postNews
);

//PUT
router.put(
  "/updateNews/:idNews",
  /* [
    check("title", "El titulo de la noticia es obligatorio").not().isEmpty(),
    validarCampos,
  ], */
  authCtrl.updateNews
);
router.put("/updateStateNews/:idNews", authCtrl.updateStateNews);

//DELETE
router.delete("/deleteNews/:idNews", authCtrl.deleteNews);

module.exports = router;
