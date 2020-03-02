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
    res.status(200).send("uwu");
  });

/**
 * Server Activation
 */

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
  });