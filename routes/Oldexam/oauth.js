var oauth = require('../../oauth/config')
var requestp = require('request-promise')

module.exports = {
//redirect user to authorization page 
	login: function(req, res){
	    req.session.qs = req.query.qs;
	    res.redirect(oauth.oldexam_url);
	},
	getToken: function(req, res, next){
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
		'client_id': oauth.oldexam_client_id,
		'client_secret': oauth.oldexam_client_secret,
		'redirect_uri': oauth.oldexam_redirect_url
		},
		json: true
	     };

	    requestp(option_post).then( response => {
			console.log('post to get access token');
		const option_get = {
		    uri: oauth.profile_url,
		    headers:{
			Authorization: 'Bearer ' + response.access_token
		    },
		    json: true
		};
		requestp(option_get).then( body => {
		    req.session.profile = body;
		    console.log(body);
		    next();
		}).catch( err => {
		    console.log(err);
		})

	    }).catch( err => {
		console.log(err);
	    });
	},
	getProfile: function(req, res){
	    console.log(req.session.profile.username);
	    if(req.session.profile){
		var ID = req.session.profile.username;
		if(!ID){
		    console.log("no student id");
		    // (modify)
		    res.redirect('https://pastexam.nctucsunion.me');
		    // res.redirect('http://localhost:3000');
		    return;
		}
		console.log(ID);
		// (modify)
		if(req.session.qs === undefined || req.session.qs.length === 0)
			res.redirect('https://pastexam.nctucsunion.me/main');
		    	// res.redirect('http://localhost:3000');
		else
			res.redirect('https://pastexam.nctucsunion.me/main');
		    	// res.redirect('http://localhost:3000/main');
	    }
	},
	check: function(req, res){
		if(req.session.profile){
			const { username: id, ...profile } = req.session.profile;
			res.json({id, ...profile});
		}
		else{
			res.json({id: 0});
		}
	},
	logout: function(req, res){
	    req.session.destroy(); 
	}
}
