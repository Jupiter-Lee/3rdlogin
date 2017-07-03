const express = require('express');
const passport = require('passport');
const dotenv = require('dotenv');

/**
 * 从.env.example文件当中载入环境诸如API和passwords等环境参数
 */
dotenv.load({ path: '.env.example' });

/**
 * API keys and Passport configuration. 
 * API以及Passport配置
 */
const passportConfig = require('./config/passport');

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const articleController = require('./controllers/article');
const topic = require('./controllers/topic');



const router = express.Router();

router.get('/', homeController.index);
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/logout', userController.logout);
router.get('/signup', userController.getSignup);
router.post('/signup', userController.postSignup);

// 新建文章界面
router.get('/topic/create',topic.create);
// 保存新建的文章
router.post('/topic/create', topic.put);
// 显示某个话题
router.get('/topic/:tid', topic.showTopic);
// 编辑某话题
router.post('/topic/:tid/edit', topic.update);

router.post('/post',articleController.postArticle);


router.get('/account', passportConfig.isAuthenticated, userController.getAccount);
router.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
router.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);

router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

module.exports = router;