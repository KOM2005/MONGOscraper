var express = require("express");
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require("mongoose");

var router = express.Router();

var db = require("../models");
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/storiesPopulator", {
  useMongoClient: true
});


db.Temp.remove({}).exec();

// Opening site
router.get("/", function(req,res){

	db.Temp.find().exec(function(err, tmpStories){
		res.render("index", {stories: tmpStories});
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
		story = req.body;
	}).then(function(story){
		db.Temp.remove({link: story.link}, function(err, data){
			res.status(200).send("Story saved");
			console.log("Scraped story was saved to DB.");
		});
	});
	
});

// Deleting story
router.post("/deleteStory", function(req,res){
	
	db.Story.findById({_id: req.body.id})
		.then(function(story){
			db.Note.remove({_id: {$in: story.note}}, function(err,data){
				if(!err) {};
			});
		}).then(function(){
			db.Story.remove({_id: req.body.id}, function(err, data){
				if(!err) console.log("Story was deleted from DB /_id =",req.body.id,"/");
			});
		});

});

// Deleting note
router.post("/deleteNote", function(req,res){
	//console.log("[story, note]->",req.body.storyId,',',req.body.noteId);
	db.Note.remove({_id: req.body.noteId}, function(err,data){
		if(!err) {};
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
				res.status(200);
				console.log("Note was deleted");
			}
		)

	});

});

// Notes
router.put('/api/notes', function(req, res){
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
			console.log("Note was saved to story");
		})
		.catch(function(err) {
			res.json(err);
		});	

});


// Scraping stories
router.get("/api/scrape", function(req, res) {

	var srapedStoriesCount = 0;
	request('http://www.foxnews.com/world.html', function (error, response, html) {
		if (!error && response.statusCode == 200) {

		  	var $ = cheerio.load(html);
			$('div.content.article-list').children("article").each(function(i, element){

				var title0 = $(this).children("div.info").children("header").children("h2.title").children("a").text().trim();
				var summary0 = $(this).children("div.info").children("div.content").children("p.dek").children("a").text().trim();
				var link0 = $(this).children("div.info").children("header").children("h2.title").children("a").attr("href");
				
				if(String(link0).startsWith("/",0))
					link0 = 'http://www.foxnews.com/' + link0;

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
							if (isSaved == 2){
								var temp = new db.Temp(result); 
								temp.save(function(err, createdStory) {
									if (err) console.log(err);
									++srapedStoriesCount;	
								});							
							}

						});

					});

				}
			});
			
	  }
	  
	});

	res.json(srapedStoriesCount);
	console.log('Scraped stories:', srapedStoriesCount);
});


// export module
module.exports = router;