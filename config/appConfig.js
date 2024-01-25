const dbConfig = require('./dbConfig.json')[process.env.NODE_ENV]
let AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    apiVersion: '2010-03-31'
});

const events = require('events');
const eventEmitter = new events.EventEmitter();
const rngClass = require('../src/algo/rng');
const pRNG = new rngClass();



let appConfig = {};

appConfig.redis_url = dbConfig.redis_url;
appConfig.mq_url = dbConfig.mq_url;
appConfig.eventEmitter = eventEmitter;
appConfig.allowedCorsOrigin = "*";
appConfig.ticketPrice = 20,
appConfig.apiVersion = '/api/v1';
appConfig.socketNameSpace = 'wsio';
appConfig.sessionExpTime = (120 * 120);
appConfig.urlExpTime = 60;
appConfig.otpLinkExpTime = (60);
appConfig.pRNG = pRNG;
appConfig.AWS = AWS;
appConfig.db = {
    uri: `mongodb://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}?authSource=admin`
};


appConfig.baseUrl = 'http://localhost:3009/';
appConfig.INTERVIEW_WEB_BASEURL = 'http://localhost:3029/'

appConfig.HRMS_BACKEND_BASEURL = 'http://localhost:5004/'


module.exports = appConfig;