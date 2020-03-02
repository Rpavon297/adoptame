/**
 * Required External Modules
 */

// Framework
const express = require("express");
// Utilidades para trabjar con rutas a ficheros y directorios
const path = require("path");

/**
 * App Variables
 */

 // Instancia de express y puerto en el que escucha
const app = express();
const port = process.env.PORT || "3000";

/**
 *  App Configuration
 */

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