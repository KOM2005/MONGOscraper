var express = require("express");
var bodyParser = require("body-parser");


var PORT = 8080;
var app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));


// Using handlebars engine
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
var routes = require("./controllers/scrapeController.js");
app.use("/", routes);

// Starting the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
