const _ = require("lodash")
class UserService{
    constructor(pool){
        this.pool = pool;
    }

    /**
     * Comprueba que el usuario existe y la contraseña es correcta
     * @param {*} email email del usuario
     * @param {*} pass contraseña
     * @param {*} callback 
     */
    validate(email, pass, callback){
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
                return;
            }
            connection.query(
                "Select pass from account where email = ?",
                [email],
                (err,row) => {
                    if(err){
                        callback(err);
                    }
                    if(row[0]){
                        if(row[0].pass === pass){
                            callback(null, true);
                        }
                        else{
                            callback(null, false);
                        }
                    }
                    else{
                        callback(null,false);
                    }
                }
            );
            connection.release();
        });
    }

    getUser(email, callback){
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
                return;
            }
            connection.query(
                "Select * from account where email = ?",
                [email],
                (err,user) => {
                    if(err){
                        callback(err);
                    }
                    console.log(user)
                    if(user[0].userType === 'protectora'){
                        connection.query(
                            "Select * from shelter where userEmail = ?",
                            [email],
                            (err, shelter) => {
                                if(err){
                                    callback(err);
                                }
                                else{
                                    let full_account = _.merge(user[0], shelter[0]);
                                    callback(false, full_account);
                                }
                            }
                        )
                    }else{
                        callback(false,user[0]);
                    }
                }
            );
            connection.release();
        });
    }


    getAllUsers(type, callback){
        this.pool.getConnection((err,connection) => {
            if(err){ callback(err); return;
            }
            if(type === "protectora"){
                connection.query(
                    "Select * from account join shelter on email = userEmail", [type], (err, users) => {
                        if(err){callback(err); return;}
                        connection.release();
                        callback(null, users);
                    }
                )
            }else if (type === "all"){
                connection.query(
                    "Select * from account", (err, users) => {
                        if(err){callback(err); return;}
                        connection.release();
                        callback(null, users);
                    })
            }else{
                connection.query(
                    "Select * from account where userType = ?", [type], (err, users) => {
                        if(err){callback(err); return;}
                        connection.release();
                        callback(null, users);
                    }
                )
            }
           })}




    /**
     * Crea una cuenta de adoptante o de protectora
     * @param {*} email 
     * @param {*} pass 
     * @param {*} forename 
     * @param {*} surnames 
     * @param {*} birthdate 
     * @param {*} userType posee tres valores, admin si es administrador, adoptante o protectora, son strings
     * @param {*} shelterEmail 
     * @param {*} shelterAddress 
     * @param {*} shelterDescription 
     * @param {*} webpage 
     */
    createAccount(user, callback){
        if((user.email === "") ||(user.forename === "") || (user.pass=== "") ||  (user.surnames === undefined) ){
            console.log("incorrecto");
            callback(null, false); return;
        }
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
                return;
            }
            connection.query("select email from account where email = ?", [user.email], (err, result) => {
                if(err) {callback(err); return;}
                if(result.length == 0){
                    connection.query(
                        "insert into account(email,pass,forename,surnames,birthdate, tlf,  userType) values (?,?,?,?,?,?,?)",
                        [user.email, user.pass, user.forename, user.surnames, user.birthdate, user.tlf, user.userType],
                        (err) =>{
                            if(err){
                                callback(err);
                                return ;
                            }
                            else{
                                if(user.userType === 'protectora'){
                                    connection.query(
                                        "insert into shelter(userEmail, shelterName, shelterAddress, shelterDescription, webpage) values (?,?,?,?,?)",
                                        [user.email, user.shelterName, user.shelterAddress, user.shelterDescription, user.webpage],
                                        (err) =>{
                                            if(err){
                                                callback(err);
                                            }
                                            connection.release();
                                            callback(null, true);
                                        }
                                    );
                                }  else  {connection.release(); callback(null, true);}
                            }
                        }
                    );
                }
                else{  connection.release(); callback(null, false);}
            }) 
        });
    }

    modifUser(user, callback){
        this.pool.getConnection((err, conn) => {
            conn.query("UPDATE account SET email=?, pass=?, forename=?, surnames=?, birthdate=?, tlf=? WHERE email=?", 
            [user.email, user.password, user.name, user.surname, user.jqueryDate, user.tlf, user.email],
           (err, check)=>{
               if(err){
                conn.release();
                callback(err);
               }else{
                if(user.type === 'protectora'){
                    conn.query(
                        "UPDATE shelter SET userEmail=?, shelterName=?, shelterAddress=?, shelterDescription=?, webpage=?",
                        [user.email, user.shelter_name, user.location, user.descripcion, user.web],
                        (err) =>{
                            if(err){
                                callback(err);
                            }
                            conn.release();
                            callback(null, true);
                        }
                    );
                }  else  {conn.release(); callback(null, true);}
               }
        });
    });
    }
}

module.exports = {
    UserService: UserService
}
