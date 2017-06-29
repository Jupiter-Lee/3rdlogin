/**
 * GET /
 * Post Article page.
 */
exports.index = (req, res) => {
  res.render('topic/article', {
    title: 'Article'
  });
};

