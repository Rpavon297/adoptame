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
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
                return;
            }
            console.log(user)
            connection.query(
                "insert into account(email,pass,forename,surnames,birthdate, userType) values (?,?,?,?,?,?)",
                [user.email, user.password, user.name, user.surname, user.jqueryDate, user.type],
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
                        }  
                    }
                }
            );
        });
    }
}

module.exports = {
    UserService: UserService
}