'use strict'
var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index',
        {
            users: ["A","B","C","D","E"]
        }
    );
});

router.get('/notifications', function(req, res, next) {
    console.log(1, req.query.userId);
    User.findOne({userId : req.query.userId}, function(err, user){
        if(err)
            return next(err);
        else if(user){
            res.json({notifications : user.notifications, subscriptions : user.subscriptions,status : true});
        }
        else if(!user){
            var newuser = new User();
            newuser.userId = req.query.userId;
            newuser.notifications = [];
            newuser.activities = [];
            newuser.subscribers = [];
            newuser.subscriptions = [];
            newuser.save(function(err,user){
                if(err){}
                res.json({notifications : user.notifications, subscriptions : user.subscriptions,status : true});
            });
        }
    })
});

router.post('/subscribe', function(req, res, next) {
    var userId = req.body.userId;
    var subscriptions = req.body.subscriptions;

    User.findOneAndUpdate({"userId" : userId}, {$pushAll : {"subscriptions" : subscriptions}}, function(err,user){
        if(err){
            return next(err);
        }
        else if(user){
            var bulk = User.collection.initializeOrderedBulkOp();

            for(var i=0; i < subscriptions.length; i++){
                bulk.find({'userId': subscriptions[i]}).upsert().update({
                    $push : {subscribers: userId},
                });
            }
            bulk.execute(function(err, result){
                if(err){
                    return next(err);
                }
                else{
                    res.json({msg : "success", status : true});
                }
            });
        }
    })

});



module.exports = router;
