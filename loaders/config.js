const fs = require('fs');
// verifica si existe un archivo de configuracion
const env = process.env.NODE_ENV || 'development';

const config = require('../../../config')[env];

module.exports = config;
