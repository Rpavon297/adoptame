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
const bodyParser = require("body-parser"); //Crea un json con los parametros de un formulario
const morgan = require("morgan"); //Muestra el estado de la peticion hecha
const colors = require("colors"); //Muestra las frases por consola con los colores que quieras, util visualmente al depurar
const helmet = require("helmet"); //Seguridad web en las cabeceras
const _ = require("lodash"); //utilidades para arrays y demas, version actualizada del antiguo underscore


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
app.use(morgan("dev"));
app.use(helmet());
colors.enable();
// Pool de conexiones

const pool = mysql.createPool({
  host: globals.mysqlConfigHeroku.host,
  user: globals.mysqlConfigHeroku.user,
  password: globals.mysqlConfigHeroku.password,
  database: globals.mysqlConfigHeroku.database
}); 


// Servicio de usuario
const userService = new userServices.UserService(pool);

// Sesión en la base de datos
const MySQLStore = sessionMSQL(session);
const sessionStore = new MySQLStore({
    host: globals.mysqlConfigHeroku.host,
    user: globals.mysqlConfigHeroku.user,
    password: globals.mysqlConfigHeroku.password,
    database: globals.mysqlConfigHeroku.database
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
  }else{ 
    response.locals.login = true;
    response.locals.currentUser = request.session.currentUser;
    console.log(colors.cyan(response.locals.currentUser))
  }
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
                console.log(colors.green("Se ha logueado correctamente, se guardaran estos datos de sesion"))
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

app.get("/gestionUsuarios", (req, res) => {
  userService.getAllUsers( "all", (err, users) => {
    if(err){
      console.log(colors.red("error"))
    }else{
      console.log(colors.green(users))
      res.render("GestionUsuarios", {usuarios: users});
    }
  })
});

app.get("/listarAdoptantes", (req, res) => {
  res.render("ListarAdoptantes", {errMsg: null});
});

app.get("/listarProtectoras.html", (req, res) => {
  userService.getAllUsers( "protectora" , (err, protectoras) => {
    if(err){
      console.log(colors.red("error"))
    }else{
      console.log(colors.green(protectoras))
      res.render("ListarProtectoras", {protectoras});
    }
  })
});

app.get("/DescripcionAnimalUsuario", (req, res) => {
  var photo = "/resources/img/blacky.jpg";
  var an = "Blacky"
  var nomb="La Madrileña";
  var tip="Felino";
  var col=" Mestizo (blanco y negro) ";
  var ed="3 años y 1 mes";
  var pes = "2 kilos";
  var descrip="La dueña de Blacky falleció dejando al pobre sólito en el mundo. Necesita una nueva familia y un hogar que le devuelva la alegría y la estabilidad que tenía.";

  res.render("DescripcionAnimalUsuario", {errMsg: null, animal:an,foto:photo,nombre:nomb,descripcion:descrip,tipo:tip,color:col,edad:ed,peso:pes});
});

app.get("/detalleprotectora", (req, res) => {
  var photo = "/resources/img/logo-lamadrilena.png";
  var nomb="La Madrileña";
  var descrip="Todas las personas que componemos el equipo de La Madrileña procedemos del mundo de la protección animal, en el que hemos trabajado durante muchos años y por el que seguimos luchando todos los días.";
  var telef="(+34)648 495 073 ";
  var ciu="Madrid";
  var direcci = "calle Siniestro, 28, Madrid ";
  var corre="l6@gmail.com";

  res.render("detalleprotectora", {errMsg: null,foto:photo,nombre:nomb,descripcion:descrip, telefono:telef,direccion:direcci,correo:corre,ciudad:ciu});
});
app.get("/solicitudesProtectoras", middCheckUser, (req, res) => {
  res.render("SolicitudesProtectoras", {errMsg: null});
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
  console.log(request.body)
  userService.createAccount(request.body, (err, check) => {
      if(check === true){
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

app.post("/modprofile", function(request, response){
  userService.modifUser(request.body, (err, check) => {
      console.log(colors.red("datos del usuario modificado"))
      console.log(colors.red(request.body))
      if(check === true){
        userService.getUser(request.body.email, (err, user) => {
          if(err){

          }else {
            request.session.currentUser = user;
            response.redirect("/profile");
          }
        })
        }
        else { response.render("Login", {errMsg: "No se pudo modificar"}); };
  })
});


/**
 * Server Activation
 */

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
  });