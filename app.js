require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const app = express();
const PORT = process.env.port || 3000;
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const path = require("path");

app.use(express.static(path.join(__dirname + '/public')));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
mongoose.connect("mongodb+srv://luz:" + process.env.DB_PASSWORD + "@cluster0.zwcnyqt.mongodb.net/secretDB?retryWrites=true&w=majority", {useNewUrlParser: true});


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({googleId: profile.id}, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate('google', {scope: ["profile"]}));

app.get("/auth/google/secrets",
    passport.authenticate('google', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/logout", function (req, res) {
    req.logout(function () {
    });
    res.redirect("/");
})

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    })

})


app.get("/secrets", function (req, res) {
    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if(!err){
            res.render("secrets",{users:foundUsers});
        }else{
            console.log(err);
        }
    })

})

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    User.register({username: req.body.username}, req.body.password, function (err, usr) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })

})

app.get("/submit",function (req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/submit",function (req,res){
    User.findById(req.user.id,function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            foundUser.secret= req.body.secret;
            foundUser.save();
            res.redirect("/secrets");
        }
    })
})

app.listen(PORT, function () {
    console.log("Server Started on port " + PORT);
})