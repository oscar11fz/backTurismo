const mysqlConnection = require("../middleware/database");
const fs = require("fs");
const { google } = require("googleapis");
const GDriveUtil = require("gdrive-utils");
const credentials = require("../../credentialsDrive.json");
const auth_token = require("../../tokenDrive.json");

var gdriveUtil = new GDriveUtil(credentials, auth_token);

const authCtrl = {};

function googleValidation() {
  //Retorna el OA2Client de la credenciale y token
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  oAuth2Client.setCredentials(gdriveUtil.oauth2Client.credentials);
  return oAuth2Client;
}

authCtrl.postNews = async (req, res) => {
  //Sube un archivo al drive en la carpeta Eventos
  if (!req.files) {
    res.send({
      status: false,
      message: "No file uploaded",
    });
  } else {
    let File = req.files.picture;
    await File.mv("./tmp/" + File.name);
    var idCarpeta = "1ZG7hMzi-5JpyPMFDs_ZynReZ3Ny3R4_X";
    let auth = googleValidation();
    let fileMetadata = {
      name: req.files.picture.name,
      parents: [idCarpeta],
    };

    let media = {
      mimeType: [`${File.mimetype}`],
      body: fs.createReadStream(`./tmp/${req.files.picture.name}`),
    };
    const drive = google.drive({ version: "v3", auth });
    drive.files.create(
      {
        resource: fileMetadata,
        media: media,
        fields: "id",
      },
      (err, file) => {
        if (!err) {
          const { title, body } = req.body;
          let idOld = file.data.id;
          let name = req.files.picture.name;
          let admin = 1;
          if (idOld != "undefined") {
            fs.unlinkSync(`./tmp/${name}`);
            return mysqlConnection
              .query(
                `INSERT INTO News(fecha,title,picture,body,StateEvent,idAdmin) 
        VALUES(CURDATE(),?,?,?,false,?)`,
                [title, file.data.id, body, admin]
              )

              .then(
                async function (response) {
                  res.status(200).json({
                    data: { title, body },
                    msg: "Se a guardado con exito!",
                    file: file.data.id,
                  });
                },
                function (err) {
                  return res.status(400).json({
                    errors: [{ msg: "Deletion Failed for some reason" }],
                  });
                }
              );
          } else {
            fs.unlinkSync(`./tmp/${req.body.nameFile}`);
            return mysqlConnection
              .query(
                `INSERT INTO News(fecha,title,picture,body,StateEvent,idAdmin) 
        VALUES(CURDATE(),?,?,?,false,?)`,
                [title, file.data.id, body, admin]
              )
              .then(() => {
                res.status(200).json({ message: "Exito", file: file.data.id });
              })
              .catch((err) => {
                res.status(400).json({ message: "Error", error: err });
              });
          }
        } else {
          res.status(400).json({ message: "Error", error: err });
        }
      }
    );
  }
};

//función encargada de insertar los datos de las noticias enviados desde el front
authCtrl.news = async (req, res) => {
  try {
    req.body = JSON.parse(req.body.data);
    const { title, body, picture } = req.body;
    const admin = 1;
    await mysqlConnection
      .query(
        `INSERT INTO News(fecha,title,picture,body,StateEvent,idAdmin) 
        VALUES(CURDATE(),?,?,?,false,?)`,
        [title, picture, body, admin]
      )
      .then(() => {
        res.status(200).json({
          msg: "Noticia cargada exitosamente.",
        });
      })
      .catch((err) => {
        res.status(400).json({
          msg: "Ocurrió un error al cargar la noticia.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas para recibir los datos enviados.",
    });
  }
};

//get para obtener todas las noticias
authCtrl.getNews = async (req, res) => {
  try {
    await mysqlConnection
      .query(
        `SELECT idNews, title, body, picture,DATE_FORMAT(fecha,"%d-%m-%Y") as fecha, StateEvent 
        FROM News 
        ORDER BY fecha DESC`
      )
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al obtener las noticias.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener las noticias.",
    });
  }
};

//obtiene los datos pertenecientes a la noticia seleccionada en el front.
authCtrl.getDataNews = async (req, res) => {
  try {
    // req.body = JSON.parse(req.body.data);
    const { idNews } = req.params;
    await mysqlConnection
      .query(
        `SELECT idNews, title, body, picture,DATE_FORMAT(fecha,"%d-%m-%Y") as fecha, StateEvent 
        FROM News 
        WHERE idNews = ? `,
        [idNews]
      )
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al mostrar la noticia seleccionada.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener las noticias.",
    });
  }
};

