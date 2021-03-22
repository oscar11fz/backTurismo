const mysqlConnection = require("../middleware/database");

const authCtrl = {};

authCtrl.Comment = async (req, res) => {
  try {
    // req.body = JSON.parse(req.body.data);
    const { nombre, email, coment } = req.body;
    const admin = 1;
    await mysqlConnection
      .query(
        `INSERT INTO Userr(nombre,email,coment,fecha,idAdmin) VALUES (?,?,?,CURDATE(),?)`,
        [nombre, email, coment, admin]
      )
      .then(() => {
        res.status(200).json({
          msg: "Comentario ingresado exitosamente.",
        });
      })
      .catch((err) => {
        res.status(400).json({
          msg: "Ocurrió un error al ingresar el comentario.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: error,
    });
  }
};

authCtrl.getComment = async (req, res) => {
  try {
    await mysqlConnection
      .query(
        `SELECT idUser, nombre, email, coment,DATE_FORMAT(fecha,"%d-%m-%Y") as fecha FROM Userr ORDER BY fecha DESC`
      )
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al obtener los comentarios.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener los comentarios.",
    });
  }
};

module.exports = {
  authCtrl,
};
