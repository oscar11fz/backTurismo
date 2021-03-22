const express = require("express"); //Importamos express para ayudarnos a levantar el servidor
const bodyParser = require("body-parser"); //Importamos body-parse para recibir de forma segura el req.body
const cors = require("cors");
const app = express(); //Se crea la variable app modificar el servidor y levantarlo
const fileUpload = require("express-fileupload");

const authRoutes = require("./routes/auth.routes"); //se crear la variable router para vincularla con el servidor
const userRoutes = require("./routes/user.routes");
const newsRoutes = require("./routes/news.routes");
const eventsRoutes = require("./routes/events.routes");
const uploadsRoutes = require("./routes/uploads.routes");

app.use(bodyParser.urlencoded({ extended: false })); //El en servidor se define usando el bodyParse que no haya extención
app.use(bodyParser.json()); //Se define que los request llegaran en formato JSON
app.use(cors());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api", authRoutes); //Se define que la request estara en la raiz del servidor
app.use("/api", userRoutes);
app.use("/api", newsRoutes);
app.use("/api", eventsRoutes);
app.use("/api", uploadsRoutes);

const port = process.env.PORT;

app.listen(port, () => {
  //Se levanta el servidor escuchando en el puerto 4000
  console.log(`Started on PORT ${port}`);
});