//Actualiza los datos de la noticia seleccionada en el front
authCtrl.updateNews = async (req, res) => {
  if (!req.files) {
    const { idNews } = req.params;
    const { title, body } = req.body;
    return mysqlConnection
      .query(
        `Update News 
        SET title = ?, body = ?, fecha = CURDATE()
        WHERE idNews = ?`,
        [title, body, idNews]
      )

      .then(
        async function (response) {
          res.status(200).json({
            data: { title, body },
            msg: "Se a guardado con exito!",
          });
        },
        function (err) {
          return res.status(400).json({
            errors: [{ msg: "Deletion Failed for some reason" }],
          });
        }
      );
  } else {
    let File = req.files.picture;
    await File.mv("./tmp/" + File.name);
    var idCarpeta = "1ZG7hMzi-5JpyPMFDs_ZynReZ3Ny3R4_X";
    let auth = googleValidation();
    let fileMetadata = {
      name: req.files.picture.name,
      parents: [idCarpeta],
    };

    let media = {
      mimeType: [`${File.mimetype}`],
      body: fs.createReadStream(`./tmp/${req.files.picture.name}`),
    };
    const drive = google.drive({ version: "v3", auth });
    drive.files.create(
      {
        resource: fileMetadata,
        media: media,
        fields: "id",
      },
      (err, file) => {
        if (!err) {
          const { idNews } = req.params;
          const { title, body } = req.body;
          let idOld = file.data.id;
          let name = req.files.picture.name;
          let admin = 1;
          if (idOld != "undefined") {
            fs.unlinkSync(`./tmp/${name}`);
            return mysqlConnection
              .query(
                `Update News 
        SET title = ?, body = ?, picture = ?, fecha = CURDATE()
        WHERE idNews = ?`,
                [title, body, file.data.id, idNews]
              )

              .then(
                async function (response) {
                  res.status(200).json({
                    data: { title, body },
                    msg: "Se a guardado con exito!",
                    file: file.data.id,
                  });
                },
                function (err) {
                  return res.status(400).json({
                    errors: [{ msg: "Deletion Failed for some reason" }],
                  });
                }
              );
          } else {
            fs.unlinkSync(`./tmp/${req.body.nameFile}`);
            return mysqlConnection
              .query(
                `Update News 
        SET title = ?, body = ?, picture = ?,fecha = CURDATE()
        WHERE idNews = ?`,
                [title, body, file.data.id, idNews]
              )
              .then(() => {
                res.status(200).json({ message: "Exito", file: file.data.id });
              })
              .catch((err) => {
                res.status(400).json({ message: "Error", error: err });
              });
          }
        } else {
          res.status(400).json({ message: "Error", error: err });
        }
      }
    );
  }
};

//Actualiza el estado de publicado o no, de la noticia seleccionada
authCtrl.updateStateNews = async (req, res) => {
  try {
    // req.body = JSON.parse(req.body.data);
    const { idNews } = req.params;
    await mysqlConnection
      .query(
        `Update News 
        SET StateEvent = not StateEvent
        WHERE idNews = ?`,
        [idNews]
      )
      .then(() => {
        res.status(200).json({
          msg: "Cambio de estado de la noticia editado exitosamente.",
        });
      })
      .catch((error) => {
        res.status(400).json({
          msg:
            "Ocurrió un error al actualizar el estado de publicación de la noticia.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener las noticias.",
    });
  }
};

authCtrl.deleteNews = async (req, res) => {
  try {
    //req.body = JSON.parse(req.body.data);
    const { idNews } = req.params;
    await mysqlConnection
      .query(
        `DELETE FROM News         
         WHERE idNews = ?`,
        [idNews]
      )
      .then(() => {
        res.status(200).json({
          msg: "Noticia eliminada exitosamente.",
        });
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al borrar la noticia.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener las noticias.",
    });
  }
};

//Selecciona las noticias que esten publicadas, establecido con el estado en true
authCtrl.getNewsApp = async (req, res) => {
  try {
    await mysqlConnection
      .query(
        `SELECT idNews, title, body, picture,DATE_FORMAT(fecha,"%d-%m-%Y") as fecha, StateEvent 
        FROM News 
        WHERE StateEvent = true
        ORDER BY fecha DESC`
      )
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al obtener las noticias.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener las noticias.",
    });
  }
};

module.exports = {
  authCtrl,
};
