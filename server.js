var http = require('http');
var express = require('express');
var url = require('url');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose =  require('mongoose');
var ejs = require('ejs');
var less = require('less');

/* Creating model */
var articleSchema = mongoose.Schema({
	title : String,
	author : String,
	text : String,
	created : Date,
	lastModified : Date,
});

var Article = mongoose.model('Article', articleSchema);
var articles = [];
var connected = false;

/* DB connection */
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open',function(){
	console.log('Sucessful connection');
	connected = true;
	/* For error handling */
	/*Article.find(function (err, array){						
		if (err) return console.error(err);
		array.forEach(function (element, index, array){
			articles.push(element);
			console.log('Article ' + element.title + ' successfully loaded.')
		});
	});*/
});

/* Create server */
var app = express();
app.engine('html', ejs.renderFile);
var router = express.Router();
app.use(router);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended : true}));

router.get('/', function(req,res){
	res.render('index.html');
	console.log('got visit');
});

var sendArticles = function (res, art) {
	var articles = [];
	Article.find(function (err, array){
		array.forEach(function (element, index, array){
			articles.push(element);
		});
		if (art) articles.push(art);
		res.end(JSON.stringify(articles));
		console.log('...Articles sent.');
	});
}

/* Returns articles*/
router.get('/articles', function(req,res){
	if (connected){
		console.log('Request for articles...');
		res.set('Content-Type','application/json');
		sendArticles(res);
	} else {
		res.end('Cannot connect to database.');
	}
});

/* Posts new article */
router.post('/post', function (req, res) {
	if (connected){		
		if (req.body._id) { 		
			Article.findOne({'_id' : req.body._id}, function (err, item){
				item._id = req.body._id;
				item.author = (req.body.author) ? req.body.author : 'Anonymous';
				item.title = (req.body.title) ? req.body.title : 'Insert title here';
				item.text = (req.body.text) ? req.body.text : 'Insert text here';
				item.created = (req.body.created) ? req.body.created : new Date();
				item.lastModified = new Date();
				item.save(function (err){
					if (err) { console.log(err) } else {
						console.log('Sending the articles...');
						sendArticles(res);
					}
				});
			});
		} else {
			var article = new Article();
			article.author = (req.body.author) ? req.body.author : 'Anonymous';
			article.title = (req.body.title) ? req.body.title : 'Insert title here';
			article.text = (req.body.text) ? req.body.text : 'Insert text here';
			article.created = (req.body.created) ? req.body.created : new Date();
			var tmp = article.lastModified = new Date();
			article.save(function (err){
				if (err) { console.log(err) } else {
					console.log('Sending the articles...');
					sendArticles(res);	
				}
			});
		}
		
	} else {
		res.end('Cannot connect to database.');
	}
});

/* Deletes article */
router.post('/delete', function (req, res) {
	Article.where('_id').equals(req.body._id).remove(function(err){if (err) console.log("Error: " + err);});
	console.log('Article deleted. Sending articles...');
	sendArticles(res);
	
});
app.listen(1000);
console.log('Sever successfully started');


