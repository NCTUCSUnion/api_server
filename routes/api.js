var express = require('express');
var router = express.Router();

var oldexamRouter = require('./Oldexam')
var oldexamOauth = require('./Oldexam/oauth')

var feeRouter = require('./Fee')

var chatbotRouter = require('./Chatbot')

var meetRouter = require('./Meet')

//oldexam
router.get('/oldexam/course', oldexamRouter.getCourse)
router.get('/oldexam/exam', oldexamRouter.getExam)
router.get('/oldexam/teacher', oldexamRouter.getTeacher)
router.get('/oldexam/download', oldexamRouter.downloadExam)
router.post('/oldexam/upload', oldexamRouter.uploadExam)

// oauth for oldexam
router.get('/oldexam/login', oldexamOauth.login)
router.get('/oldexam/auth', oldexamOauth.getToken, oldexamOauth.getProfile)
router.get('/oldexam/check', oldexamOauth.check)
router.get('/oldexam/logout', oldexamOauth.logout)

//csunion fee
router.get('/students', feeRouter.studentList)
router.post('/pay', feeRouter.payList)
router.post('/fee_check', feeRouter.check_auth)
router.post('/fee_auth', feeRouter.login)
router.post('/fee_logout', feeRouter.logout)

// for messenger chatbot
router.get('/webhook', chatbotRouter.webhook)
router.post('/webhook', chatbotRouter.webhookPost)
router.get('/webhook/newpost', chatbotRouter.webhookNewPost)

router.post('/meet/check', meetRouter.check)
router.post('/meet/login', meetRouter.login)
router.post('/meet/logout', meetRouter.logout)
router.post('/meet/group_add', meetRouter.checkSuper, meetRouter.group_add)
router.get('/meet/groups', meetRouter.checkSuper, meetRouter.group_all)
router.post('/meet/group_del', meetRouter.checkSuper, meetRouter.group_del)
router.post('/meet/group_delall', meetRouter.checkSuper, meetRouter.group_delall)
router.post('/meet/group_update', meetRouter.checkSuper, meetRouter.group_update)
router.post('/meet/event_info', meetRouter.checkSuper, meetRouter.event_info)
router.post('/meet/event_add', meetRouter.checkSuper, meetRouter.event_add)
router.post('/meet/event_close', meetRouter.checkSuper, meetRouter.event_close)
router.post('/meet/event_archive', meetRouter.checkSuper, meetRouter.event_archive)
router.get('/meet/event_cont', meetRouter.checkAuth, meetRouter.event_cont)
router.post('/meet/event_poll', meetRouter.checkAuth, meetRouter.event_poll)
router.get('/meet/students', meetRouter.checkSuper, meetRouter.students)
router.get('/meet/teams', meetRouter.checkSuper, meetRouter.team_all)
router.post('/meet/team_add', meetRouter.checkSuper, meetRouter.team_add)
router.post('/meet/team_score', meetRouter.checkSuper, meetRouter.team_score)
router.post('/meet/team_delete', meetRouter.checkSuper, meetRouter.team_delete)
router.post('/meet/team_update', meetRouter.checkSuper, meetRouter.team_update)


var requestp = require('request-promise');
var oauth = require('../oauth/config');

//redirect user to authorization page 
router.get('/auth/login', function (req, res) {
  req.session.qs = req.query.qs;
  res.redirect(oauth.url);
});

//set redirect url as localhost:3000/auth
router.get('/auth', function (req, res, next) {
  const option_post = {
    method: 'POST',
    url: oauth.token_url,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    formData: {
      'grant_type': 'authorization_code',
      'code': req.query.code,
      'client_id': oauth.client_id,
      'client_secret': oauth.client_secret,
      'redirect_uri': oauth.redirect_url
    },
    json: true
  };

  requestp(option_post)
    .then(response => {
      console.log('post to get access token');
      const option_get = {
        uri: oauth.profile_url,
        headers: {
          Authorization: 'Bearer ' + response.access_token
        },
        json: true
      };
      requestp(option_get)
        .then(body => {
          req.session.profile = body;
          console.log(body);
          next();
        })
        .catch(err => {
          console.log(err);
        })

    })
    .catch(err => {
      console.log(err);
    });
}, function (req, res) {
  console.log(req.session.profile.username);
  if (req.session.profile) {
    var ID = req.session.profile.username;
    if (!ID) {
      console.log("no student id");
      // (modify)
      res.redirect('https://xmas.csunion.nctu.me/login');
      return;
    }
    console.log(ID);
    // (modify)
    if (req.session.qs === undefined || req.session.qs.length === 0)
      res.redirect('https://xmas.csunion.nctu.me');
    else
      res.redirect('https://xmas.csunion.nctu.me?' + req.session.qs);
  }
});

router.get('/auth/check_id', function (req, res) {
  if (req.session.profile) {
    const { id: username, ...profile } = req.session.profile;
    res.json({ ...profile, id });
  }
  else {
    res.json({ id: 0 });
  }
});

router.get('/auth/logout', function (req, res) {
  req.session.destroy();
});

module.exports = router;
