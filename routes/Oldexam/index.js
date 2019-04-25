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
		var form = new formidable.IncomingForm()
		var iid, cid, eid
		console.log('haha')
		form.parse(req, function(err, fields, files){
			oldexam_pool.getConnection(function(err, connection){
				connection.query(sql.oldexamInstruCheck, [fields.instructor], function(err, result){
					if (result[0] === undefined){
						connection.query(sql.oldexamInstruNew, [fields.instructor], function(err, result_new){
							if(err)	throw err
							else console.log('insert new instructor succeed!')
						})
					}
				})
				connection.query(sql.oldexamInstruCheck, [fields.instructor], function(err, iid){
					if(err) throw err
					else console.log('iid: '+iid)
				})
				connection.query(sql.oldexamCourseCheck, [fields.course], function(err, result){
					if(result[0] === undefined){
						connection.query(sql.oldexamCourseNew, [fields.course, fields.category], function(err, result_new){
							if(err) throw err
							else console.log('insert new course succeed!')
						})
					}
				})
				connection.query(sql.oldexamCourseCheck, [fields.course], function(err, cid){
					if(err) throw err
					else console.log('cid: '+cid)
				})
				connection.query(sql.oldexamUpload, [cid.cid, fields.uid, iid.iid, fields.semester, fields.type, fields.filename, new Date()], function(err, eid){
					if(err) throw err
					else console.log('Old exam insert succeed! eid: '+eid.insertId)
				})

				console.log(fields.filename)
				var oldpath = files.file.path
				var newpath = '/usr/local/www/apache24/data/oldexam/exam/' + eid.insertId
				fs.readFile(oldpath, function (err, data) {
				    if (err) throw err;
				    console.log('File read!');

				    // Write the file
				    fs.writeFile(newpath, data, function (err) {
						if (err) throw err;
						res.write('File uploaded and moved!');
						res.end();
						console.log('File written!');
				    });

				    // Delete the file
				    fs.unlink(oldpath, function (err) {
						if (err) throw err;
						console.log('File deleted!');
				    });
				});
			})

		})
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
