var mysql = require('mysql')
var dbconfig = require('../../db/config')
var sql = require('../../db/sql')
var cs_pool = mysql.createPool(dbconfig.csunion)
var path = require('path')
var auth = require('./auth')

module.exports = {
	studentList: function (req, res, next) {
		if (!req.session.fee_login)
			res.sendStatus(401)
		cs_pool.getConnection(function (err, connection) {
			connection.query(sql.getStudent, function (err, result) {
				res.json(result)
				connection.release()
			})
		}
		)
	},
	payList: function (req, res, next) {
		if (!req.session.fee_login)
			res.sendStatus(401)
		cs_pool.getConnection(function (err, connection) {
			console.log(req.body)
			connection.query(sql.payFee, [req.body.id], function (err, result) {
				if (err) {
					res.json({ success: false })
				}
				else {
					res.json({ id: req.body.id, success: (result.changedRows === 1) })
				}
				connection.release()
			})
		}
		)
	},
	check_auth: function (req, res, next) {
		if (req.session.fee_login)
			res.send('logged')
		else
			res.send('')
	},
	login: function (req, res, next) {
		const username = req.body.username
		const password = req.body.password
		if (auth.hasOwnProperty(username) && auth[username] === password) {
			req.session.fee_login = username
			res.send('success')
		}
		else
			res.send('')
	},
	logout: function (req, res, next) {
		req.session.destroy()
		res.send('')
	}
}
