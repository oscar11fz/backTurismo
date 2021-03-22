const path = require("path");
const { uuid } = require("uuidv4");

const subirArchivo = (
  files,
  extensionValida = ["png", "jpg", "jpeg", "gif"],
  carpeta = ""
) => {
  return new Promise((resolve, reject) => {
    const { archivo } = files;
    const nombreCorto = archivo.name.split(".");
    const extension = nombreCorto[nombreCorto.length - 1];

    //validar Extensiones

    if (!extensionValida.includes(extension)) {
      return reject(
        `La extensión ${extension} no es permitida. Seleccione archivos  ${extensionValida}`
      );
    }

    const nombreTemp = uuid() + "." + extension;
    const uploadPath = path.join(__dirname, "../uploads/", carpeta, nombreTemp);

    archivo.mv(uploadPath, (err) => {
      if (err) {
        reject(err);
      }

      resolve(nombreTemp);
    });
  });
};

module.exports = {
  subirArchivo,
};
