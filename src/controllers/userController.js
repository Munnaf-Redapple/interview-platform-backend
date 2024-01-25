const response = require('./../libs/responseLib')
const check = require('../libs/checkLib')
const appConfig = require('../../config/appConfig');
const time = require('../libs/timeLib');
const otpLib = require('../libs/otpLib');
const notification = require('../libs/notificationLib');
const { v4: uuidv4 } = require('uuid');
const tokenLib = require('../libs/tokenLib');
const passwordLib = require('../libs/passwordLib');
const mongoose = require('mongoose');
const UserModel = mongoose.model('User');
const LanguageModel = mongoose.model('Language');
const UserRoleModel = mongoose.model('UserRole');
const EventModel = mongoose.model('Event');
const ResultModel = mongoose.model('Result');
const uploadLib = require('../libs/uploadLib');
const timeLib = require('../libs/timeLib');


let login = async (req, res) => {

    try {
        let eventDetails = await EventModel.findOne({ _id: req.body.event_id }).select('-__v -_id').lean();
        if (check.isEmpty(eventDetails)) {
            res.status(404);
            throw new Error('Event is not exist');
        };
        let finduser = await UserModel.findOne({ $and: [{ event_id: req.body.event_id }, { username: req.body.username }] }).select('-__v -_id').lean();
        if (!check.isEmpty(finduser)) {
            let userResult = await ResultModel.findOne({ user_id: finduser.user_id }).select('-__v -_id').lean();
            if (!check.isEmpty(userResult)) {
                res.status(404);
                throw new Error('You have already given the exam');
            };
        };
        if (check.isEmpty(finduser)) {
            res.status(404);
            throw new Error('User not Registered!');
        };

        if (!check.isEmpty(finduser.interview_start) && !check.isEmpty(finduser.interview_end)) {
            if (!time.checkCurrDateRangeUnix(finduser.interview_start, finduser.interview_end)) {
                res.status(412);
                throw new Error('Event is Not Active!');
            }
        }

        if (await passwordLib.verify(req.body.password, finduser.password)) {
            console.log('verified!');
            if ((finduser.user_type != 3) || (!finduser.is_active)) {
                res.status(401);
                throw new Error('Authorization Failed!');
            } else {
                let payload = {
                    lang: finduser.lang,
                    exp: finduser.exp,
                    user_id: finduser.user_id,
                    user_type: finduser.user_type,
                    interview_start:(finduser.interview_start)?finduser.interview_start : '',
                    interview_end: (finduser.interview_end)?finduser.interview_end : '',
                    token: await tokenLib.generateToken(finduser)
                };
                let apiResponse = response.generate(false, 'logged in!', payload);
                res.status(200).send(apiResponse);
            }
        } else {
            res.status(401);
            throw new Error('incorrect password!');
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.send(apiResponse);
    }
}

let adminLogin = async (req, res) => {
    try {
        let finduser = await UserModel.findOne({ username: req.body.username }).select('-__v -_id').lean();
        if (check.isEmpty(finduser)) {
            res.status(404);
            throw new Error('User not Registered!');
        };
        if (await passwordLib.verify(req.body.password, finduser.password)) {
            if (finduser.user_type == 3) {
                res.status(401);
                throw new Error('Authorization Failed!');
            } else {
                let payload = {
                    user_type: finduser.user_type,
                    token: await tokenLib.generateToken(finduser)
                };
                let apiResponse = response.generate(false, 'logged in!', payload);
                res.status(200).send(apiResponse);
            }
        } else {
            res.status(401);
            throw new Error('incorrect password!');
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.send(apiResponse);
    }
}

let register = async (req, res) => {
    //models
    try {
        let eventDetails = await EventModel.findOne({ _id: req.body.event_id }).select('-__v -_id').lean();
        if (check.isEmpty(eventDetails)) {
            res.status(404);
            throw new Error('Invalid event ID!');
        };
        let finduser = await UserModel.findOne({ $and: [{ event_id: req.body.event_id }, { username: req.body.username }] }).lean();
        let languageData = await LanguageModel.findOne({ _id: mongoose.Types.ObjectId(req.body.lang_id) }).lean();
        let start_date = '';
        let endDate = '';
        if (req.body.start_date && req.body.start_time) {
            start_date = timeLib.getCustomTimeStampDateTime(req.body.start_date, req.body.start_time)
        }

        if (req.body.end_date && req.body.end_time) {
            endDate = timeLib.getCustomTimeStampDateTime(req.body.end_date, req.body.end_time)
        }

        let newUser = new UserModel({
            user_id: uuidv4(),
            event_id: req.body.event_id,
            username: req.body.username,
            name: req.body.name,
            email: req.body.email.toLowerCase(),
            mobile: req.body.mobile,
            lang: languageData.extension,
            genre: languageData.name,
            exp: languageData.experience,
            password: await passwordLib.hash(req.body.password),
            user_type: req.body.user_type,
            interview_start: start_date,
            interview_end: endDate,
            created_by: req.body.name,
            created_on: time.now()
        });

        if (check.isEmpty(finduser)) {
            let payload = (await newUser.save()).toObject();

            let newPlayload = {
                int_plat_uid: payload.user_id,
                url: `${appConfig.INTERVIEW_WEB_BASEURL}waiting-login/${req.body.event_id}/${payload.user_id}`,
                expiry_timestamp: endDate
            }
            delete payload.__v;
            delete payload._id;
            delete payload.password;
            delete payload.lang;
            delete payload.exp;
            let apiResponse = response.generate(false, 'Created new user', newPlayload);
            res.status(200).send(apiResponse);
        } else {
            res.status(412);
            throw new Error('User Already Registered For this Event!');
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.send(apiResponse);
    }
}

let roleCreate = async (req, res) => {
    try {
        if (req.user.user_type != 1) {
            throw new Error('Not Authorized for this action!');
        } else {
            let checkExistence = await UserRoleModel.findOne({ role_type: req.body.role_type }).select('-__v').lean();
            if (check.isEmpty(checkExistence)) {
                let addroleobj = new UserRoleModel({
                    role_name: req.body.role_name,
                    role_type: req.body.role_type,
                    status: 'active',
                    created_on: time.now()
                })
                let payload = (await addroleobj.save()).toObject();
                delete payload.__v;
                delete payload._id;
                let apiResponse = response.generate(false, 'User Role Added', payload);
                res.status(200).send(apiResponse);
            } else {
                throw new Error('User Role already exists!')
            }
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let roleUpdate = async (req, res) => {
    try {
        if (req.user.user_type != 1) {
            throw new Error('Not Authorized for this action!');
        } else {
            let updatedRole = {};
            for (const property in req.body) {
                updatedRole[property] = req.body[property];
            }
            let payload = await LanguageModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.role_id) }, updatedRole, { new: true });
            delete payload.__v;
            let apiResponse = response.generate(false, 'User Role Updated', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let adminUserRegister = async (req, res) => {
    //models
    try {
        let eventDetails = await EventModel.findOne({ _id: req.body.event_id }).select('-__v -_id').lean();
        if (check.isEmpty(eventDetails)) {
            res.status(404);
            throw new Error('Invalid event ID!');
        };
        let finduser = await UserModel.findOne({ $and: [{ event_id: req.body.event_id }, { username: req.body.username }] }).lean();
        let languageData = await LanguageModel.findOne({ _id: mongoose.Types.ObjectId(req.body.lang_id) }).lean();
        let start_date = '';
        let endDate = '';
        if (req.body.start_date && req.body.start_time) {
            start_date = timeLib.getCustomTimeStampDateTime(req.body.start_date, req.body.start_time)
        }

        if (req.body.end_date && req.body.end_time) {
            endDate = timeLib.getCustomTimeStampDateTime(req.body.end_date, req.body.end_time)
        }

        let newUser = new UserModel({
            user_id: uuidv4(),
            event_id: req.body.event_id,
            username: req.body.username,
            name: req.body.name,
            email: req.body.email.toLowerCase(),
            mobile: req.body.mobile,
            lang: languageData.extension,
            genre: languageData.name,
            exp: languageData.experience,
            password: await passwordLib.hash(req.body.password),
            user_type: req.body.user_type,
            interview_start: start_date,
            interview_end: endDate,
            created_by: req.body.name,
            created_on: time.now()
        });

        if (check.isEmpty(finduser)) {
            let payload = (await newUser.save()).toObject();
            delete payload.__v;
            delete payload._id;
            delete payload.password;
            delete payload.lang;
            delete payload.exp;
            let apiResponse = response.generate(false, 'Created new user', payload);
            res.status(200).send(apiResponse);
        } else {
            res.status(412);
            throw new Error('User Already Registered For this Event!');
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.send(apiResponse);
    }
}

let registerAdmin = async (req, res) => {
    //models
    try {
        let finduser = await UserModel.findOne({ $or: [{ username: req.body.username }, { mobile: req.body.mobile }, { email: req.body.email }] }).lean();
        if (check.isEmpty(finduser)) {
            let newUser = new UserModel({
                user_id: uuidv4(),
                username: req.body.username,
                email: req.body.email.toLowerCase(),
                mobile: req.body.mobile,
                password: await passwordLib.hash(req.body.password),
                user_type: req.body.user_type,
                created_on: time.now()
            });
            let payload = (await newUser.save()).toObject();

            delete payload.__v;
            delete payload._id;
            delete payload.password;
            delete payload.lang;
            delete payload.exp;
            let apiResponse = response.generate(false, 'Created new admin user', payload);
            res.status(200).send(apiResponse);
        } else {
            res.status(412);
            throw new Error('username,email or mobile already exists!');
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.send(apiResponse);
    }
}

let updateAdmin = async (req, res) => {
    try {
        if (req.user.user_type != 1) {
            throw new Error('Not Authorized for this action!');
        } else {
            let updatedAdmin = {};
            for (const property in req.body) {
                updatedAdmin[property] = req.body[property];
            }
            let payload = await UserModel.findOneAndUpdate({ user_id: req.body.admin_id }, updatedAdmin, { new: true });
            delete payload.__v;
            let apiResponse = response.generate(false, 'Admin Data Updated', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}


let getUserList = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            if (check.isEmpty(req.query.event_id)) {
                throw new Error('event_id required in query string!');
            } else {
                let userList = await UserModel.aggregate([
                    { $match: { $and: [{ user_type: 3 }, { event_id: req.query.event_id }] } },
                    {
                        $lookup: {
                            from: "results",
                            localField: "user_id",
                            foreignField: "user_id",
                            as: "results"
                        }
                    }, { $unwind: { path: "$results", preserveNullAndEmptyArrays: true } }, { $project: { '_id': 0, '__v': 0, 'password': 0, 'results._id': 0, 'results.__v': 0 } }
                ])
                let apiResponse = response.generate(false, 'found existing user-list!', userList);
                res.status(200).send(apiResponse);
            }
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let getAdminList = async (req, res) => {
    try {
        if (req.user.user_type != 1) {
            throw new Error('Not Authorized for this action!');
        } else {
            let userList = await UserModel.find({ $or: [{ user_type: 1 }, { user_type: 2 }] }).select('-__v -_id').lean();
            let rolelist = await UserRoleModel.find({ $or: [{ role_type: 1 }, { role_type: 2 }] }).select('-__v -_id').lean();

            // Create a map of rolelist based on role_type
            const roleMap = new Map();
            rolelist.forEach(role => {
            roleMap.set(role.role_type, role);
            });

            // Merge the arrays based on user_type and role_type
            const mergedArray = userList.map(user => {
            const role = roleMap.get(user.user_type);
            if (role) {
                return {
                ...user,
                ...role,
                };
            }
            return user;
            });
            let apiResponse = response.generate(false, 'found existing Admin-list!', mergedArray);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let getAdminRoleList = async (req, res) => {
    try {
        if (req.user.user_type != 1) {
            throw new Error('Not Authorized for this action!');
        } else {
            let rolelist = await UserRoleModel.find({ $or: [{ role_type: 1 }, { role_type: 2 }] }).select('-__v -_id').lean();
            let apiResponse = response.generate(false, 'found existing Admin-Role-list!', rolelist);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let getLanguageList = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let languageList = await LanguageModel.find().select('-__v').lean();
            let respArr = [];
            languageList.map((data) => {
                if (data.status != 'deleted') {
                    respArr.push(data);
                }
            })
            let apiResponse = response.generate(false, 'found Language-list!', respArr);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let getLanguageListByUser = async (req, res) => {
    try {
        let languageList = await LanguageModel.find().select('-__v').lean();
        let respArr = [];
        languageList.map((data) => {
            if (data.status == 'active') {
                respArr.push(data);
            }
        })
        let apiResponse = response.generate(false, 'found Language-list!', respArr);
        res.status(200).send(apiResponse);
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let addLanguage = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let checkExistence = await LanguageModel.findOne({ name: req.body.name }).select('-__v').lean();
            if (check.isEmpty(checkExistence)) {
                let addlanguageobj = new LanguageModel({
                    name: req.body.name,
                    extension: req.body.extension,
                    experience: req.body.experience,
                    status: 'active',
                    created_on: time.now()
                })
                let payload = (await addlanguageobj.save()).toObject();
                delete payload.__v;
                delete payload._id;
                let apiResponse = response.generate(false, 'Language Added', payload);
                res.status(200).send(apiResponse);
            } else {
                throw new Error('Language already exists!')
            }
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let editLanguage = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let updatedLanguage = {};
            for (const property in req.body) {
                updatedLanguage[property] = req.body[property];
            }

            let payload = await LanguageModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.language_id) }, updatedLanguage, { new: true });
            delete payload.__v;
            let apiResponse = response.generate(false, 'Language Updated', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let deleteLanguage = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let updatedLanguage = {
                status: 'deleted'
            };

            let payload = await LanguageModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.language_id) }, updatedLanguage, { new: true });
            delete payload.__v;
            let apiResponse = response.generate(false, 'Language Updated', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}



let getEventList = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let eventList = await EventModel.find().select('-__v').lean();
            let temp = await Promise.all(eventList.map(async (curr) => {
                if (!check.isEmpty(curr['event_logo'])) {
                    let signedUrl = await uploadLib.getFileUrl(curr.event_logo);
                    curr.event_logo = signedUrl
                }
                return curr;
            }));
            let respArr = [];
            temp.map((data) => {
                if (data.status != 'deleted') {
                        respArr.push(data);
                }
            })
            let apiResponse = response.generate(false, 'found Event-list!', respArr);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let addEvent = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let checkExistence = await EventModel.findOne({ event_name: req.body.event_name }).select('-__v').lean();
            if (check.isEmpty(checkExistence)) {
                let addeventobj = new EventModel({
                    event_name: req.body.event_name,
                    event_logo: req.body.event_logo,
                    start_date: timeLib.getLocalDateFormat(req.body.start_date),
                    end_date: timeLib.getLocalDateFormat(req.body.end_date),
                    exam_date: timeLib.getLocalDateFormat(req.body.exam_date),
                    exam_start_time: req.body.exam_start_time,
                    exam_end_time: req.body.exam_end_time,
                    language_List: req.body.language_List,
                    status: 'active',
                    created_by: req.user.user_id,
                    created_on: time.now()
                })
                let payload = (await addeventobj.save()).toObject();
                delete payload.__v;
                delete payload._id;
                let apiResponse = response.generate(false, 'Event Added', payload);
                res.status(200).send(apiResponse);
            } else {
                throw new Error('Event with same name Already Exists!');
            }
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let editEvent = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let updatedEvent = {};
            for (const property in req.body) {
                if ((property == 'start_date') || (property == 'end_date')) {
                    updatedEvent[property] = time.getLocalDateFormat(req.body[property]);
                } else {
                    updatedEvent[property] = req.body[property];
                }
            }

            let payload = await EventModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.event_id) }, updatedEvent, { new: true });
            delete payload.__v;
            let apiResponse = response.generate(false, 'Event Updated', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}


let deleteEvent = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let updatedEvent = {
                status: 'deleted'
            };

            let payload = await EventModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.event_id) }, updatedEvent, { new: true });
            delete payload.__v;
            let apiResponse = response.generate(false, 'Event Updated', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let putSignedUrl = async (req, res) => {
    try {
        if (check.isEmpty(req.query.filename)) {
            throw new Error('filename must be provided in query string!');
        } else {
            let uniqueKey = otpLib.randomString(4, 'aA') + req.user.user_id + req.query.filename;
            let uploadUrl = await uploadLib.putFileUrl(uniqueKey);
            let apiResponse = response.generate(false, 'Upload Url Created!', { key: uniqueKey, url: uploadUrl });
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(412).send(apiResponse);
    }
}
let getSignedUrl = async (req, res) => {
    try {
        if (check.isEmpty(req.query.filename)) {
            throw new Error('filename must be provided in query string!');
        } else {
            let signedUrl = await uploadLib.getFileUrl(req.query.filename);
            let apiResponse = response.generate(false, 'File Url Created!', { url: signedUrl });
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(412).send(apiResponse);
    }
}

let eventStatus = async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.query.event_id)) {
            let eventDetails = await EventModel.findOne({ _id: req.query.event_id }).select('-__v -_id').lean();
            let signedUrl = check.isEmpty(eventDetails.event_logo) ? `${appConfig.baseUrl}event.jpg` : await uploadLib.getFileUrl(eventDetails.event_logo);
            if (!time.checkCurrDateRange(eventDetails.start_date, eventDetails.end_date)) {
                res.status(412);
                throw new Error('No Active Event Founds!');
            }
            let apiResponse = response.generate(false, 'Event ID is valid!', { status: 'ok!', url: signedUrl, exam_date: eventDetails.exam_date });
            res.status(200).send(apiResponse);
        }
        else {
            res.status(404);
            throw new Error('Invalid event ID!');
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(412).send(apiResponse);
    }
}

let eventDeatils = async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.query.event_id)) {
            // let eventDetails = await EventModel.findOne({ _id: req.query.event_id }).populate('language').select('-__v -_id').lean();
            let eventDetails = await EventModel.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(req.query.event_id) } },
                {
                    $lookup: {
                        from: "languages",
                        localField: "language_List._id",
                        foreignField: "_id",
                        as: "language_list",
                    }
                },
            ]);
            let signedUrl=""
            if(check.isEmpty(eventDetails))
            {
                signedUrl = check.isEmpty(eventDetails[0].event_logo) ? `${appConfig.baseUrl}event.jpg` : await uploadLib.getFileUrl(eventDetails[0].event_logo);
            }
            eventDetails[0].event_logo = signedUrl
            let apiResponse = response.generate(false, 'Event ID is valid!', eventDetails);
            res.status(200).send(apiResponse);
        }
        else {
            res.status(404);
            throw new Error('Invalid event ID!');
        }

    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(412).send(apiResponse);
    }
}

let studentDeatils = async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.query.event_id)) {
            // let eventDetails = await EventModel.findOne({ _id: req.query.event_id }).populate('language').select('-__v -_id').lean();
            let userDetails = await UserModel.findOne({ user_id: req.query.user_id, event_id: req.query.event_id});
            let apiResponse = response.generate(false, 'User Details Found!', userDetails);
            res.status(200).send(apiResponse);
        }
        else {
            res.status(404);
            throw new Error('Invalid event ID!');
        }

    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(412).send(apiResponse);
    }
}

module.exports = {
    login: login,
    register: register,
    roleCreate: roleCreate,
    roleUpdate: roleUpdate,
    adminUserRegister: adminUserRegister,
    registerAdmin: registerAdmin,
    updateAdmin: updateAdmin,
    adminLogin: adminLogin,
    getUserList: getUserList,
    getAdminList: getAdminList,
    getAdminRoleList:getAdminRoleList,
    getLanguageList: getLanguageList,
    getLanguageListByUser: getLanguageListByUser,
    addLanguage: addLanguage,
    editLanguage: editLanguage,
    deleteLanguage: deleteLanguage,

    getEventList: getEventList,
    addEvent: addEvent,
    editEvent: editEvent,
    deleteEvent: deleteEvent,
    putSignedUrl: putSignedUrl,
    getSignedUrl: getSignedUrl,
    eventStatus: eventStatus,
    eventDeatils: eventDeatils,
    studentDeatils: studentDeatils,
}