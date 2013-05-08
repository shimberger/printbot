var http = require('http'),
    dropbox = require('dropbox'),
    express = require('express'),
    uuid = require('uuid'),
    dbox  = require("dbox"),
    exec = require('child_process').exec,
    _ = require('underscore'),
    fs = require('fs'),
    app = express();


/**
/home/shimberger/printbot/node_modules/dbox/lib/dbox.js:262
                if (reply.contents) {
                         ^
TypeError: Cannot read property 'contents' of null
    at /home/shimberger/printbot/node_modules/dbox/lib/dbox.js:262:26
    at Request._callback (/home/shimberger/printbot/node_modules/dbox/lib/dbox.js:224:17)
    at Request.self.callback (/home/shimberger/printbot/node_modules/dbox/node_modules/request/main.js:119:22)
    at Request.<anonymous> (/home/shimberger/printbot/node_modules/dbox/node_modules/request/main.js:212:58)


**/

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/files' }));

var appConfig = require('./appConfig');
var dropboxApp = dbox.app(appConfig)
var dropboxRequestTokens = {}
var tokens = require('./accessTokens');

function saveToken(token) {
  tokens.push(token);
  fs.writeFile(__dirname + '/accessTokens.json', JSON.stringify(tokens), function(err) {
    console.log("Updated tokens with " + token)
    clients = _.map(tokens,function(token) {
     return dropboxApp.client(token)
    })
  })
}

var clients = _.map(tokens,function(token) {
   return dropboxApp.client(token)
})

var searchOptions = {
  file_limit         : 10000,             
  include_deleted    : false,             
   locale:             "en"               
}

setInterval(function() {
  _.each(clients,function(client) {
    client.readdir('',function(status,reply) {
      if (reply == null) return;
      _.each(reply,function(dropboxFile) {
        var suffix = ".pdf";
        var outFileName = uuid.v4() + suffix
        if (dropboxFile.slice(-suffix.length) == suffix) {
          client.get(dropboxFile, function(status, reply, metadata){
            if (reply == null) return;
            var path = __dirname + '/files/' + outFileName
            fs.writeFile(path, reply, function(err) {
              exec("lp " + path, function(err,stdout,stderr) {
                if (err) {
                  console.log("Error:" + err)
                } else {
                  console.log("Printing....")
                }
                client.rm(dropboxFile,function() {

                });
              });
            });
          });
        }
      })
    })
  })
},10000);

app.post('/upload', function(req, res){
  var path = req.files.file.path;
  console.log("PrintBot received upload '" + path + "'.. yumyum")
  exec("lp " + path, function(err,stdout,stderr) {
    if (err) {
      console.log("Error:" + err)
    } else {
      console.log("Printing....")
    }
    res.end('ok');
  });
});

app.get('/dropbox',function(req,res) {
  
  dropboxApp.requesttoken(function(status, request_token){
    var id = uuid.v4()
    dropboxRequestTokens[id] = request_token
    var backURL = req.protocol + "://" + req.get('host') + '/dropbox/complete?id=' + id;
    res.redirect('https://www.dropbox.com/1/oauth/authorize?oauth_token=' + request_token.oauth_token + '&oauth_callback=' + encodeURIComponent(backURL) )
  })
});

app.get('/dropbox/complete',function(req,res) {
  var request_token = dropboxRequestTokens[req.param('id')]
  console.log(request_token);
  dropboxApp.accesstoken(request_token, function(status, access_token){
    saveToken(access_token)
    res.redirect('/');
  })
});

console.log("Starting PrintBot")
app.listen(3000,"0.0.0.0");
