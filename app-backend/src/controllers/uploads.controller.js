const mysqlConnection = require("../middleware/database");
const fs = require("fs");
const { google } = require("googleapis");
const GDriveUtil = require("gdrive-utils");
const credentials = require("../../credentialsDrive.json");
const auth_token = require("../../tokenDrive.json");
const { subirArchivo } = require("../helpers/upload");

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

authCtrl.UpFileNews = async (req, res) => {
  //Sube un archivo al drive en la carpeta noticias

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
          console.log(idOld);
          if (idOld != "undefined") {
            fs.unlinkSync(`./tmp/${name}`);
            return mysqlConnection
              .query(
                `INSERT INTO Events(title, descriptionEvent,datePublication,dateInit,StateEvent,picture,idAdmin) 
        VALUES(?,?,CURDATE(),?,false,?,?)`,
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
            console.log("entre");
            fs.unlinkSync(`./tmp/${req.body.nameFile}`);
            return mysqlConnection
              .query(
                `INSERT INTO Events(title, descriptionEvent,datePublication,dateInit,StateEvent,picture,idAdmin) 
        VALUES(?,?,CURDATE(),?,false,?,?)`,
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

authCtrl.upload = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.archivo) {
    res.status(400).json({ msg: "No hay archivos que subir" });
    return;
  }

  const nombre = await subirArchivo(req.files);
  res.json({
    nombre: nombre,
  });
};

module.exports = {
  authCtrl,
};
