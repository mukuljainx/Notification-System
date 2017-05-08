var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    userId        : String,
    notifications : [String],
    activities    : [String],
    subscribers   : [String],
    subscriptions  : [String],
});

module.exports = mongoose.model('User', userSchema);
