var request = require('request');
var mysql = require('mysql')
var dbconfig = require('../../db/config')
var sql = require('../../db/sql')
var discuz_pool = mysql.createPool(dbconfig.discuz)
var chatbot_pool = mysql.createPool(dbconfig.chatbot)
var chatbot_config = require('./config')

module.exports = {
	webhook: function(req, res){
		console.log(req.query['hub.verify_token'])
		if(req.query['hub.verify_token'] == 'testfordevelop') {
			res.send(req.query['hub.challenge'])
		}
		else{
			res.send('Error, Wrong token!!')
		}
	},
	webhookPost: function(req, res){
		console.log('Receive messages!')
		var recipient_id = req.body.entry[0].messaging[0].sender.id
		var recipient_name = req.body.entry[0].messaging[0].message.text

		console.log(recipient_id)
		console.log(recipient_name)


		chatbot_pool.getConnection(function(err, connection){
			connection.query(sql.chatbotRecipientCheck, [recipient_id], function(err, result){
			if(result[0] === undefined){
				connection.query(sql.chatbotRecipientNew, [recipient_name, recipient_id], function(err, result_insert){
				if(err) throw err
				else	console.log('Insert succeed!')
				connection.release()
				})
				request.post({
					headers: {'Content-Type': 'application/json'},
					url: chatbot_config.sendMessageAPI,
					json: {
					  "messaging_type": "RESPONSE",
					  "recipient": {
					    "id": recipient_id,
					  },
					  "message": {
					    "text": recipient_name,
					  }
					},
					function(error, response, body){
						if(error)	throw error
						else{
							console.log(body)
							console.log('First send')
							res.sendStatus(200)
						}
					}
				})
			}
			else{
				var msg
				if(recipient_name != undefined){
					if(recipient_name == '素' || recipient_name == '速' ||  recipient_name == '宿' || recipient_name == '塑'){
						connection.query(sql.angelaWho, [recipient_id],function(err, msg){
							console.log(msg)
							request.post({
								headers: {'Content-Type': 'application/json'},
								url: chatbot_config.sendMessageAPI,
								json: {
								  "messaging_type": "RESPONSE",
								  "recipient": {
									"id": recipient_id,
								  },
								  "message": {
									"text": "你的小主人是：" + msg[0].mname
								  }
								},
								function(error, response, body){
									if(error)	throw error
									else{
										console.log(body)
										console.log('Send back')
										res.sendStatus(200)
									}
								}
							})
						})
						connection.release()
					}	
					else if(recipient_name[0] == 's'){
						connection.query(sql.angelaScore, [recipient_name, recipient_id], function(err, result){
								if(err) throw err
								else	console.log('score received')
								connection.release()
						})
							request.post({
								headers: {'Content-Type': 'application/json'},
								url: chatbot_config.sendMessageAPI,
								json: {
								  "messaging_type": "RESPONSE",
								  "recipient": {
									"id": recipient_id,
								  },
								  "message": {
									"text": "你給這樣合理嗎？\n\n\n我說分數"
								  }
								},
								function(error, response, body){
									if(error)	throw error
									else{
										console.log(body)
										console.log('Send back')
										res.sendStatus(200)
									}
								}
							})
					}
					else if(recipient_name[0] == '誰'){
						connection.query(sql.angelaAns, [recipient_id], function(err, result){
								console.log(result[0].name)
							request.post({
								headers: {'Content-Type': 'application/json'},
								url: chatbot_config.sendMessageAPI,
								json: {
								  "messaging_type": "RESPONSE",
								  "recipient": {
									"id": recipient_id,
								  },
								  "message": {
									"text": "哈哈是 "+result[0].name+" 啦"
								  }
								},
								function(error, response, body){
									if(error)	throw error
									else{
										console.log(body)
										console.log('Send back')
										res.sendStatus(200)
									}
								}
							})
						})
								connection.release()
					}
					else if(recipient_name[0] == 'g'){
						connection.query(sql.angelaTry, [recipient_name, recipient_id], function(err, result){
								if(err) throw err
								else	console.log('guess received')
								connection.release()
						})
							request.post({
								headers: {'Content-Type': 'application/json'},
								url: chatbot_config.sendMessageAPI,
								json: {
								  "messaging_type": "RESPONSE",
								  "recipient": {
									"id": recipient_id,
								  },
								  "message": {
									"text": "想知道小天使是誰嗎？\n多跟大家蕉流蕉流啊"
								  }
								},
								function(error, response, body){
									if(error)	throw error
									else{
										console.log(body)
										console.log('Send back')
										res.sendStatus(200)
									}
								}
							})
					}
					else if(recipient_name == '有空'){
							request.post({
								headers: {'Content-Type': 'application/json'},
								url: chatbot_config.sendMessageAPI,
								json: {
								  "messaging_type": "RESPONSE",
								  "recipient": {
									"id": recipient_id,
								  },
								  "message": {
									"text": "我們黃金十二猛漢想要跟你蕉流蕉流"
								  }
								},
								function(error, response, body){
									if(error)	throw error
									else{
										console.log(body)
										console.log('Send back')
										res.sendStatus(200)
									}
								}
							})
					}
					else{
						request.post({
							headers: {'Content-Type': 'application/json'},
							url: chatbot_config.sendMessageAPI,
							json: {
							  "messaging_type": "RESPONSE",
							  "recipient": {
								"id": recipient_id,
							  },
							  "message": {
								"text": '我愛資工 資工NO.1 \n教召大家加油❤️🥰' 
							  }
							},
							function(error, response, body){
								if(error)	throw error
								else{
									console.log(body)
									console.log('Send back')
									res.sendStatus(200)
								}
							}
						})
					}
				}
			}
		})
		})

		res.sendStatus(200)

		console.log('over')
	},
	//webhookNoti: function(req, res){
	//},
	webhookNewPost: function(req, res){
		console.log('Receive new post!')
		console.log(req.query.tid)

		var tid = req.query.tid
		var fid = req.query.fid
		if(fid == chatbot_config.total_board){
			var recipList = sql.chatbotRecipientTotal
			var board = '總版'
		}
		else if(fid == chatbot_config.cadre_board){
			var recipList = sql.chatbotRecipientCadre
			var board = '大頭版'
		}
		else if(fid == chatbot_config.activity_board){
			var recipList = sql.chatbotRecipientActivity
			var board = '活動版'
		}
		else if(fid == chatbot_config.artistic_board){
			var recipList = sql.chatbotRecipientArtistic
			var board = '美宣版'
		}
		else if(fid == chatbot_config.training_board){
			var recipList = sql.chatbotRecipientTraining
			var board = '進修版'
		}
		else if(fid == chatbot_config.equipment_board){
			var recipList = sql.chatbotRecipientEquipment
			var board = '場器版'
		}
		else if(fid == chatbot_config.life_board){
			var recipList = sql.chatbotRecipientLife
			var board = '生活版'
		}
		else if(fid == chatbot_config.campfire_board){
			var recipList = sql.chatbotRecipientCampfire
			var board = '營火版'
		}

		console.log(recipList)
		console.log(board)
		
		//sql SELECT the recipients
		chatbot_pool.getConnection(function(err, connection){
			connection.query(recipList, function(err, result){
				connection.release()
				if(result === undefined)	throw err
				else{
						//sql SELECT the thread_topic
						discuz_pool.getConnection(function(err, connection){
							connection.query(sql.discuzThreadInfo, tid, function(err, result_thread){
								console.log(result_thread)
								connection.release()
								for(i = 0; result[i] != undefined; ++i){
										request.post({
											headers: {'Content-Type': 'application/json'},
											url: chatbot_config.sendMessageAPI,
											json: {
											  "messaging_type": "UPDATE",
											  "recipient": {
												"id": result[i].id
											  },
											  "message": {
												"text": board+' 有一篇新文章喔!\n'+result_thread[0].subject+' by '+result_thread[0].author+'\nhttp://csdiscuz.nctu.me/forum.php?mod=viewthread&tid='+req.query.tid
											  }
											},
											function(error, response, body){
												if(error)	throw error
												else console.log(body)
											}
										})
								}
							})
						})
				}	
			})
		})

		//for admin
		chatbot_pool.getConnection(function(err, connection){
			connection.query(sql.chatbotRecipientAdmin, function(err, result){
				connection.release()
				if(result === undefined)	throw err
				else{
						//sql SELECT the thread_topic
						discuz_pool.getConnection(function(err, connection){
							connection.query(sql.discuzThreadInfo, tid, function(err, result_thread){
								console.log(result_thread)
								connection.release()
								for(i = 0; result[i] != undefined; ++i){
										request.post({
											headers: {'Content-Type': 'application/json'},
											url: chatbot_config.sendMessageAPI,
											json: {
											  "messaging_type": "UPDATE",
											  "recipient": {
												"id": result[i].id
											  },
											  "message": {
												"text": board+' 有一篇新文章喔!\n'+result_thread[0].subject+' by '+result_thread[0].author+'\nhttp://csdiscuz.nctu.me/forum.php?mod=viewthread&tid='+req.query.tid
											  }
											},
											function(error, response, body){
												if(error)	throw error
												else console.log(body)
											}
										})
								}
							})
						})
				}	
			})
		})
		



		res.end()
	}
}
