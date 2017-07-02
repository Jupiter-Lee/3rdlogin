const User = require('../models/User');
const passport = require('passport');

/**
 * GET /signup
 * Signup page.
 * 登录页面
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: '注册账户'
  });
};

/**
 * POST /signup
 * Create a new local account.
 * 注册新的账户
 */
exports.postSignup = (req, res, next) => {
  req.assert('email', 'Email 无效').isEmail();
  req.assert('password', 'Password 不能少于4位').len(4);
  req.assert('confirmPassword', 'Passwords 不匹配').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) { return next(err); }
    if (existingUser) {
      req.flash('errors', { msg: '该邮箱地址已经存在！' });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) { return next(err); }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
};

/**
 * GET /login
 * Login page.
 * 登录页面
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 * 通过email和密码登录
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email 无效').isEmail();
  req.assert('password', 'Password 不能为空！').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: '恭喜! 你已经成功登录' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 * 登出
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * GET /account
 * Profile page.
 * 个人信息页面
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: '账户管理'
  });
};

/**
 * POST /account/profile
 * Update profile information.
 * 更新用户信息
 */
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: '该邮箱地址已经与其他账号关联' });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', { msg: '个人信息已经修改' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 * 删除账户
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.user.id }, (err) => {
    if (err) { return next(err); }
    req.logout();
    req.flash('info', { msg: '你的账号已经删除' });
    res.redirect('/');
  });
};