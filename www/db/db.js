
let dataAPI;
const { Sequelize } = require('sequelize');
const mode = process.env.NODE_ENV;
const mongoose = require('mongoose');
const server = require('../rest/server');
const appConfig = require('../../config/appConfig');
const db = {};
const redis = require('redis');


const startDB = (app,db_type)=>{
    switch(db_type){
        case "mysql":
            console.log(`Environment : ${process.env.NODE_ENV} Database : ${process.env.DATABASE_TYPE}`);
            //Import the sequelize module
            
            const dbConfig = require("../../config/dbConfig.json")[mode];
            dataAPI = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
            try{
                dataAPI.authenticate()
                .then(()=>{
                    console.log(`Database Connection open Success : ${JSON.stringify(dbConfig.host)}`);
                    const redis_client = redis.createClient({
                        url:appConfig.redis_url
                    });
                    
                    redis_client.on('error', (err) => {
                        console.log("Error " + err)
                    });
                    server.startServer(app);
                    module.exports.dataAPI = dataAPI;
                    module.exports.redis_client = redis_client;
                    
                });
            }catch(err){
                console.log(`Database Connection Open Error : ${err}`);
            }

            break;
        case "mongo" :
            console.log(`Environment : ${process.env.NODE_ENV} Database : ${process.env.DATABASE_TYPE}`);
            try{
                /**
                 * database connection settings
                 */

                mongoose.connect(appConfig.db.uri,{ useNewUrlParser: true});
                //mongoose.set('debug', true);
                
                mongoose.connection.on('error', function (err) {
                console.log(`database error:${err}`);
                process.exit(1)
                }); // end mongoose connection error
                
                mongoose.connection.on('open', function (err) {
                if (err) {
                    console.log(`database error:${JSON.stringify(err)}`);
                    process.exit(1)
                } else {
                    console.log("database connection open success =====>",appConfig.db.uri);
                    const redis_client = redis.createClient({
                        url:appConfig.redis_url
                    });
                    redis_client.connect();
                    redis_client.on('error', (err) => {
                        console.log("REDIS Error " + err)
                    });
                    module.exports.redis_client = redis_client;
                    /**
                     * Create HTTP server.
                     */
                    server.startServer(app);
                }
                }); // end mongoose connection open handler
            }catch(err){
                console.log(`Database Connection Open Error : ${err}`);
            }
            break;

        default:
            console.log('No Database Connected,webserver will not start!');
    }
}
mongoose.set('debug', true);


module.exports = {
    startDB : startDB
}