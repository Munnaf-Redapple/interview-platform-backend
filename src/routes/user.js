const fs = require('fs');
const path = require('path');
const userController = require('../controllers/userController');
const appConfig = require("./../../config/appConfig");
const auth = require('./../middlewares/auth');
const validator = require('../middlewares/validator');


module.exports.setRouter = (app) => {
    let baseUrl = `${appConfig.apiVersion}`;
    app.post(`${baseUrl}/login`, validator.loginValidate, userController.login);
    app.post(`${baseUrl}/admin/login`, validator.adminloginValidate, userController.adminLogin);
    app.post(`${baseUrl}/admin/register-user`, validator.customRegisterValidate, auth.isAuthorized, userController.adminUserRegister);
    app.post(`${baseUrl}/register-user`, validator.customRegisterValidate, userController.register);
    app.post(`${baseUrl}/admin/user-role-create`,auth.isAuthorized, validator.customRoleCreateValidate, userController.roleCreate);
    app.post(`${baseUrl}/admin/user-role-update`,auth.isAuthorized, validator.customRoleUpdateValidate, userController.roleUpdate);
    app.post(`${baseUrl}/register-admin`, validator.adminRegisterValidate, userController.registerAdmin);
    app.post(`${baseUrl}/update-admin`,auth.isAuthorized, validator.adminUpdateValidate, userController.updateAdmin);
    app.get(`${baseUrl}/admin/get-user-list`, auth.isAuthorized, userController.getUserList);
    app.get(`${baseUrl}/admin/get-admin-list`, auth.isAuthorized, userController.getAdminList);
    app.get(`${baseUrl}/admin/get-admin-role-list`, auth.isAuthorized, userController.getAdminRoleList);
    // Upload Routes
    app.get(`${baseUrl}/admin/get-upload-url`, auth.isAuthorized, userController.putSignedUrl);
    app.get(`${baseUrl}/admin/get-file-url`, auth.isAuthorized, userController.getSignedUrl);
    // Language Routes
    app.get(`${baseUrl}/admin/get-language-list`, auth.isAuthorized, userController.getLanguageList);
    app.post(`${baseUrl}/admin/add-language`, auth.isAuthorized, validator.addLanguageValidate, userController.addLanguage)
    app.post(`${baseUrl}/admin/edit-language`, auth.isAuthorized, validator.editLanguageValidate, userController.editLanguage)
    app.post(`${baseUrl}/admin/delete-language`, auth.isAuthorized, validator.deleteLanguageValidate, userController.deleteLanguage)
    app.get(`${baseUrl}/user/get-language-list`, userController.getLanguageListByUser);
    // Event Routes
    app.get(`${baseUrl}/admin/get-event-list`, auth.isAuthorized, userController.getEventList);
    app.post(`${baseUrl}/admin/add-event`, auth.isAuthorized, validator.addEventValidate, userController.addEvent)
    app.post(`${baseUrl}/admin/edit-event`, auth.isAuthorized, validator.editEventValidate, userController.editEvent)
    app.post(`${baseUrl}/admin/delete-event`, auth.isAuthorized, validator.deleteEventValidate, userController.deleteEvent)
    app.get(`${baseUrl}/get-event-status`, userController.eventStatus);
    app.get(`${baseUrl}/get-event-details`, userController.eventDeatils);
    app.get(`${baseUrl}/get-student-details`, userController.studentDeatils);

};