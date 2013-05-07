var http = require('http'),
    dropbox = require('dropbox'),
    express = require('express'),
    uuid = require('uuid'),
    exec = require('child_process').exec,
    _ = require('underscore'),
    fs = require('fs'),
    app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/files' }));

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

console.log("Starting PrintBot")
app.listen(3000,"0.0.0.0");
