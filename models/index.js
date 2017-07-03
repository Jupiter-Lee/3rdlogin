const mongoose = require('mongoose');
const config = require('../config');

mongoose.connect(config.db, {
  server: {poolSize: 20}
}, function (err) {
  if (err) {
    logger.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

//models
require('./user');
require('./topic');

exports.User         = mongoose.model('User');
exports.Topic = mongoose.model('Topic');
