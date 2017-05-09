'use strict'

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var connectedUserToSocket = {};
var connectedSocketToUser = {};

var User = require('./models/user');

var routes = require('./routes/index');

var app = express();
app.io = require('socket.io')();
var io = app.io;
// data base connection
var DBconfig = require('./config/db');
mongoose.Promise = global.Promise;
mongoose.connect(DBconfig.url);

var db = mongoose.connection;

db.on('error',console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log('connected to db server successfully');
});
// database connection done


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')))

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('new activity', function(activity){
        console.log('new activity: ' + activity);
        var userId = connectedSocketToUser[socket.id];

        User.findOneAndUpdate({'userId' : userId}, {$push : { "activities" : activity}},{new : true}, function(err,user){
            if(err)
                return next(err);
            else if(user){
                var subscribers = user.subscribers;
                console.log(subscribers);
                var bulk = User.collection.initializeOrderedBulkOp();

                for(var i=0; i < subscribers.length; i++){
                    bulk.find({'userId': subscribers[i]}).update({
                        $push : {notifications: userId + ": " + activity},
                    });
                }
                bulk.execute(function(err, result){
                    if(err){
                        return next(err);
                    }
                });

                //notify all
                for(var i=0; i < subscribers.length; i++){
                    if(connectedUserToSocket[subscribers[i]]){
                        io.to(connectedUserToSocket[subscribers[i]]).emit('new notification',userId + ": "+ activity);
                    }
                };
            }
        })

        console.log(connectedSocketToUser);
        console.log(connectedUserToSocket);
    });

    socket.on('connect user', function(userId){
        console.log("user connected : " + userId + " " + socket.id);
        connectedUserToSocket[userId] = socket.id;
        connectedSocketToUser[socket.id] = userId;
    });

    socket.on('disconnect', function() {
        delete connectedUserToSocket[connectedSocketToUser[socket.id]];
        delete connectedSocketToUser[socket.id];
        console.log(connectedSocketToUser);
        console.log(connectedUserToSocket);
    })
});




module.exports = app;
