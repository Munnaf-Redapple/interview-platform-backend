const responseLib = require('../libs/responseLib');

const Joi = require('joi').extend(require('@joi/date'));


const customLoginValidateSchema = Joi.object({
    event_id: Joi.string()
        .required(),
    username: Joi.string()
        .required(),
    password: Joi.string()
        .max(20)
        .required()
    // source_type: Joi.number().required()
});

const customAdminLoginValidateSchema = Joi.object({
    username: Joi.string()
        .required(),
    password: Joi.string()
        .max(20)
        .required()
    // source_type: Joi.number().required()
});

const adminRegisterValidateSchema = Joi.object({
    username: Joi.string()
        .required(),
    password: Joi.string()
        .max(20)
        .required(),
    user_type: Joi.number().integer().required().valid(1, 2),
    email: Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    // source_type: Joi.number().required()
});

const adminUpdateValidateSchema = Joi.object({
    admin_id: Joi.string()
    .required(),
    username: Joi.string()
        .required(),
    password: Joi.allow(''),
    user_type: Joi.number().integer().required().valid(1, 2),
    email: Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    // source_type: Joi.number().required()
});
 

const customRegisterValidateSchema = Joi.object({
    event_id: Joi.string()
        .required(),
    username: Joi.string()
        .required(),
    name: Joi.string()
        .required(),
    password: Joi.string()
        .max(20)
        .required(),
    user_type: Joi.number().integer().required().valid(3),
    email: Joi.string().pattern(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).required(),
    mobile: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    lang_id: Joi.string().required(),
    event_id: Joi.string().required(),
    start_date: Joi.string().allow(''),
    start_time: Joi.string().allow(''),
    end_date: Joi.string().allow(''),
    end_time: Joi.string().allow(''),
});


const customRoleCreateValidateSchema = Joi.object(
    {
        role_name: Joi.string()
            .required(),
        role_type: Joi.number()
            .required(),
    }
)

const customRoleUpdateValidateSchema = Joi.object(
    {
        role_id: Joi.string()
            .required(),
        role_name: Joi.string()
            .required(),
        role_type: Joi.number()
            .required(),
    }
)

let language =  Joi.object().keys({
    _id: Joi.string().required(),
})

let option = Joi.object().keys({
    opt: Joi.string().required(),
    marks: Joi.number().required()
}).required();

let example = Joi.object().keys({
    input: Joi.string().required(),
    output: Joi.string().required()
}).required();

let mcq = Joi.object().keys({
    question_id: Joi.string().required().allow(''),
    question: Joi.string().required(),
    options: Joi.array().items(option).required()
});

let sub = Joi.object().keys({
    question_id: Joi.string().required().allow(''),
    question: Joi.string().required(),
    examples: Joi.array().items(example).required(),
    runtime_func: Joi.string().required().allow(''),
    constraints: Joi.array()
});


const createQuestionValidateSchema = Joi.object({
    language_name: Joi.string().required(),
    lang: Joi.string().required(),
    exp: Joi.number().required(),
    objectives: Joi.array().items(mcq).required(),
    subjectives: Joi.array().items(sub).required()
});

const updateQuestionValidateSchema = Joi.object({
    set_id: Joi.string().required(),
    language_name: Joi.string().required(),
    lang: Joi.string().required(),
    exp: Joi.number().required(),
    objectives: Joi.array().items(mcq).required(),
    subjectives: Joi.array().items(sub).required()
});

let answer = Joi.object().keys({
    question: Joi.string().required(),
    options: Joi.array().items(option).required(),
    answer: Joi.string().required(),
    marks: Joi.number().required()
});
const submitMCQValidateSchema = Joi.object({
    lang: Joi.string().required(),
    exp: Joi.number().required(),
    set_id: Joi.string().required(),
    mcq_response: Joi.array().items(answer).required()
});

const codeValidateSchema = Joi.object({
    question_id: Joi.string().required(),
    question: Joi.string().required(),
    lang: Joi.string().required(),
    code: Joi.string().required().allow(''),
    submit: Joi.boolean().required()
});

