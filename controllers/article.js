const Article = require('../models/Article');

/**
 * GET /
 * 跳转至发布文章页
 */
exports.index = (req, res) => {
  res.render('topic/article', {
    title: 'Article'
  });
};

/**
 * POST /
 * 发布文章
 */
exports.postArticle = (req, res, next) => {
  const article = new Article({
    title: req.body.title,
    content: req.body.content
    // author_id: req.session.user._id
  })

  article.save((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
}
