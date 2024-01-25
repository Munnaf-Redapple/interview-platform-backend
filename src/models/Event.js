'use strict'
/**
 * Module Dependencies
 */
const { v4: uuidv4 } = require('uuid');
const { generatePassword } = require('../libs/otpLib');
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let eventSchema = new Schema({
    event_name: {
        type: String,
        default: '',
        index: true,
        unique: true
    },
    event_logo: {
        type: String,
        default: '',
        index: true,
        unique: false
    },
    start_date: {
        type: String,
        default: '',
        index: true,
        unique: false
    },
    end_date: {
        type: String,
        default: '',
        index: true,
        unique: false
    },
    exam_date: {
        type: String,
        default: '',
        index: true,
        unique: false
    },
    exam_start_time: {
        type: String,
        default: '',
        unique: false
    },
    exam_end_time: {
        type: String,
        default: '',
        unique: false
    },
    language_List: [{
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Language',
            default: null
        }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    },
    created_by:{
        type: String,
        default:''
    },
    created_on: {
        type: Date,
        default: ""
    }
})


mongoose.model('Event', eventSchema);