var express = require("express");
var mongoose = require("mongoose");
var cheerio = require ("cheerio");
var axios = require ("axios");
var exphbs = require('express-handlebars');

var PORT = process.env.PORT || 3000;

// Requiring the `User` model for accessing the `users` collection
var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");




// Connect to the Mongo DB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

// Routes
app.get("/", function(req, res) {
  db.Article.find({ saved: false })
    .sort({ date: -1 })
    .then(function(dbArticles) {
      res.render("home", { articles: dbArticles });
    });
});
app.get("/saved", function(req, res) {
  db.Article.find({ saved: true })
    .sort({ date: -1 })
    .then(function(dbArticles) {
      res.render("saved", { articles: dbArticles });
    });
 });
// Route to post our form submission to mongoDB via mongoose
app.get("/scrape", function(req, res) {
  axios.get("http://www.nytimes.com").then(function(res){
    var $ = cheerio.load(res.data)
    console.log($)
    // this is where we're going to push all our articles. 
    var articles = [];
    //target the parent div with a .each
    $("article").each(function( i, element){
      var title = $(this)
      .find("h2").text().trim();

      var url = $(this).find("a").attr("href")
      var summary = $(this).find("p").text().trim();

      var data = {
        headline: title,
        url: "http://www.nytimes.com" + url,
        summary: summary
      }
      articles.push(data);


    })

  })
  .then(function(articles){
    db.Article.create(articles)

  })
  .then(function(dbheadline){
if(dbheadline.length == 0){
  res.json({message: "no new articles today"
  })
}else{
  res.json({message: "here's a new article"})
}
  }).catch(function(err){
    res.json({message: "we completed the scrape but couldn't push it to database"})
  })

  // Create a new user using req.body

});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
