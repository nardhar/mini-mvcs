const fs = require('fs');

const env = process.env.NODE_ENV || 'development';

const config = require('../../../config')[env];

module.exports = config;
