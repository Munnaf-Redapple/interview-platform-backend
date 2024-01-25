const fs = require('fs');
const path = require('path');
const questionController = require('../controllers/questionnaireController');
const appConfig = require("./../../config/appConfig");
const auth = require('./../middlewares/auth');
const validator = require('../middlewares/validator');
const { rateLimiter,rateLimiterByIP } = require('../middlewares/rateLimiter');


module.exports.setRouter = (app) => {
  let baseUrl = `${appConfig.apiVersion}`;
  app.post(`${baseUrl}/admin/create-question`,validator.createQuestionValidate,auth.isAuthorized, questionController.insertQuestion);
  app.post(`${baseUrl}/admin/update-question`,validator.updateQuestionValidate,auth.isAuthorized, questionController.updateQuestion);
  app.get(`${baseUrl}/get-question-paper`,auth.isAuthorized, questionController.getQuestionPaper);
  app.get(`${baseUrl}/admin/get-question-paper`,auth.isAuthorized, questionController.getQuestionPaperAdmin);
  app.post(`${baseUrl}/submit-mcq`,validator.mcqValidate,auth.isAuthorized, questionController.submitAnswerMCQ);
  app.post(`${baseUrl}/compile`,rateLimiterByIP(),questionController.compile);
  app.get(`${baseUrl}/get-user-result`,auth.isAuthorized,questionController.getResult);
  app.post(`${baseUrl}/run`,validator.codeValidate,auth.isAuthorized,rateLimiter(),questionController.run);
  app.get(`${baseUrl}/status`,auth.isAuthorized,questionController.getStatus);
  app.get(`${baseUrl}/status-poll`,questionController.getStatus);
};

