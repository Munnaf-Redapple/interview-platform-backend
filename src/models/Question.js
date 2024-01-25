'use strict'
const { number } = require('joi');
/**
 * Module Dependencies
 */
const { v4: uuidv4 } = require('uuid');
const { generatePassword } = require('../libs/otpLib');
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let questionSchema = new Schema({
    set_id: {
        type: String,
        default: '',
        index: true,
        unique: true
    },
    exp: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    language_name: {
        type: String,
        default: 'Nodejs Developer'
    },
    lang: {
        type: String,
        default: 'js'
    },
    objectives: [Object],
    subjectives: [Object],
    created_by: {
        type: String,
        default: ''
    },
    created_on: {
        type: Date,
        default: ""
    }
})


mongoose.model('Question', questionSchema);