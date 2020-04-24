class UserService{
    constructor(pool){
        this.pool = pool;
    }

    /**
     * Comprueba que el usuario existe y la contraseña es correcta
     * 
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
                    if(user.userType === 'protectora'){
                        connection.query(
                            "Select * from shelter where userEmail = ?",
                            [email],
                            (err, shelter) => {
                                console.log(shelter)
                                if(err){
                                    callback(err);
                                }
                                else{
                                    user = user[0]
                                    shelter = shelter[0]
                                    full_account = {user, shelter};
                                    console.log(full_account)
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
        if((user.email === "") ||(user.name === "") || (user.password === "") ||  (user.surname === undefined) ){
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
                        [user.email, user.password, user.name, user.surname, user.jqueryDate, user.tlf, user.type],
                        (err) =>{
                            if(err){
                                callback(err);
                                return ;
                            }
                            else{
                                if(user.type === 'protectora'){
                                    connection.query(
                                        "insert into shelter(userEmail, shelterName, shelterAddress, shelterDescription, webpage) values (?,?,?,?,?)",
                                        [user.email, user.shelter_name, user.location, user.descripcion, user.web],
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
                else{  conn.release(); callback(null, false);}
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
                    connection.query(
                        "UPDATE shelter SET userEmail=?, shelterName=?, shelterAddress=?, shelterDescription=?, webpage=?",
                        [user.email, user.shelter_name, user.location, user.descripcion, user.web],
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
               
        });
    });
    }
}

module.exports = {
    UserService: UserService
}