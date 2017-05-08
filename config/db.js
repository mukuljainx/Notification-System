var dbusername = process.env.USER_NAME;
var dbpassword = process.env.USER_PASSWORD;
var dburl = process.env.DB_URL;

console.log('mongodb://'+ dbusername + ':' + dbpassword + dburl);

exports.url = 'mongodb://'+ dbusername + ':' + dbpassword + dburl;
