var express = require("express");
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require("mongoose");

var router = express.Router();

var db = require("../models");
mongoose.Promise = Promise;

if (process.env.MONGODB_URI) {
	mongoose.connect('mongodb://heroku_sl4hcv38:eqv77e1utn5mne7mgj8b920ujd@ds121696.mlab.com:21696/heroku_sl4hcv38')
} else {
	mongoose.connect('mongodb://localhost/storiesPopulator');
}

// mongoose.connect("mongodb://localhost/storiesPopulator", {
//   useMongoClient: true
// });


db.Temp.remove({}).exec();

// Opening site
router.get("/", function(req,res){

	db.Temp.find().exec(function(err, tmpStories){
		//console.log(tmpStories);
		var hbsStories = {stories: tmpStories}
		//console.log(hbsStories);
		res.render("index", hbsStories);
	});

});

// Saved stories
router.get("/savedStories", function(req,res){
	
	db.Story.find().exec(function(err, dbStories){
		var hbsStories = {stories: dbStories}
		res.render("saved", hbsStories);
	});
	
});

// Saving story
router.post("/saveStory", function(req,res){
	
	var story = new db.Story(req.body); // creating object that includes story to be deleted
	story.save(function(err, createdStory) {
		if (err) res.status(500).send(err);
		//console.log('Story `'+createdStory+'` has been saved successfully!');
		//res.status(200).send(createdStory);
		story = req.body;
	}).then(function(story){
		console.log('link0:',story.link);
		db.Temp.remove({link: story.link}, function(err, data){
			res.status(200).send("Story saved");
		});
	});
	
});

// Deleting story
router.post("/deleteStory", function(req,res){
	
	db.Story.findById({_id: req.body.id})
		.then(function(story){
			console.log(story.note);
			db.Note.remove({_id: {$in: story.note}}, function(err,data){
				if(!err) console.log(data.result);
			});
		}).then(function(){
			db.Story.remove({_id: req.body.id}, function(err, data){
				if(!err) console.log(data.result);
			});
		});

});

// Deleting note
router.post("/deleteNote", function(req,res){
	//console.log("[story, note]->",req.body.storyId,',',req.body.noteId);
	db.Note.remove({_id: req.body.noteId}, function(err,data){
		if(!err) console.log(data.result);
	}).then(function(){
		db.Story.update(
			{_id: req.body.storyId}, 
			{$pull: 
				{"note": req.body.noteId}
			}, 
			(err, story) => {
				if (err) {
					res.status(400).json(err);
				}
				console.log(res);
				res.status(200);
			}
		)

	});

});

// Notes
router.put('/api/notes', function(req, res){
	console.log(req.body.id);
	db.Story.findById({ _id: req.body.id })
		.populate("note")
		.then(function(dbStory) {
			res.json(dbStory);
		})
		.catch(function(err) {
			res.json(err);
		});
}); 

//Save note 
router.post("/api/saveNote", function(req, res){

	db.Note
		.create(req.body)
		.then(function(dbNote) {
			//return db.Story.findById({ _id: req.body.id }).populate("note").save(dbNote);
			return db.Story.update({ _id: req.body.id }, {$push: {"note": dbNote}}, function(err, i){
				if (err) throw err;
			});
		})
		.then(function(dbStory) {
			res.json(dbStory);
		})
		.catch(function(err) {
			res.json(err);
		});	

});


// Scraping stories
router.get("/api/scrape", function(req, res) {

	//res.json({test:1});

	//var scrapedStories = [];
	console.log("/api/scrape started")
	request('http://www.foxnews.com/world.html', function (error, response, html) {
	  if (!error && response.statusCode == 200) {

	  	var $ = cheerio.load(html);
		$('div.content.article-list').children("article").each(function(i, element){
			//console.log(i, element);
			var title0 = $(this).children("div.info").children("header").children("h2.title").children("a").text().trim();
			var summary0 = $(this).children("div.info").children("div.content").children("p.dek").children("a").text().trim();
			var link0 = $(this).children("div.info").children("header").children("h2.title").children("a").attr("href");
			
			var isSaved = 0;

			if (title0.length > 0 && summary0.length > 0 && link0.length > 0) {

				var result = {
					title: title0,
					summary: summary0,
					link: link0
				};


				db.Story.findOne({link: link0}).exec(function(err, story) {
					if (story == null) isSaved += 1;
				}).then(function(){
					db.Temp.findOne({link: link0}).exec(function(err, story) {
						if (story == null) isSaved += 1;
					}).then(function(){
						//console.log("isSaved:",isSaved);
						if (isSaved == 2){
							var temp = new db.Temp(result); // creating object that includes story to be deleted
							temp.save(function(err, createdStory) {
								if (err) console.log(err);
								//console.log('Story `'+createdStory+'` has been saved successfully!');
								console.log('Saved to Temp:', createdStory.title);
							});							
						}//console.log("result:",result);

					});
					//if ( !(scrapedStories.includes(result)) ) scrapedStories.push(result);
					//console.log("in memory",scrapedStories.includes(result));
					//if ( !isSaved && !(scrapedStories.includes(result)) ) scrapedStories.push(result);
					//if ( !isSaved && !isObjectInArray(result, scrapedStories) ) scrapedStories.push(result);	
				});

			}
		});
		


	  }
	  //res.json(scrapedStories);
	});


	
});


// export module
module.exports = router;