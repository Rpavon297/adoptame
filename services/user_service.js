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
     * @param {*} isShelter True si es una cuenta de protectora, false si es adoptante
     * @param {*} shelterEmail 
     * @param {*} shelterAddress 
     * @param {*} shelterDescription 
     * @param {*} webpage 
     */
    createAccount(email, pass, forename, surnames, birthdate, isShelter, shelterName=undefined, shelterAddress=undefined, shelterDescription=undefined, webpage=undefined, callback){
        this.pool.getConnection((err,connection) => {
            if(err){
                callback(err);
                return;
            }
            connection.query(
                "insert into account(email,pass,forename,surnames,birthdate, isShelter) values (?,?,?,?,?,?)",
                [email,pass, forename, surnames, birthdate, isShelter],
                (err, result) =>{
                    if(err){
                        callback(err);
                    }
                    else{
                        if(isShelter){
                            connection.query(
                                "insert into shelter(userEmail, shelterName, shelterAddress, shelterDescription, webpage) values (?,?,?,?,?)",
                                [email, shelterName, shelterAddress, shelterDescription, webpage],
                                (err, result) =>{
                                    if(err){
                                        callback(err);
                                    }
                                    callback(null);
                                }
                            );
                        }
                    }
                }
            );

            connection.release();
        });
    }
}

module.exports = {
    UserService: UserService
}