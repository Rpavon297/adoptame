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
const bodyParser = require("body-parser");


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

// Sesión de la web
const middlewareSession = session ({
  saveUninitialized: false,
  secret: "foobar34",
  resave: false,
  store: sessionStore    
});

function initialVarLogin (request, response, next){
  if(request.session.currentUser === undefined){
    response.locals.login = false;
  }else response.locals.login = true;
  next();
};

function middCheckUser(request, response, next){
  //Si existe ese atributo, no puede ser undefined...
  if(request.session.currentUser.email !== undefined){
       //Guardo en la response.locals el usuario COMPLETO, por comodidad y llevarlo mejor durante toda la sesion
      response.locals.user = request.session.currentUser;
      next();
  }
  else  response.redirect("/Login.html");
};

/**
 * Middlewares
 */ 
app.use(middlewareSession);
app.use(initialVarLogin);
app.use(expressValidator());
app.use(bodyParser.urlencoded({ extended: false })); //middleware que permite procesar aquello recibido

// Si el request saliera de index.js, tiene que llevar la instancia del servicio como atributo
app.use(function (request,response,next){
  if(userService){
      request.userService = userService;
      next();
  }
  else{
      response.status(500);
      response.end("Error, al conectar con la base de datos!");
      console.log("Error, al conectar con la base de datos!");
  }
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

app.get("/Animals.html", (req, res) => {
  res.render("Animals", {errMsg: null});
});


app.get("/Shelters.html", (req, res) => {
  res.render("Shelters", {errMsg: null});
});

app.get("/Ayuda.html", (req, res) => {
  res.render("Ayuda", {errMsg: null});
});

app.get("/Login.html", function (request, response) {
  response.render("Login", {errMsg: null});
})

app.post("/Login", function(request, response){
  userService.validate(request.body.loginMail, request.body.loginPassword, (err, check) => {
      if(check === true){
          //Guardo en la session el usuario COMPLETO, por comodidad y llevarlo mejor durante toda la practica
          userService.getUser(request.body.loginMail, (err, userBD)=>{
              if(err){
                console.log(err)
                response.end()
              }
              else{
                userBD.email = request.body.loginMail;
                request.session.currentUser = userBD;
                console.log("aqui tienes los datos")
                console.log(userBD)
                if(userBD.userType === "adoptante" || userBD.userType === "admin"){
                  response.redirect("/profile");
                }if(userBD.userType === "protectora"){
                  response.redirect("/profileshelter");
                }              
              }
          });
      }
      else  response.render("Login", {errMsg: ""});
  })
})


app.get("/Logout", middCheckUser,function(request, response){
  request.session.destroy();
  response.redirect("/Login.html");
})


app.get("/admin", (req, res) => {
  res.render("Admin", {errMsg: null});
});

app.get("/solicitudesProtectoras", middCheckUser, (req, res) => {
  res.render("solicitudesProtectoras", {errMsg: null});
});

app.get("/SolicitudesAdopcion.html", middCheckUser, (req, res) => {
  res.render("SolicitudesAdopcion", {errMsg: null});
});

app.get("/ContactForm.html", (req, res) => {
  res.render("ContactForm", {errMsg: null});
});

app.get("/sign-up", (req, res) => {
  res.render("SignUpSelection", {errMsg: null});
});

app.get("/sign-up-adopter", (req, res) => {
  res.render("SignUpAdopter", {errMsg: null});
});

app.post("/sign-up-adopter", function(request, response){
  request.body.type = 'adoptante';
  userService.createAccount(request.body, (err, check) => {
      if(check === true){
        console.log("porque explota, i dont understand")
          response.redirect("/confirmation");
      }
      else { console.log("no inserta bien"); response.render("Login", {errMsg: "No se pudo efectuar el registro correctamente"}); }
  })
}) 


app.get("/sign-up-shelter", (req, res) => {
  res.render("SignUpShelter", {errMsg: null});
});

app.post("/sign-up-shelter", function(request, response){
  request.body.type = 'protectora';
  userService.createAccount(request.body, (err, check) => {
      if(check === true){
        console.log("porque explota, i dont understand")
        response.redirect("/confirmation");
        }
        else { response.render("Login", {errMsg: "No se pudo registrar"}); };
  })
});


app.get("/confirmation", (req, res) => {
  res.render("SignUpConfirmation", {errMsg: null});
});


app.get("/AboutUs.html", (req, res) => {
  res.render("AboutUs", {errMsg: null});
});

app.get("/profile", middCheckUser, (req, res) => {
  res.render("VerPerfilAdoptante", {errMsg: null});
});

app.get("/profileshelter", middCheckUser, (req, res) => {
  // Aqui pondría mi vista de perfil de adoptadora... SI LA TUVIESE
  res.render("VerPerfilAdoptante", {errMsg: null});
});

app.get("/modprofile", middCheckUser , (req, res) => {
  res.render("ModificarPerfilAdoptante", {errMsg: null});
});


/**
 * Server Activation
 */

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
  });