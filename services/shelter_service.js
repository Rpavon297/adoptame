class ShelterService {
    constructor(pool) {
        this.pool = pool;
    }

    // Crea una petición de afiliación con los datos de la protectora, o si ya existe una petición rechazada, la reabre
    createRequest(request, callback) {
        for (var key in request) {
            if (key != "img" && (request[key] === "" || request[key] === undefined)) {
                console.log("campo a null:");
                console.log(key);
                callback(null, false); return;
            }
        }

        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            connection.query("select email from account where email = ?", [request.email], (err, result) => {
                if (err) { callback(err); return; }
                if (result.length == 0) {
                    connection.query(
                        "insert into shelterRequest(email,pass,forename,surnames,birthdate, tlf, shelterName, shelterAddress, webpage, shelterDescription, currentStatus) values (?,?,?,?,?,?,?,?,?,?,?)",
                        [request.email, request.password, request.name, request.surname, request.jqueryDate, request.tlf, request.shelter_name, request.location, request.web, request.descripcion, "pending"],
                        (err) => {
                            if (err) {
                                callback(err);
                                console.log("Error en la bbdd")
                                console.log(err)
                                return;
                            }
                            else {
                                connection.release();
                                callback(null, true);
                                return;
                            }
                        }
                    );
                }
                else if(result[0].currentStatus == "rejected"){
                    connection.query(
                        "update shelterRequest set currentStatus = 'pending' where email = ?",
                        [request.email],
                        (err) => {
                            if (err) {
                                callback(err);
                                return;
                            }
                            else {
                                connection.release();
                                callback(null, true);
                                return;
                            }
                        }
                    );
                }
                else { connection.release(); callback(null, false); }
            })
        });
    }

    // Si existe una petición vinculada al email, pone su estatus como rechazada
    rejectRequest(email, callback){
        for (var key in request) {
            if (key != "img" && (request[key] === "" || request[key] === undefined)){
                callback(null, false); return;
            }
        }

        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            connection.query("select email from account where email = ?", [request.email], (err, result) => {
                if (err) { callback(err); return; }
                if (result.length > 0) {
                    connection.query(
                        "update shelterRequest set currentStatus = 'rejected' where email = ?",
                        [email],
                        (err) => {
                            if (err) {
                                callback(err);
                                return;
                            }
                            else {
                                connection.release();
                                callback(null, true);
                                return;
                            }
                        }
                    );
                }
                else { connection.release(); callback(null, false); }
            })
        });
    }

    // Si existe una petición vinculada al email, pone su estatus como aceptada
    acceptRequest(email, callback){
        for (var key in request) {
            if (key != "img" && (request[key] === "" || request[key] === undefined)) {
                callback(null, false); return;
            }
        }

        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            connection.query("select email from account where email = ?", [request.email], (err, result) => {
                if (err) { callback(err); return; }
                if (result.length > 0) {
                    connection.query(
                        "update shelterRequest set currentStatus = 'accepted' where email = ?",
                        [email],
                        (err) => {
                            if (err) {
                                callback(err);
                                return;
                            }
                            else {
                                connection.release();
                                callback(null, true);
                                return;
                            }
                        }
                    );
                }
                else { connection.release(); callback(null, false); }
            })
        });
    }
}

module.exports = {
    ShelterService: ShelterService
}