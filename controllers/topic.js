const validator = require('validator');
const Topic = require('../proxy').Topic;
const User = require('../proxy').User;

const EventProxy = require('eventproxy');

/**
 * Topic page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
    const topic_id = req.params.tid;
    const currentUser = req.session.user;

    const events = ['topic', 'other_topics', 'no_reply_topics', 'is_collect'];
    const ep = EventProxy.create(events,
        function (topic, other_topics, no_reply_topics, is_collect) {
            res.render('topic/index', {
                topic: topic,
                author_other_topics: other_topics,
                no_reply_topics: no_reply_topics,
                is_uped: isUped,
                is_collect: is_collect,
            });
        });

    ep.fail(next);

    Topic.getFullTopic(topic_id, ep.done(function (message, topic, author, replies) {
        if (message) {
            logger.error('getFullTopic error topic_id: ' + topic_id)
            return res.renderError(message);
        }

        topic.visit_count += 1;
        topic.save();

        topic.author = author;
        topic.replies = replies;

        // 点赞数排名第三的回答，它的点赞数就是阈值
        topic.reply_up_threshold = (function () {
            const allUpCount = replies.map(function (reply) {
                return reply.ups && reply.ups.length || 0;
            });
            allUpCount = _.sortBy(allUpCount, Number).reverse();

            const threshold = allUpCount[2] || 0;
            if (threshold < 3) {
                threshold = 3;
            }
            return threshold;
        })();

        ep.emit('topic', topic);

        // get other_topics
        const options = { limit: 5, sort: '-last_reply_at' };
        const query = { author_id: topic.author_id, _id: { '$nin': [topic._id] } };
        Topic.getTopicsByQuery(query, options, ep.done('other_topics'));

        // get no_reply_topics
        cache.get('no_reply_topics', ep.done(function (no_reply_topics) {
            if (no_reply_topics) {
                ep.emit('no_reply_topics', no_reply_topics);
            } else {
                Topic.getTopicsByQuery(
                    { reply_count: 0, tab: { $nin: ['job', 'dev'] } },
                    { limit: 5, sort: '-create_at' },
                    ep.done('no_reply_topics', function (no_reply_topics) {
                        cache.set('no_reply_topics', no_reply_topics, 60 * 1);
                        return no_reply_topics;
                    }));
            }
        }));
    }));

    if (!currentUser) {
        ep.emit('is_collect', null);
    } else {
        TopicCollect.getTopicCollect(currentUser._id, topic_id, ep.done('is_collect'))
    }
};

exports.create = function (req, res, next) {
    res.render('topic/edit', {
        title: 'Article'
    });
};

exports.put = function (req, res, next) {
    const title = validator.trim(req.body.title);
    const content = validator.trim(req.body.content);
    const author_id = req.user._id;

    Topic.newAndSave(title, content, req.user._id, function (err, topic) {
        if (err) {
            return next(err);
        }

        const proxy = new EventProxy();

        proxy.all('score_saved', function () {
            res.redirect('/topic/' + topic._id);
        });
        proxy.fail(next);
        User.getUserById(req.user._id, proxy.done(function (user) {
            user.score += 5;
            user.topic_count += 1;
            user.save();
            req.session.user = user;
            proxy.emit('score_saved');
        }));

    });
};

exports.showTopic = function (req, res, next) {
    const topic_id = req.params.tid;
    
    Promise.all([
        Topic.getTopicById(topic_id)//获取文章信息
    ])
    .then(function (result) {
        const topic = result[0];
        if (!topic) {
            throw new Error('改文章不存在');
        }

        res.render('topic/index', {
            topic: topic
        });
    })
    .catch(next);
}

exports.update = function (req, res, next) {
    const topic_id = req.params.tid;
    const title = req.body.title;
    const content = req.body.content;

    Topic.getTopicById(topic_id, function (err, topic, tags) {
        if (!topic) {
            res.render404('此话题不存在或已被删除。');
            return;
        }

        if (topic.author_id.equals(req.session.user._id) || req.session.user.is_admin) {
            title = validator.trim(title);
            tab = validator.trim(tab);
            content = validator.trim(content);

            //保存话题
            topic.title = title;
            topic.content = content;
            topic.tab = tab;
            topic.update_at = new Date();

            topic.save(function (err) {
                if (err) {
                    return next(err);
                }

                res.redirect('/topic/' + topic._id);

            });
        } else {
            res.renderError('对不起，你不能编辑此话题。', 403);
        }
    });
};