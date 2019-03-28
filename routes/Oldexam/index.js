var mysql = require('mysql')
var dbconfig = require('../../db/config')
var sql = require('../../db/sql')
var path = require('path')
var oldexam_pool = mysql.createPool(dbconfig.oldexam)

module.exports = {
	getCourse: function(req,res,next){
		oldexam_pool.getConnection(function(err,connection){
	       	connection.query(sql.getCourse,function(err,result){
		res.json(result)
		connection.release()
	       })
	     }
	   )
	 },
 	getExam: function(req,res,next){
		oldexam_pool.getConnection(function(err,connection){
		var param = req.query || req.params
	   	connection.query(sql.getList,[param.id],function(err,result){
		res.json(result)
		connection.release()
	       })
	     }
	   )
	 },
	uploadExam: function(req, res){
		console.log(req.file.original)
	},
 	downloadExam: function(req, res){
		var file = req.query.eid
		var fileLocation = path.join('/usr/local/www/apache24/data/oldexam/exam', file.toString()) //'STBOD.pdf')	
		res.download(fileLocation, req.query.fn, function(err){
			if(err){
				console.log(err)	
			}
			else{
				console.log('else!')
			}
		})
 	},
	examDest: function(req, file, cb){
		cb(null, '/usr/local/www/apache24/data/oldexam/exam')
	},
	examDB: function(req, file, cb){
	  var values = [[req.body.cid, req.body.id, req.body.id, req.body.iid, req.body.semester, req.body.type, file.originalname, req.body.comment, new Date()]]
	  oldexam_pool.getConnection(function(err, connection){
	  	connection.query(sql.uploadExam, [values],function(err, result){
			if(err) throw err
			cb(null, result.inserId.toString())
			connection.release()
	  	})
	  })
	}
//	loginOldexam: 
}


//var multer = require('multer')
//var storage = multer.diskStorage({
//	destination: function(req, file, cb){
//	  cb(null, '/usr/local/www/apache24/data/oldexam/exam')
//	},
//	filename: function(req, file, cb){
//	  var values = [[req.body.cid, req.body.id, req.body.id, req.body.iid, req.body.semester, req.body.type, file.originalname, req.body.comment, new Date()]]
//	  oldexam_pool.getConnection(function(err, connection){
//	  	connection.query(sql.uploadExam, [values],function(err, result){
//			if(err) throw err
//			cb(null, result.inserId.toString())
//			connection.release()
//	  	})
//	  })
//	}
//})
//var upload = multer({storage: storage})
//
// router.get('/course',function(req,res,next){
//   oldexam_pool.getConnection(function(err,connection){
//       connection.query(sql.getCourse,function(err,result){
//         res.json(result)
//         connection.release()
//       })
//     }
//   )
// })

// router.get('/exam',function(req,res,next){
//   oldexam_pool.getConnection(function(err,connection){
//     var param = req.query || req.params
//     connection.query(sql.getList,[param.id],function(err,result){
//         res.json(result)
//         connection.release()
//       })
//     }
//   )
// })

// router.post('/upload', upload.single('oldexam'), function(req, res){
// 	console.log(req.file.original)
// })
//
// router.post('/download', function(req, res){
// 	var file = req.body.eid
// 	var fileLocation = path.join('/usr/local/www/apache24/data/oldexam/exam', file.toString())
// 	res.download(fileLocation, req.body.filename)
// })
//		var param = req.query || req.params
//		oldexam_pool.getConnection(function(err,connection){
//		connection.query(sql.getFn,[param.id],function(err,result){
//			var fn = result[0].filename
//			connection.release()
//		})
//	        })
//		var fileLocation = path.join('/usr/local/www/apache24/data/oldexam/exam', param.id)	
//		res.download(fileLocation,fn)
