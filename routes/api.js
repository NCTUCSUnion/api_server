var express = require('express');
var router = express.Router();

var mysql = require('mysql')
var dbconfig = require('../db/config')
var sql = require('../db/sql')
var cs_pool = mysql.createPool(dbconfig.csunion)
var oldexam_pool = mysql.createPool(dbconfig.oldexam)
var path = require('path')

var oldexamRouter = require('./Oldexam')
var oldexamOauth = require('./Oldexam/oauth')

var feeRouter = require('./Fee')

var chatbotRouter = require('./Chatbot')

var fs = require('fs')
var formidable = require('formidable')

//oldexam
var multer = require('multer')
var storage = multer.diskStorage({
	destination: oldexamRouter.examDest,
	filename: oldexamRouter.examDB
})
var upload = multer({storage: storage})
router.get('/oldexam/course', oldexamRouter.getCourse)
router.get('/oldexam/exam', oldexamRouter.getExam)
router.get('/oldexam/teacher', oldexamRouter.getTeacher)
//router.post('/oldexam/upload', upload.single('oldexam'), oldexamRouter.uploadExam)
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

//christmas week
router.post('/merryweek/load',function(req,res,next){
  cs_pool.getConnection(function(err,connection){
	  console.log(req.body.id)
      connection.query(sql.merryweekCheck,[req.body.id],function(err,result){
        if(err){
          console.error(err)
        }
        else{
          if(result.length === 0){
		  var paid=0;
		connection.query(sql.checkPay,[req.body.id],function(err,result){
			console.log('check')
			if(err) 
				console.error(err)
			else{
				if(result.length ===0){
					connection.query(sql.merryweekNotPaid,[req.body.id],function(err,result){
						if(err) console.error(err)
						else{
							paid = 0;
						}
					})
				}
				else{
					paid = result[0].paid;
				}
			}
			console.log(req.body.id)
            connection.query(sql.merryweekNew,[req.body.id],function(err,result){
              console.log("result")
		    console.log(result)
                if(err){
                  console.error(err)
                }
                else{
                  res.json({
                    code: `${paid}${paid}0000000`
                  })
                }
            })
          })}
          else{
            res.json({
              code: "".concat(
                result[0].paid,
                result[0].paid,
                result[0].shootingStar,
                result[0].gingerbread,
                result[0].pokemonGo,
                result[0].balloonWall,
                result[0].hunterxhunter,
                result[0].partyTicket,
                result[0].partyTicket)
            })
          }
        }
        connection.release()
      })
    }
  )
})

router.post('/merryweek/update',function(req,res,next){
  cs_pool.getConnection(function(err,connection){
    var index = [
	"GlaHquq0",
	"AJvHqumA",
	"GmPHKT5d",
	"GQ2HMTa0",
	"ABaHXuw0",
	"03jH3ueX"]
    var game = {
	"GlaHquq0"   :  "shootingStar",
	"AJvHqumA"   :  "gingerbread",
	"GmPHKT5d"   :  "pokemonGo",
	"GQ2HMTa0"   :  "balloonWall",
	"ABaHXuw0"   :  "hunterxhunter",
	"03jH3ueX"   :  "partyTicket"
    }
      connection.query(sql.merryweekCheck,[req.body.id],function(err,result){
        if(err){
          console.error(err)
        }
        else{
          if(result.length === 0){
            connection.query(sql.merryweekNew,[req.body.id],function(err,result){
                if(err){
                  console.error(err)
                }
                else{
			console.log(req.body.code)
    connection.query(`UPDATE xmasweek SET ${game[req.body.code]} = 1 WHERE xmasweek.id = ${req.body.id}`
,function(err,result){
      if(err){
        console.error(err)
      }
      else{
              console.log(result)
        res.json({success:(result.changedRows === 1),which: index.indexOf(req.body.code)})
      }
      connection.release()
    })

                  }})
            }
	else{
			console.log(req.body.code)
    connection.query(`UPDATE xmasweek SET ${game[req.body.code]} = 1 WHERE xmasweek.id = ${req.body.id}`
,function(err,result){
      if(err){
        console.error(err)
      }
      else{
        res.json({success:(result.changedRows === 1),which: index.indexOf(req.body.code)})
      }
      connection.release()
    })
	}
	}})
  })
})

router.post('/merryweek/upload',function(req,res,next){
  cs_pool.getConnection(function(err,connection){
    connection.query(sql.merryweekUpload,[
      req.body.id, req.body.url, req.body.title, req.body.description
    ],function(err,result){
      if(err){
        console.error(err)
      }
      else{
        if(req.body.first){
          connection.query(`UPDATE xmasweek SET shootingStar = 1 WHERE xmasweek.id = ${req.body.id}`
          ,function(err,result){
            if(err){
              console.error(err)
            }
            else{
		   console.log(result.changedRows)
              res.json({success:(result.changedRows === 1)})
            }
          })
        }
	 else
           res.json({success:(result.changedRows === 1)})
      }
      connection.release()
    })
  })
})

var requestp = require('request-promise');
var oauth = require('../oauth/config');

//redirect user to authorization page 
router.get('/auth/login', function(req, res){
    req.session.qs = req.query.qs;
    res.redirect(oauth.url);
});

//set redirect url as localhost:3000/auth
router.get('/auth', function(req, res, next){
    var requestCode = req.query.code;

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
    .then( response => {
	  	console.log('post to get access token');
        const option_get = {
            uri: oauth.profile_url,
            headers:{
                Authorization: 'Bearer ' + response.access_token
            },
            json: true
        };
        requestp(option_get)
        .then( body => {
            req.session.profile = body;
            console.log(body);
            next();
        })
        .catch( err => {
            console.log(err);
        })

    })
    .catch( err => {
        console.log(err);
    });
}, function(req, res){
    console.log(req.session.profile.username);
    if(req.session.profile){
        var ID = req.session.profile.username;
        if(!ID){
            console.log("no student id");
            // (modify)
            res.redirect('https://xmas.csunion.nctu.me/login');
            return;
        }
        console.log(ID);
        // (modify)
	if(req.session.qs === undefined || req.session.qs.length === 0)
        	res.redirect('https://xmas.csunion.nctu.me');
	else
        	res.redirect('https://xmas.csunion.nctu.me?'+req.session.qs);
    }
});

router.get('/auth/check_id', function(req, res){
	if(req.session.profile){
		const { id:username, ...profile} = req.session.profile;
		res.json({...profile, id});
	}
	else{
		res.json({id: 0});
	}
});

router.get('/auth/logout', function(req, res){
    req.session.destroy();
});

module.exports = router;
