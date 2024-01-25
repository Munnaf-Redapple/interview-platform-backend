'use strict'
/**
 * Module Dependencies
 */
const { v4: uuidv4 } = require('uuid');
const { generatePassword } = require('../libs/otpLib');
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let languageSchema = new Schema({
    name: {
        type: String,
        default: '',
        index: true,
        unique: true
    },
    extension: {
        type: String,
        default: '',
        index: true,
        unique: false
    },
    experience:
    {
        type: String,
        default: '0',
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    },
    created_on: {
        type: Date,
        default: ""
    }
})


mongoose.model('Language', languageSchema);