var express = require('express');
var router = express.Router();

var mysql = require('mysql')
var dbconfig = require('../db/config')
var sql = require('../db/sql')
var cs_pool = mysql.createPool(dbconfig.csunion)
//var oldexam_pool = mysql.createPool(dbconfig.oldexam)

router.get('/students',function(req,res,next){
  cs_pool.getConnection(function(err,connection){
      connection.query(sql.getStudent,function(err,result){
        res.json(result)
        connection.release()
      })
    }
  )
})


router.post('/pay',function(req,res,next){
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
})

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

router.post('/merryweek/load',function(req,res,next){
  cs_pool.getConnection(function(err,connection){
      connection.query(sql.merryweekCheck,[req.body.id],function(err,result){
        if(err){
          console.error(err)
        }
        else{
          if(result.length === 0){
		  var paid;
		connection.query(sql.checkPay,[req.body.id],function(err,result){
			console.log(result)
			if(err) 
				console.error(err)
			else{
				if(result.length ===0){
					paid = 0;	
				}
				else{
					paid = result[0].paid;
				}
			}
            connection.query(sql.merryweekNew,[req.body.id],function(err,result){
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
    var game = ["shootingStar","gingerbread","pokemonGo","balloonWall","hunterxhunter","partyTicket"][req.body.code]
    var sql = `UPDATE xmasweek SET ${game[req.body.game]} = 1 WHERE xmasweek.id = ${req.body.id}`
    connection.query(sql,function(err,result){
      if(err){
        console.error(err)
      }
      else{
        res.json({success:(result.changedRows === 1)})
      }
      connection.release()
    })
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
        if(first){
          connection.query(`UPDATE xmasweek SET shootingStar = 1 WHERE xmasweek.id = ${req.body.id}`
          ,function(err,result){
            if(err){
              console.error(err)
            }
            else{
              res.json({success:(result.changedRows === 1)})
            }
          })
        }
        res.json({success:(result.changedRows === 1)})
      }
      connection.release()
    })
  })
})

module.exports = router;
