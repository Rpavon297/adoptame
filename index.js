/**
 * Required External Modules
 */

// Framework
const express = require("express");
// Utilidades para trabjar con rutas a ficheros y directorios
const path = require("path");

const mysql = require("mysql");

const globals = require("./globals");
const userServices = require("./services/user_service");

const session = require("express-session");
const sessionMSQL = require("express-mysql-session");
const expressValidator = require("express-validator");

/**
 * App Variables
 */

 // Instancia de express y puerto en el que escucha
const app = express();
const port = process.env.PORT || "3000";
// Ruta donde estarán los recursos estáticos (imagenes, hojas de estilo, etc)
const static = path.join(__dirname,"public");

/**
 *  App Configuration
 */

 // Configuración de las vistas
app.set("view engine", "ejs");
app.set("views",path.join(__dirname, "views"));
app.use(express.static('public')); //Donde se almacenan nuestros archivos tal que html, css, img...

app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/popper.js/dist'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));


// Pool de conexiones
const pool = mysql.createPool({
    host: globals.mysqlConfig.host,
    user: globals.mysqlConfig.user,
    password: globals.mysqlConfig.password,
    database: globals.mysqlConfig.database
});

// Servicio de usuario
const userService = new userServices.UserService(pool);

// Sesión en la base de datos
const MySQLStore = sessionMSQL(session);
const sessionStore = new MySQLStore({
    host: globals.mysqlConfig.host,
    user: globals.mysqlConfig.user,
    password: globals.mysqlConfig.password,
    database: globals.mysqlConfig.database
});

/**
 * Routes Definitions
 */

app.get("/", (req, res) => {
  res.render("Landing", {errMsg: null});
});

app.get("/Home.html", (req, res) => {
  res.render("Landing", {errMsg: null});
});

app.get("/Contact.html", (req, res) => {
  res.render("Contact", {errMsg: null});
});

app.get("/Ayuda.html", (req, res) => {
  res.render("Ayuda", {errMsg: null});
});

  app.get("/Login.html", function (request, response) {
    response.render("Login", {errMsg: null});
})

app.get("/admin", (req, res) => {
  res.render("Admin", {errMsg: null});
});

app.get("/SolicitudesAdopcion.html", (req, res) => {
  res.render("SolicitudesAdopcion", {errMsg: null, solicitudes:result, msg:msg});
});

/**
 * Server Activation
 */

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
  });