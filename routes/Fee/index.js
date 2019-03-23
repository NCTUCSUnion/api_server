var mysql = require('mysql')
var dbconfig = require('../../db/config')
var sql = require('../../db/sql')
var cs_pool = mysql.createPool(dbconfig.csunion)
var path = require('path')

module.exports = {
	studentList: function(req,res,next){
	  cs_pool.getConnection(function(err,connection){
	      connection.query(sql.getStudent,function(err,result){
		res.json(result)
		connection.release()
	      })
	    }
	  )
	},
	payList: function(req,res,next){
	  cs_pool.getConnection(function(err,connection){
	      console.log(req.body)
	      connection.query(sql.payFee,[req.body.id],function(err,result){
		if(err){
		  res.json({success:false})
		}
		else{
		  res.json({id:req.body.id,success:(result.changedRows === 1)})
		}
		connection.release()
	      })
	    }
	  )
	}
}
