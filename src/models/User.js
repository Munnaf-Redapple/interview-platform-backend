'use strict'
/**
 * Module Dependencies
 */
const { v4: uuidv4 } = require('uuid');
const { generatePassword } = require('../libs/otpLib');
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let userSchema = new Schema({
  user_id: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  event_id: {
    type: String,
    default: '',
    index: true
  },
  username: {
    type: String,
    default: ''
  },
  name:{
    type:String,
    default:''
  },
  password: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    default: ''
  },
  is_active:{
    type: Boolean,
    default:true
  },
  user_type:{
    type: Number,
    default:3
  },
  lang:{
    type: String,
    default:'js'
  },
  genre:
  {
    type: String,
    default:''
  },
  exp:{
    type: Number,
    default:0
  },
  interview_start:
  {
    type: String,
    default:''
  },
  interview_end:
  {
    type: String,
    default:''
  },
  created_by:{
    type: String,
    default: ''
  },
  created_on :{
    type:Date,
    default:""
  }
})


mongoose.model('User', userSchema);