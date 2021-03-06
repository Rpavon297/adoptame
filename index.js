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
const shelterServices = require("./services/shelter_service");

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
const shelterService = new shelterServices.ShelterService(pool);

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
    
  }
  next();
};

// Este middleware no se está utilizando y está mal planteado (se comprueba currentUser.emal de currentUser undefined) 17/05
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

app.get("/GestionAnimal.html", (req, res) => {
  res.render("GestionAnimal", {errMsg: null});
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
  if(request.session.currentUser != undefined){
    if(request.session.currentUser.userType === "adoptante" || request.session.currentUser.userType === "admin"){
      response.redirect("/profile");
    }if(request.session.currentUser.userType === "protectora"){
      response.redirect("/profileshelter");
    }
  }else{
    response.render("Login", {errMsg: null});
  }
})

app.post("/Login", function(request, response){
  userService.validate(request.body.loginMail, request.body.loginPassword, (err, check) => {
      if(check === true){
          //Guardo en la session el usuario COMPLETO, por comodidad y llevarlo mejor durante toda la practica
          userService.getUser(request.body.loginMail, (err, userBD)=>{
              if(err){
                
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



app.get("/deleteUser/:id", (req, res) => {
  userService.deleteUser( req.params.id , (err) => {
    if(err){
      console.log(colors.red("error al borrar"))
    }else{
      res.redirect("/gestionUsuarios");
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
      res.render("Shelters", {protectoras});
    }
  })
});

app.get("/listarAnimalesProtectora", (req, res) => {
  res.render("ListarAnimalesProtectora", {errMsg: null});
});

app.get("/admin", (req, res) => {
  res.render("Admin", {errMsg: null});
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

app.get("/detalleprotectora/:id", (req, res) => {
  console.log(colors.dim(req.params.id + "req.param"))
  userService.getUser(req.params.id, (err, user) => {
    if(err){}
    else{
      res.render("detalleprotectora", {errMsg: null,nombre:user.shelterName,descripcion:user.shelterDescription, telefono:user.tlf,direccion:user.shelterAddress,correo:user.email, webpage: user.webpage});
    }
  })
});

app.get("/solicitudesProtectoras", middCheckUser, (req, res) => {
  shelterService.getRequests((err, protectoras) =>{
    res.render("SolicitudesProtectoras", {errMsg: null, protectoras: protectoras});
  });
});

app.post("/manageRequest", middCheckUser, (request, response) =>{
  console.log(request.body)
  if(request.body.accepted){
    shelterService.acceptRequest(request.body.email, (err, result) =>{
      if(err){
        response.end();
      }else{
        result.userType = "protectora";
        delete result.currentStatus;

        userService.createAccount(result, (err, done) =>{
          console.log(err);
          console.log(done);
          
        });
      }
    });
  }else{
    shelterService.rejectRequest(request.body.email, (err, done) =>{
      if(err){
        console.log(err);
        response.end();
      }else{
        if(done){
          console.log("Peticion rechazada");
        }
      }
    });
  }
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
  request.body.userType = 'adoptante';
  
  // Inventarse los nombres de los atributos está feo, el MVC existe para que no haya que hacer estas chapuzas ahora
  request.body.forename = request.body.name;
  request.body.surnames = request.body.surname;
  request.body.birthdate = request.body.jqueryDate;
  request.body.pass = request.body.password;

  delete request.body.name;
  delete request.body.surname;
  delete request.body.jqueryDate;
  delete request.body.password;

  userService.createAccount(request.body, (err, check) => {
      if(check === true){
          response.redirect("/confirmation");
      }
      else { response.render("Login", {errMsg: "No se pudo efectuar el registro correctamente"}); }
  })
}); 

app.get("/sign-up-shelter", (req, res) => {
  res.render("SignUpShelter", {errMsg: null});
});

app.post("/sign-up-shelter", function(request, response){
  request.body.userType = 'protectora';

  console.log(request.body);

  request.body.forename = request.body.name;
  request.body.surnames = request.body.surname;
  request.body.birthdate = request.body.jqueryDate;
  request.body.pass = request.body.password;
  request.body.shelterName = request.body.shelter_name;
  request.body.shelterAddress = request.body.location;
  request.body.webpage = request.body.web;
  request.body.shelterDescription = request.body.descripcion;

  delete request.body.name;
  delete request.body.surname;
  delete request.body.jqueryDate;
  delete request.body.password;
  delete request.body.shelter_name;
  delete request.body.location;
  delete request.body.web;
  delete request.body.descripcion;
  
  shelterService.createRequest(request.body, (err, check) => {
    
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
    
      if(check === true){
        response.redirect("/confirmation");
      }
      else { 
        response.render("Login", {errMsg: "No se pudo registrar"}); 
      };
  });
});

app.get("/editShelterProfile", (req,res) =>{
  res.render("ModificarPerfilProtectora", {errMsg: null});
});

app.post("/editShelterProfile", (req,res) =>{
  userService.modifUser(request.body, (err, check) => {
    if(check === true){
      response.redirect("/confirmation");
      }
      else { 
        response.render("Login", {errMsg: "No se pudo registrar"}); 
      };
});
});

app.get("/modificarProtectora", (req, res) => {
  res.render("modificarProtectora", {errMsg: null});
});


/**
 * Server Activation
 */

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
  });