var express = require('express');
var router = express.Router();

var mysql = require('mysql')
var dbconfig = require('../db/config')
var sql = require('../db/sql')
var cs_pool = mysql.createPool(dbconfig.csunion)
//var oldexam_pool = mysql.createPool(dbconfig.oldexam)

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
	if(req.session.qs == undefined)
        	res.redirect('https://xmas.csunion.nctu.me');
	else
        	res.redirect('https://xmas.csunion.nctu.me?'+req.session.qs);
    }
});

router.get('/auth/check_id', function(req, res){
	if(req.session.profile){
		res.json({id:req.session.profile.username});
	}
	else{
		res.json({id: 0});
	}
});

router.get('/auth/logout', function(req, res){
    req.session.destroy(); 
    // (modify)
    res.redirect('https://xmas.csunion.nctu.me/login');
});


module.exports = router;
