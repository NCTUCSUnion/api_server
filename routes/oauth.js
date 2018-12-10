var express = require('express');
var router = express.Router();
var requestp = require('request-promise');
var oauth = require('../oauth/config');

//redirect user to authorization page 
router.get('/auth/login', function(req, res){
    res.redirect(oauth.url);
});

//set redirect url as localhost:3000/auth
router.all('/auth', function(req, res, next){
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
            res.redirect('/');
            return;
        }
        console.log(ID);
        // (modify)
        res.redirect('/');  
    }
});

router.get('/logout', function(req, res){
    req.session.destroy(); 
    // (modify)
    res.redirect('/');
})



module.exports = router;