const addLanguageValidateSchema = Joi.object({
    name: Joi.string().required(),
    extension: Joi.string().required(),
    experience: Joi.string().required(),

});

const editLanguageValidateSchema = Joi.object({
    name: Joi.string().allow(''),
    extension: Joi.string().allow(''),
    experience: Joi.string().required(),
    language_id: Joi.required()
})

const deleteLanguageValidateSchema = Joi.object({
    language_id: Joi.required()
})

const addEventValidateSchema = Joi.object({
    event_name: Joi.string().required(),
    event_logo: Joi.allow(''),
    start_date: Joi.string().required(),
    end_date: Joi.string().required(),
    exam_date: Joi.string().required(),
    exam_start_time: Joi.string().required(),
    exam_end_time: Joi.string().required(),
    language_List: Joi.array().items(language).required(),
});

const editEventValidateSchema = Joi.object({
    event_id: Joi.string().required(),
    event_name: Joi.string().required(),
    event_logo: Joi.allow(''),
    start_date: Joi.string().required(),
    end_date: Joi.string().required(),
    exam_date: Joi.string().required(),
    exam_start_time: Joi.string().required(),
    exam_end_time: Joi.string().required(),
    language_List: Joi.array().items(language).required(),
});

const deleteEventValidateSchema = Joi.object({
    event_id: Joi.required()
})


let loginValidate = async (req, res, next) => {
    try {
        const value = await customLoginValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}
let adminloginValidate = async (req, res, next) => {
    try {
        const value = await customAdminLoginValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let adminRegisterValidate = async (req, res, next) => {
    try {
        const value = await adminRegisterValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let adminUpdateValidate = async (req, res, next) => {
    try {
        const value = await adminUpdateValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let customRegisterValidate = async (req, res, next) => {
    try {
        const value = await customRegisterValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let customRoleCreateValidate = async (req, res, next) => {
    try {
        const value = await customRoleCreateValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}
let customRoleUpdateValidate = async (req, res, next) => {
    try {
        const value = await customRoleUpdateValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let createQuestionValidate = async (req, res, next) => {
    try {
        const value = await createQuestionValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, `${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}
let updateQuestionValidate = async (req, res, next) => {
    try {
        const value = await updateQuestionValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, `${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let mcqValidate = async (req, res, next) => {
    try {
        const value = await submitMCQValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let codeValidate = async (req, res, next) => {
    try {
        const value = await codeValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}


let addLanguageValidate = async (req, res, next) => {
    try {
        const value = await addLanguageValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let editLanguageValidate = async (req, res, next) => {
    try {
        const value = await editLanguageValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let deleteLanguageValidate = async (req, res, next) => {
    try {
        const value = await deleteLanguageValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}


let addEventValidate = async (req, res, next) => {
    try {
        const value = await addEventValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

let editEventValidate = async (req, res, next) => {
    try {
        const value = await editEventValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}


let deleteEventValidate = async (req, res, next) => {
    try {
        const value = await deleteEventValidateSchema.validate(req.body);
        if (value.hasOwnProperty('error')) {
            throw new Error(value.error);
        } else {
            next();
        }
    } catch (err) {
        let apiResponse = responseLib.generate(true, ` ${err.message}`, null);
        res.status(400);
        res.send(apiResponse)
    }
}

module.exports = {
    loginValidate: loginValidate,
    adminloginValidate: adminloginValidate,
    adminRegisterValidate: adminRegisterValidate,
    adminUpdateValidate: adminUpdateValidate,
    customRegisterValidate: customRegisterValidate,
    customRoleCreateValidate: customRoleCreateValidate,
    customRoleUpdateValidate: customRoleUpdateValidate,
    createQuestionValidate: createQuestionValidate,
    updateQuestionValidate: updateQuestionValidate,
    mcqValidate: mcqValidate,
    codeValidate: codeValidate,
    addLanguageValidate: addLanguageValidate,
    editLanguageValidate: editLanguageValidate,
    deleteLanguageValidate: deleteLanguageValidate,
    addEventValidate: addEventValidate,
    editEventValidate: editEventValidate,
    deleteEventValidate: deleteEventValidate,
}