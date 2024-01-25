'use strict'
/**
 * Module Dependencies
 */
const { v4: uuidv4 } = require('uuid');
const { generatePassword } = require('../libs/otpLib');
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let resultSchema = new Schema({
  user_id: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  lang:{
    type: String,
    default:'js'
  },
  exp: {
    type:Number,
    default: 0
  },
  mcq_response:[Object],
  mcq_score: {
    type:Number,
    default: 0
  },
  mcq_percentile: {
    type:Number,
    default: 0
  },
  code_response:[Object],
  code:{
    type: String
  },
  code_score: {
    type:Number,
    default: 0
  },
  code_percentile: {
    type:Number,
    default: 0
  },
  pass_fail_status: {
    type:String,
    default: 'pass',
    enum:['pass','fail']
  },
  is_active:{
    type: Boolean,
    default:true
  },
  submitted_by:{
    type: String,
    default: ''
  },
  submitted_on :{
    type:Date,
    default:""
  }
})


mongoose.model('Result', resultSchema);