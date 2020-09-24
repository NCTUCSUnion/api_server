var mysql = require('mysql')
var dbconfig = require('../../db/config')
var sql = require('../../db/sql')
var path = require('path')
var oldexam_pool = mysql.createPool(dbconfig.oldexam)
var formidable = require('formidable')
var async = require('async')
var fs = require('fs')

module.exports = {
	getCourse: function (req, res, next) {
		oldexam_pool.getConnection(function (err, connection) {
			connection.query(sql.getCourse, function (err, result) {
				res.json(result)
				connection.release()
			})
		}
		)
	},
	getTeacher: function (req, res, next) {
		oldexam_pool.getConnection(function (err, connection) {
			connection.query(sql.getTeacher, function (err, result) {
				res.json(result)
				connection.release()
			})
		}
		)
	},
	getExam: function (req, res, next) {
		oldexam_pool.getConnection(function (err, connection) {
			var param = req.query || req.params
			connection.query(sql.getList, [param.id], function (err, result) {
				res.json(result)
				connection.release()
			})
		}
		)
	},
	uploadExam: function (req, res) {
		if (!req.session.profile)
			res.sendStatus(401)
		var form = new formidable.IncomingForm()
		var iID, cID, eID, type
		form.parse(req, function (err, fields, files) {
			oldexam_pool.getConnection(function (err, connection) {
				async.series([
					function (next) {
						connection.query(sql.oldexamInstruCheck, [fields.instructor.toString().trim()], function (err, result) {
							if (result[0] === undefined) {
								connection.query(sql.oldexamInstruNew, [fields.instructor.toString().trim()], function (err, result_new) {
									if (err) throw err
									else console.log('insert new instructor succeed!')
								})
							}
							next(err, result)
						})
					},
					function (next) {
						connection.query(sql.oldexamInstruCheck, [fields.instructor.toString().trim()], function (err, iid) {
							if (err) throw err
							else {
								iID = parseInt(iid[0].iid)
								console.log('query iid:' + iid[0].iid)
							}
							next(err, iid)
						})
					},
					function (next) {
						connection.query(sql.oldexamCourseCheck, [fields.course.toString().trim()], function (err, result) {
							if (result[0] === undefined) {
								connection.query(sql.oldexamCourseNew, [fields.course.toString().trim(), fields.category.toString().trim()], function (err, result_new) {
									if (err) throw err
									else console.log('insert new course succeed!')
								})
							}
							next(err, result)
						})
					},
					function (next) {
						connection.query(sql.oldexamCourseCheck, [fields.course.toString().trim()], function (err, cid) {
							if (err) throw err
							else {
								cID = parseInt(cid[0].cid)
								console.log('query cid:' + cID)
							}
							next(err, cid)
						})
					},
					function (next) {
						// process type
						switch (fields.type) {
							case "期中考":
								type = 'midterm'
								break
							case "期末考":
								type = 'final'
								break
							case "小考":
								type = 'test'
								break
							default:
								type = 'other'
						}
						next(null, type)
					},
					function (next) {
						console.log('----------query para check----------')
						console.log('cid', cID);
						console.log('uid', fields.uid);
						console.log('iid', iID);
						console.log('semester', fields.semester);
						console.log('type', type);
						console.log('filename', fields.filename);
						console.log(new Date())
						console.log('------------------------------------')

						connection.query(sql.oldexamUpload, [cID, fields.uid, fields.uid, iID, fields.semester, type, fields.filename, new Date()], function (err, eid) {
							console.log('upload query!')
							if (err) throw err
							else {
								console.log(eid);
								eID = eid.insertId
								console.log('Old exam insert succeed! eid:' + eID)
							}
							next(err, eID)
						})
					},
					function (next) {
						console.log(eID)
						var oldpath = files.file.path
						var newpath = '/usr/local/www/apache24/data/oldexam/exam/' + eID
						fs.readFile(oldpath, function (err, data) {
							if (err) throw err;
							console.log('File read!');

							// Write the file
							fs.writeFile(newpath, data, function (err) {
								if (err) throw err;
								else {
									console.log('File written!');
									// Delete the file
									fs.unlink(oldpath, function (err) {
										if (err) throw err;
										console.log('File deleted!');
									});
									res.write('File uploaded and moved!');
								}
								res.end();
							});

							next(err, newpath)
						})
					}], function (err, results) {
						console.log('last callback check eid:' + eID)
					}
				)
			})

		})
	},
	downloadExam: function (req, res) {
		var file = req.query.eid.toString().trim()
		oldexam_pool.getConnection(function (err, connection) {
			connection.query(sql.oldexamCheckFileExist, [file], function (err, result) {
				if (result) {
					var fileLocation = path.join('/usr/local/www/apache24/data/oldexam/exam', file)
					res.download(fileLocation, req.query.fn, function (err) {
						if (err) {
							console.log(err)
						}
						else {
							console.log('else!')
						}
					})
				}
				else {
					res.sendStatus(404)
				}
			})
		})
	},
	examDest: function (req, file, cb) {
		cb(null, '/usr/local/www/apache24/data/oldexam/exam')
	},
	examDB: function (req, file, cb) {
		var values = [[req.body.cid, req.body.id, req.body.id, req.body.iid, req.body.semester, req.body.type, file.originalname, req.body.comment, new Date()]]
		oldexam_pool.getConnection(function (err, connection) {
			connection.query(sql.uploadExam, [values], function (err, result) {
				if (err) throw err
				cb(null, result.inserId.toString())
				connection.release()
			})
		})
	}
}

