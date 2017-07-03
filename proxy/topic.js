var models     = require('../models');
var Topic      = models.Topic;

exports.newAndSave = function (title, content, authorId, callback) {
  var topic       = new Topic();
  topic.title     = title;
  topic.content   = content;
  topic.author_id = authorId;

  topic.save(callback);
};