'use strict'
/**
 * Module Dependencies
 */
const { v4: uuidv4 } = require('uuid');
const { generatePassword } = require('../libs/otpLib');
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let userRoleSchema = new Schema({
  role_name: {
    type: String,
    default: ''
  },
  role_type: {
    type: Number,
    default: 3
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


mongoose.model('UserRole', userRoleSchema);