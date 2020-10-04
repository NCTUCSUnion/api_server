const mysql = require('mysql')
const dbconfig = require('../../db/config')
const sql = require('../../db/sql')
const pool = mysql.createPool(dbconfig.meet)
const pool2 = mysql.createPool(dbconfig.csunion)
const auth = require('./auth')

function addScoreToAll(eid, scores, conn) {
    return Promise.all(scores.map(function (item, idx, arr) {
        return new Promise((resolve, reject) => {
            conn.query(sql.meet_addScore2CorrectPoll, [scores[idx].score, eid, scores[idx].poll], function (err, result) {
                if (err)
                    reject(err)
                else
                    resolve()
            })
        });
    }))
}

module.exports = {
    checkAuth: function (req, res, next) {
        if (!req.session.meet_profile)
            res.sendStatus(401)
        else {
            next()
        }
    },
    checkSuper: function (req, res, next) {
        if (!req.session.meet_profile || !req.session.meet_profile.isSuper)
            res.sendStatus(401)
        else {
            next()
        }
    },
    check: function (req, res) {
        if (req.session.meet_profile) {
            if (req.session.meet_profile.isSuper) {
                res.json({ logined: true, isSuper: true })
            }
            else {
                pool.getConnection(function (err, conn) {
                    if (err) {
                        res.json({ logined: true, isSuper: false, group: req.session.meet_profile })
                        conn.release()
                    }
                    else {
                        conn.query(sql.meet_getGroupInfo, [req.session.meet_profile.gid,], function (err, result) {
                            if (result && result[0] !== undefined) {
                                res.json({ logined: true, isSuper: false, group: result[0] })
                            }
                            else {
                                res.json({ logined: true, isSuper: false, group: req.session.meet_profile })
                            }
                            conn.release()
                        })
                    }
                })
            }
        }
        else {
            res.json({ logined: false })
        }
    },
    login: function (req, res) {
        if (req.session.meet_profile) {
            if (req.session.meet_profile.isSuper) {
                res.json({ logined: true, isSuper: true })
            }
            else {
                res.json({ logined: true, isSuper: false, group: req.session.meet_profile })
            }
        }
        else {
            const gid = req.body.gid
            const passwd = req.body.passwd
            if (auth.check(gid, passwd)) {
                req.session.meet_profile = { isSuper: true }
                res.json({ logined: true, isSuper: true })
            }
            else {
                pool.getConnection(function (err, conn) {
                    if (err) {
                        res.json({ logined: false })
                    }
                    else {
                        conn.query(sql.meet_getGroupInfo, [gid,], function (err, result) {
                            if (result && result[0] !== undefined) {
                                const id1 = result[0].id1
                                const id2 = result[0].id2
                                if (id1.substr(id1.length - 3, 3).concat(id2.substr(id2.length - 3, 3)) === passwd) {
                                    req.session.meet_profile = result[0]
                                    res.json({ logined: true, isSuper: false, group: result[0] })
                                }
                                else {
                                    res.json({ logined: false })
                                }
                            }
                            else {
                                res.json({ logined: false })
                            }
                            conn.release()
                        })
                    }
                })
            }
        }
    },
    logout: function (req, res) {
        if (req.session.meet_profile) {
            req.session.meet_profile = undefined
        }
        res.end()
    },
    group_add: function (req, res) {
        const id1 = req.body.id1
        const id2 = req.body.id2
        if (id1.match(/^\d\d\d\d\d\d\d(\d\d)?$/) && id2.match(/^\d\d\d\d\d\d\d(\d\d)?$/)) {
            pool.getConnection(function (err, conn) {
                conn.query(sql.meet_getLastGID, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                        conn.release()
                    }
                    else {
                        var gid
                        if (result[0] === undefined) {
                            gid = 1
                        }
                        else {
                            gid = result[0].gid + 1
                        }
                        conn.query(sql.meet_addGroup, [gid, id1, id2], function (err, result) {
                            if (err) {
                                res.json({ success: false })
                            }
                            else {
                                res.json({ success: true, gid: gid })
                            }
                            conn.release()
                        })
                    }
                })
            })
        }
        else
            res.json({ success: false })
    },
    group_all: function (req, res) {
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getGroups, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                    }
                    else {
                        res.json({ success: true, groups: result })
                    }
                })
            }
            conn.release()
        })
    },
    group_del: function (req, res) {
        const gid = req.body.gid
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getGroupInfo, [gid,], function (err, result) {
                    if (result && result[0] !== undefined) {
                        conn.query(sql.meet_delGroup, [gid,], function (err, result) {
                            if (err) {
                                res.json({ success: false })
                            }
                            else {
                                res.json({ success: true })
                            }
                            conn.release()
                        })
                    }
                    else {
                        res.json({ success: false })
                        conn.release()
                    }
                })
            }
        })
    },
    group_delall: function (req, res) {
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_delGroupAll, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                    }
                    else {
                        res.json({ success: true })
                    }
                    conn.release()
                })
            }
        })
    },
    group_update: function (req, res) {
        const gid = req.body.gid
        const add = req.body.add
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getGroupInfo, [gid,], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                        conn.release()
                    }
                    else if (result[0] === undefined) {
                        res.json({ success: false, error: "組別不存在！" })
                        conn.release()
                    }
                    else {
                        conn.query(sql.meet_updateScore, [add, gid], function (err, result) {
                            if (err) {
                                res.json({ success: false })
                            }
                            else {
                                res.json({ success: true })
                            }
                            conn.release()
                        })
                    }
                })
            }
        })
    },
    event_info: function (req, res) {
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getLastEvent, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                        conn.release()
                    }
                    else if (result[0] === undefined) {
                        res.json({ success: true, state: "NONE" })
                        conn.release()
                    }
                    else {
                        const eid = result[0].eid
                        const state = result[0].state
                        const choices = result[0].choices
                        if (state === 0) {
                            res.json({ success: true, state: "NONE" })
                            conn.release()
                        }
                        else {
                            conn.query(sql.meet_pollResult, [eid,], function (err, result) {
                                if (err) {
                                    res.json({
                                        success: true, state: state === 1 ? "OPEN" : "CLOSE", choices: 0, result: []
                                    })
                                }
                                else {
                                    res.json({
                                        success: true, state: state === 1 ? "OPEN" : "CLOSE", choices: choices, result: result
                                    })
                                }
                                conn.release()
                            })
                        }
                    }
                })
            }
        })
    },
    event_add: function (req, res) {
        const choices = req.body.choices
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getLastEvent, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                        conn.release()
                    }
                    else if (result[0] !== undefined && result[0].state > 0) {
                        res.json({ success: false, error: "有尚未關閉的投票事件！" })
                        conn.release()
                    }
                    else {
                        conn.query(sql.meet_addEvent, [choices, 1], function (err, result) {
                            if (err) {
                                res.json({ success: false })
                            }
                            else {
                                res.json({ success: true })
                            }
                            conn.release()
                        })
                    }
                })
            }
        })
    },
    event_close: function (req, res) {
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getLastEvent, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                        conn.release()
                    }
                    else if (result[0] !== undefined && result[0].state !== 1) {
                        res.json({ success: false, error: "沒有進行中的事件！" })
                        conn.release()
                    }
                    else {
                        const eid = result[0].eid
                        conn.query(sql.meet_closeEvent, [eid,], function (err, result) {
                            if (err) {
                                res.json({ success: false })
                            }
                            else {
                                res.json({ success: true })
                            }
                            conn.release()
                        })
                    }
                })
            }
        })
    },
    event_archive: function (req, res) {
        const scores = req.body.scores
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getLastEvent, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                        conn.release()
                    }
                    else if (result[0] !== undefined && result[0].state !== 2) {
                        res.json({ success: false, error: "沒有進行中的事件！" })
                        conn.release()
                    }
                    else {
                        const eid = result[0].eid
                        addScoreToAll(eid, scores, conn).finally(function () {
                            conn.query(sql.meet_archiveEvent, [eid,], function (err, result) {
                                res.json({ success: true })
                                conn.release()
                            })
                        })
                    }
                })
            }
        })
    },
    event_cont: function (req, res) {
        pool.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_getLastEvent, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                    }
                    else if (result[0] === undefined) {
                        res.json({ success: true, state: "NONE" })
                    }
                    else {
                        const state = result[0].state
                        if (state !== 0) {
                            const choices = result[0].choices
                            res.json({ success: true, state: state === 1 ? "OPEN" : "CLOSE", choices: choices })
                        }
                        else {
                            res.json({ success: true, state: "NONE" })
                        }
                    }
                    conn.release()
                })
            }
        })
    },
    event_poll: function (req, res) {
        const gid = req.body.gid
        const poll = req.body.poll
        if (req.session.meet_profile.gid === gid) {
            pool.getConnection(function (err, conn) {
                if (err) {
                    res.json({ success: false })
                }
                else {
                    conn.query(sql.meet_getLastEvent, [], function (err, result) {
                        if (err) {
                            res.json({ success: false })
                            conn.release()
                        }
                        else if (result[0] === undefined) {
                            res.json({ success: false })
                            conn.release()
                        }
                        else {
                            const eid = result[0].eid
                            const state = result[0].state
                            const choices = result[0].choices
                            if (state !== 1) {
                                res.json({ success: false })
                                conn.release()
                            }
                            else if (choices !== 0 && (poll < 1 || poll > choices)) {
                                res.json({ success: false })
                                conn.release()
                            }
                            else {
                                conn.query(sql.meet_checkHasPolled, [eid, gid,], function (err, result) {
                                    if (err) {
                                        res.json({ success: false })
                                        conn.release()
                                    }
                                    else if (result[0] === undefined) {
                                        conn.query(sql.meet_addPoll, [eid, gid, poll,], function (err, result) {
                                            if (err) {
                                                res.json({ success: false })
                                            }
                                            res.json({ success: true })
                                            conn.release()
                                        })
                                    }
                                    else {
                                        conn.query(sql.meet_updatePoll, [poll, eid, gid,], function (err, result) {
                                            if (err) {
                                                res.json({ success: false })
                                            }
                                            res.json({ success: true })
                                            conn.release()
                                        })
                                    }
                                })
                            }
                        }
                    })
                }
            })
        }
        else {
            res.json({ success: false })
        }
    },
    students: function (req, res) {
        pool2.getConnection(function (err, conn) {
            if (err) {
                res.json({ success: false })
            }
            else {
                conn.query(sql.meet_students, [], function (err, result) {
                    if (err) {
                        res.json({ success: false })
                    }
                    else {
                        res.json({ success: true, all: result })
                    }
                    conn.release()
                })
            }
        })
    }
}