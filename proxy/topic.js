var EventProxy = require('eventproxy');
var models     = require('../models');
var User       = require('./user');
var Topic      = models.Topic;

/**
 * 根据主题ID获取主题
 * Callback:
 * - err, 数据库错误
 * - topic, 主题
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopicById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author', 'last_reply'];
  proxy.assign(events, function (topic, author, last_reply) {
    if (!author) {
      return callback(null, null, null, null);
    }
    return callback(null, topic, author, last_reply);
  }).fail(callback);

  Topic.findOne({_id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.emit('topic', null);
      proxy.emit('author', null);
      proxy.emit('last_reply', null);
      return;
    }
    proxy.emit('topic', topic);

    User.getUserById(topic.author_id, proxy.done('author'));

    if (topic.last_reply) {
      Reply.getReplyById(topic.last_reply, proxy.done(function (last_reply) {
        proxy.emit('last_reply', last_reply);
      }));
    } else {
      proxy.emit('last_reply', null);
    }
  }));
};

exports.newAndSave = function (title, content, authorId, callback) {
  var topic       = new Topic();
  topic.title     = title;
  topic.content   = content;
  topic.author_id = authorId;

  topic.save(callback);
};