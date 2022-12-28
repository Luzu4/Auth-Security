require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app= express();
const PORT = process.env.port || 3000;
const encrypt = require("mongoose-encryption");

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));
mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt,{secret: process.env.secret, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.post("/login", function(req,res){
    const userEmail = req.body.username;
    const userPassword = req.body.password;
    User.findOne({email: userEmail}, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.password === userPassword){
                    res.render("secrets");
                }
            }
        }
    })
})


app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register", function(req,res){
    const newUser = new User({
            email: req.body.username,
            password: req.body.password
        })
    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
})


app.listen(PORT, function(){
    console.log("Server Started on port " + PORT);
})