const response = require('./../libs/responseLib')
const check = require('../libs/checkLib')
const appConfig = require('../../config/appConfig');
const eventEmitter = appConfig.eventEmitter;
const time = require('../libs/timeLib');
const otpLib = require('../libs/otpLib');
const notification = require('../libs/notificationLib');
const { v4: uuidv4 } = require('uuid');
const tokenLib = require('../libs/tokenLib');
const passwordLib = require('../libs/passwordLib');
const utils = require('../algo/utils');
const fs = require('fs');
const path = require('path');
const compiler = require('../libs/compilerLib');
const mongoose = require('mongoose');
const QuestionModel = mongoose.model('Question');
const ResultModel = mongoose.model('Result');
const UserModel = mongoose.model('User');
let amqp = require('amqplib/callback_api');
const { default: axios } = require("axios");


let insertQuestion = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let paper = req.body;
            paper.set_id = uuidv4();
            paper.created_by = req.user.username;
            paper.created_on = time.now();
            if (paper.objectives.length > 0) {
                paper.objectives = paper.objectives.reduce((perv, curr) => {
                    curr.question_id = uuidv4();
                    perv.push(curr);
                    return perv;
                }, []);
            }
            if (paper.subjectives.length > 0) {
                paper.subjectives = paper.subjectives.reduce((perv, curr) => {
                    curr.question_id = uuidv4();
                    perv.push(curr);
                    return perv;
                }, []);
            }
            let newQuestion = new QuestionModel(paper);
            let payload = (await newQuestion.save()).toObject();

            delete payload.__v;
            delete payload._id;
            let apiResponse = response.generate(false, 'Created new Question Paper!', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let updateQuestion = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let paperSet = await QuestionModel.findOne({ set_id: req.body.set_id }).lean();
            if (check.isEmpty(paperSet)) {
                throw new Error('No set found with provided id!');
            }
            let options = {};
            options.language_name = req.body.language_name;
            options.lang = req.body.lang;
            options.exp = req.body.exp;
            switch (true) {
                case ((req.body).hasOwnProperty('objectives') && req.body.objectives.length > 0):
                    if (check.isEmpty(req.body.objectives[0].question_id)) {
                        req.body.objectives[0].question_id = uuidv4();
                        paperSet.objectives.push(req.body.objectives[0]);
                        options.objectives = paperSet.objectives;
                    } else {
                        options.objectives = paperSet.objectives.reduce((prev, curr) => {
                            if (curr.question_id == req.body.objectives[0].question_id) {
                                curr = req.body.objectives[0];
                            }
                            prev.push(curr);
                            return prev;
                        }, []);
                    }
                    break;
                case ((req.body).hasOwnProperty('subjectives') && req.body.subjectives.length > 0):
                    if (check.isEmpty(req.body.subjectives[0].question_id)) {
                        req.body.subjectives[0].question_id = uuidv4();
                        paperSet.subjectives.push(req.body.subjectives[0]);
                        options.subjectives = paperSet.subjectives;
                    } else {
                        options.subjectives = paperSet.subjectives.reduce((prev, curr) => {
                            if (curr.question_id == req.body.subjectives[0].question_id) {
                                curr = req.body.subjectives[0];
                            }
                            prev.push(curr);
                            return prev;
                        }, []);
                    }
                    break;
            }
            let updateSet = await QuestionModel.findOneAndUpdate({ set_id: req.body.set_id }, options, { new: true });
            let apiResponse = response.generate(false, 'Updated Question Paper!', updateSet);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let getQuestionPaper = async (req, res) => {
    try {
        if (req.user.user_type != 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let exp_level = (parseInt(req.user.exp) >= 3) ? { $lte: parseInt(req.user.exp), $gte: 3 } : { $lte: 3, $gte: 0 };
            let findQuestions = await QuestionModel.find({ $and: [{ lang: req.user.lang }, { exp: exp_level }] }).lean();
            let randomize = utils.shuffle(findQuestions);
            let payload = (randomize.length > 0) ? randomize[0] : {};
            let randomObj = utils.shuffle(payload.objectives);
            payload.objectives = randomObj.slice(0, 20);
            let randomSub = [];
            if (!check.isEmpty(payload.subjectives)) {
                randomSub = utils.shuffle(payload.subjectives);
                payload.subjectives = randomSub[0];
            } else {
                payload.subjectives = randomSub;
            }
            let apiResponse = response.generate(false, 'found matching question paper!', payload);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let getQuestionPaperAdmin = async (req, res) => {
    try {
        if (req.user.user_type == 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let findQuestions = await QuestionModel.find().lean();
            let apiResponse = response.generate(false, 'found matching question paper!', findQuestions);
            res.status(200).send(apiResponse);
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let submitAnswerMCQ = async (req, res) => {
    try {
        if (req.user.user_type != 3) {
            throw new Error('Not Authorized for this action!');
        } else {
            let submitArr=[];
            let question_set = await QuestionModel.findOne({ set_id: req.body.set_id }).lean();
            let full_marks = 20;
            let mcq_score = 0;
            if (req.body.mcq_response.length > 0) {
                req.body.mcq_response.map((ans) => {
                    mcq_score += ans.marks;
                })
            }
            let mcq_percentile = (mcq_score / full_marks) * 100;
            req.body.user_id = req.user.user_id;
            req.body.mcq_score = mcq_score;
            req.body.mcq_percentile = mcq_percentile;
            req.body.submitted_by = req.user.username;
            req.body.submitted_on = time.now();
            if(mcq_percentile > 39)
            {
                req.body.pass_fail_status='pass';
            }
            else
            {
                req.body.pass_fail_status='fail';
            }

            let resultDetail = await ResultModel.findOne({ user_id: req.user.user_id }).lean();
            if (check.isEmpty(resultDetail)) {
                let newResult = new ResultModel(req.body);
                await newResult.save();
              
                    let userDeatails = await UserModel.findOne({ user_id: req.user.user_id }).lean();
                    if (!check.isEmpty(userDeatails.interview_start) && !check.isEmpty(userDeatails.interview_end)) {
                        let candiadteResultData = await getCandidateResult(req.user.user_id);
                        let response = await axios.post(appConfig.HRMS_BACKEND_BASEURL + "job/add-machinetest-result", candiadteResultData);
                    }
                let apiResponse = response.generate(false, 'Response saved successfully!', { 'mcq_submit': true });
                res.status(200).send(apiResponse);
            } else {
                throw new Error('response already submitted!');
            }
        }
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}

let compile = async (req, res) => {
    try {
        let { redis_client } = require('../../www/db/db');
        // await    redis_client.connect();
        let job_id = uuidv4();
        let data_src = {
            user_id: req.query.counter_id,
            job_id: job_id,
            lang: req.body.lang,
            code: req.body.code
        };
        // let prep = await compiler.generateCommand(req.user.user_id,req.body.lang,req.body.code);
        // compiler.compile(prep.job_id,prep.command);
        eventEmitter.emit('code_received', data_src);
        let apiResponse = response.generate(false, 'Queued!', { job_id: job_id });
        //await redis_client.connect();
        redis_client.setEx(job_id, appConfig.otpLinkExpTime, JSON.stringify(apiResponse));
        //await redis_client.disconnect();
        res.status(200).send(apiResponse);
    } catch (err) {
        // await    redis_client.disconnect();
        let apiResponse = response.generate(false, `ERROR : ${err}`, null);
        res.status(500).send(apiResponse);
    }
}

let getResult = async (req, res) => {
    try {

            let result = await ResultModel.aggregate([
                { $match: { user_id: `${req.query.user_id}` } },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "user_id",
                        as: "user"
                    },
                }, { $unwind: "$user" }, { $project: { '_id': 0, '__v': 0, 'user.password': 0, 'user._id': 0, 'user.__v': 0 } }
            ]);
            console.log('result', result);
            let apiResponse = response.generate(false, 'result fetched', result);
            res.status(200).send(apiResponse);
        
    } catch (err) {
        let apiResponse = response.generate(true, err.message, null);
        res.status(400).send(apiResponse);
    }
}


let getCandidateResult = async (user_id) => {
    try {
        let result = await ResultModel.aggregate([
            { $match: { user_id: `${user_id}` } },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "user"
                },
            }, { $unwind: "$user" }, { $project: { '_id': 0, '__v': 0, 'user.password': 0, 'user._id': 0, 'user.__v': 0 } }
        ]);

        return result;
    } catch (err) {
        return null
    }
}

let run = async (req, res) => {
    try {
        let { redis_client } = require('../../www/db/db');
        let job_id = uuidv4();
        let data_src = {
            user_id: req.user.user_id,
            job_id: job_id,
            lang: req.body.lang,
            code: req.body.code
        };
        let apiResponse;
        if (req.body.submit) {
            // Saving Code Start
            let marks = 0;
            if (!check.isEmpty(data_src.code)) {
                if(data_src.code.length > 30)
                {
                    marks = 1;
                }
            }

            let findResult = await ResultModel.findOne({ user_id: req.user.user_id }).select('-__v -_id').lean();
            console.log("findResult.code_response", findResult.code_response)
            if (check.isEmpty(findResult.code_response)) {
                findResult.code_response = [];
            }
            findResult.code_response.push({ question: req.body.question, answer: req.body.code, marks: marks })
            let options = {
                code_response: findResult.code_response
            }
            await ResultModel.findOneAndUpdate({ user_id: req.user.user_id }, options, { new: true });
            apiResponse = response.generate(false, 'Response Submitted!', { job_id: job_id });
        } else {
            eventEmitter.emit('code_received', data_src);
            apiResponse = response.generate(false, 'Queued!', { job_id: job_id });
            redis_client.setEx(job_id, appConfig.otpLinkExpTime, JSON.stringify(apiResponse));
        }
        let userDeatails = await UserModel.findOne({ user_id: req.user.user_id }).lean();
        if (!check.isEmpty(userDeatails.interview_start) && !check.isEmpty(userDeatails.interview_end)) {
            let candiadteResultData = await getCandidateResult(req.user.user_id);
            let response = await axios.post(appConfig.HRMS_BACKEND_BASEURL + "job/add-machinetest-result", candiadteResultData);
            console.log(response.data);
        }
        res.status(200).send(apiResponse);
        

    } catch (err) {
        let apiResponse = response.generate(false, `ERROR : ${err}`, null);
        res.status(500).send(apiResponse);
    }
}
let getStatus = async (req, res) => {
    try {
        let { redis_client } = require('../../www/db/db');
        if (check.isEmpty(req.query.job_id)) {
            throw new Error('job id needed in query params.');
        } else {
            let job_id = req.query.job_id;
            let statusdata = await redis_client.get(job_id);
            if (!check.isEmpty(statusdata)) {
                let redis_status = JSON.parse(statusdata);
                res.status(200).send(redis_status);
            } else {
                throw new Error('No job scheduled with this id.');
            }
        }
    } catch (err) {
        let apiResponse = response.generate(false, `ERROR : ${err}`, null);
        res.status(412).send(apiResponse);
    }
}
// for the rabbitmq
amqp.connect(appConfig.mq_url, function (error0, connection) {
    if (error0) {
        console.log('An error occured while connecting rabbitmq');
        console.log(error0);
    } else {
        connection.createChannel(function (error1, channel) {
            if (error1) {
                console.log('An error occured while creating channel');
                console.log(error1);

            } else {
                let queue = 'task_queue';
                // let msg = 'The message number is ' +num ;

                channel.assertQueue(queue, {
                    durable: false
                });
                console.log('------------------------------------------------Connected MQ Server----------------------------------------------------')
                eventEmitter.on("code_received", (data) => {
                    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));

                });
            }

        });
    }
    // setTimeout(function () {
    //     connection.close();
    //     process.exit(0);
    // }, 500);
});
module.exports = {
    insertQuestion: insertQuestion,
    updateQuestion: updateQuestion,
    getQuestionPaper: getQuestionPaper,
    submitAnswerMCQ: submitAnswerMCQ,
    compile: compile,
    getResult: getResult,
    run: run,
    getStatus: getStatus,
    getQuestionPaperAdmin: getQuestionPaperAdmin
}