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

authCtrl.postEvents = async (req, res) => {
  //Sube un archivo al drive en la carpeta Eventos
  if (!req.files) {
    res.send({
      status: false,
      message: "No file uploaded",
    });
  } else {
    let File = req.files.picture;
    await File.mv("./tmp/" + File.name);
    /* var idCarpeta = "1ZG7hMzi-5JpyPMFDs_ZynReZ3Ny3R4_X"; */
    var idCarpeta = "1BYyABbnmrSqAyIkGGazBzI0t7wKhMtbI";
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
          const { title, descriptionEvent, dateInit } = req.body;
          let idOld = file.data.id;
          let name = req.files.picture.name;
          let admin = 1;
          if (idOld != "undefined") {
            fs.unlinkSync(`./tmp/${name}`);
            return mysqlConnection
              .query(
                `INSERT INTO Events(title, descriptionEvent,datePublication,dateInit,StateEvent,picture,idAdmin) 
        VALUES(?,?,CURDATE(),STR_TO_DATE(?, '%Y-%m-%d'),false,?,?)`,
                [title, descriptionEvent, dateInit, file.data.id, admin]
              )

              .then(
                async function (response) {
                  res.status(200).json({
                    data: { title, descriptionEvent, dateInit },
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
                `INSERT INTO Events(title, descriptionEvent,datePublication,dateInit,StateEvent,picture,idAdmin) 
        VALUES(?,?,CURDATE(),STR_TO_DATE(?, '%Y-%m-%d'),false,?,?)`,
                [title, descriptionEvent, dateInit, file.data.id, admin]
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

authCtrl.events = async (req, res) => {
  try {
    req.body = JSON.parse(req.body.data);
    const { title, descriptionEvent, dateInit, picture } = req.body;
    const admin = 1;
    await mysqlConnection
      .query(
        `INSERT INTO Events(title, descriptionEvent,datePublication,dateInit,StateEvent,picture,idAdmin) 
        VALUES(?,?,CURDATE(),?,false,?,?)`,
        [title, descriptionEvent, dateInit, picture, admin]
      )
      .then(() => {
        res.status(200).json({
          msg: "Panorama cargado exitosamente.",
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({
          msg: "Ocurrió un error al cargar el Evento.",
          //  error,
          err,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas para recibir los datos enviados.",
    });
  }
};

authCtrl.getEvents = async (req, res) => {
  try {
    await mysqlConnection
      .query(
        `SELECT idEvent, title, descriptionEvent,DATE_FORMAT(datePublication,"%d-%m-%Y") as datePublication, DATE_FORMAT(dateInit,"%d-%m-%Y") as dateInit ,picture,StateEvent 
        FROM Events 
        ORDER BY datePublication DESC`
      )
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al obtener los Panoramas.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener los Panoramas.",
    });
  }
};

//obtiene los datos pertenecientes a la noticia seleccionada en el front.
authCtrl.getDataEvent = async (req, res) => {
  try {
    // req.body = JSON.parse(req.body.data);
    const { idEvent } = req.body;
    await mysqlConnection
      .query(
        `SELECT idEvent, title, descriptionEvent,DATE_FORMAT(datePublication,"%d-%m-%Y") as datePublication,DATE_FORMAT(dateInit,"%d-%m-%Y") as dateInit,picture,StateEvent
        FROM Events 
        WHERE idEvent = ? `,
        [idEvent]
      )
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al mostrar el evento seleccionado.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener el panorama.",
    });
  }
};

//Actualiza los datos de la noticia seleccionada en el front
authCtrl.updateEvent = async (req, res) => {
  if (!req.files) {
    const { idEvent } = req.params;
    const { title, descriptionEvent, dateInit } = req.body;
    return mysqlConnection
      .query(
        `UPDATE Events 
        SET title = ?, descriptionEvent = ? ,  dateInit = ?, datePublication = CURDATE()
        WHERE idEvent = ?`,
        [title, descriptionEvent, dateInit, idEvent]
      )

      .then(
        async function (response) {
          res.status(200).json({
            data: { title, descriptionEvent, dateInit },
            msg: "Se a guardado con exito!",
          });
        },
        function (err) {
          return res.status(400).json({
            errors: [{ msg: err }],
          });
        }
      );
  } else {
    let File = req.files.picture;
    await File.mv("./tmp/" + File.name);
    /* var idCarpeta = "1ZG7hMzi-5JpyPMFDs_ZynReZ3Ny3R4_X"; */
    var idCarpeta = "1BYyABbnmrSqAyIkGGazBzI0t7wKhMtbI";
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
          const { idEvent } = req.params;
          const { title, descriptionEvent, dateInit } = req.body;
          console.log(idEvent, title, descriptionEvent, dateInit, file.data.id);
          let idOld = file.data.id;
          let name = req.files.picture.name;
          if (idOld != "undefined") {
            fs.unlinkSync(`./tmp/${name}`);
            return mysqlConnection
              .query(
                `UPDATE Events 
        SET title = ?, descriptionEvent = ?, picture = ? ,  dateInit = ?, datePublication = CURDATE()
        WHERE idEvent = ?`,
                [title, descriptionEvent, file.data.id, dateInit, idEvent]
              )

              .then(
                async function (response) {
                  res.status(200).json({
                    data: { title, descriptionEvent, dateInit },
                    msg: "Se a guardado con exito!",
                    file: file.data.id,
                  });
                },
                function (err) {
                  return res.status(400).json({
                    errors: [{ msg: err }],
                  });
                }
              );
          } else {
            fs.unlinkSync(`./tmp/${req.body.nameFile}`);
            return mysqlConnection
              .query(
                `UPDATE Events 
        SET title = ?, descriptionEvent = ?, picture = ? , dateInit =  = ? , datePublication = CURDATE()
        WHERE idEvent = ?`,
                [title, descriptionEvent, file.data.id, dateInit, idEvent]
              )
              .then(() => {
                res.status(200).json({ message: "Exito", file: file.data.id });
              })
              .catch((err) => {
                res.status(400).json({ message: "Error", error: err });
              });
          }
        } else {
          res.status(500).json({ message: "Error", error: err });
        }
      }
    );
  }
  /* try {
    // req.body = JSON.parse(req.body.data);
    const { idEvent, title, body, dateInit, picture } = req.body;
    await mysqlConnection
      .query(
        `UPDATE Events 
        SET title = ?, body = ?, picture = ? , dateInit = ?
        WHERE idEvent = ?`,
        [title, body, picture, dateInit, idEvent]
      )
      .then(() => {
        res.status(200).json({
          msg: "Evento actualizado exitosamente.",
        });
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al actualizar la información del evento.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener los eventos.",
    });
  } */
};

//Actualiza el estado de publicado o no, de la noticia seleccionada
authCtrl.updateStateEvent = async (req, res) => {
  try {
    // req.body = JSON.parse(req.body.data);
    const { idEvent } = req.params;
    await mysqlConnection
      .query(
        `UPDATE Events 
        SET StateEvent = not StateEvent
        WHERE idEvent = ?`,
        [idEvent]
      )
      .then(() => {
        res.status(200).json({
          msg: "Cambio de estado del evento editado exitosamente.",
        });
      })
      .catch((error) => {
        res.status(400).json({
          msg:
            "Ocurrió un error al actualizar el estado de publicación del evento.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener los eventos.",
    });
  }
};

authCtrl.deleteEvent = async (req, res) => {
  try {
    // req.body = JSON.parse(req.body.data);
    const { idEvent } = req.params;
    await mysqlConnection
      .query(
        `DELETE FROM Events         
         WHERE idEvent = ?`,
        [idEvent]
      )
      .then(() => {
        res.status(200).json({
          msg: "Evento eliminado exitosamente.",
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
authCtrl.getEventApp = async (req, res) => {
  try {
    await mysqlConnection
      .query(
        `SELECT idEvent, title, descriptionEvent, DATE_FORMAT(datePublication,"%d-%m-%Y") as datePublication ,DATE_FORMAT(dateInit,"%Y-%m-%d") as dateInit ,picture, StateEvent 
        FROM Events 
        WHERE StateEvent = true
        ORDER BY dateInit DESC`
      )
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(400).json({
          msg: "Ocurrió un error al obtener los eventos.",
          error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Ocurrió un error en el servidor.",
      error: "Problemas al obtener los eventos.",
    });
  }
};
module.exports = {
  authCtrl,
};
