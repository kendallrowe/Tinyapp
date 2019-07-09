const express = require("express");
const cookieParser = require("cookie-parser");
const { urlDatabase, users } = require("./constants");
const { newUser, generateRandomString, emailAlreadyExists } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies.username
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  // Random id generated using same random string function
  let userID = newUser();
  if (!req.body.email || !req.body.password || emailAlreadyExists(userID, req.body.email) === true) {
    res.statusCode = 400;
    return res.send("Missing password or username");
  } else {
    // Add a new user object to global users - Include id, email and password
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    console.log(users);
    // After adding user, set user_id cookie with ID
    res.cookie("user_id", userID);
  }
  // Redirect to /urls
  res.redirect("/urls");
});

// Take login username and store in cookie if user doesn't already have a username as cookie
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// If cookie for username already exists, provide logout screen to logout
app.post("/logout", (req, res) => {
  delete res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies.username,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies.username
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    username: req.cookies.username,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

// Generate new random shortURL string upon form entry and update database with short and long URL
app.post("/urls", (req, res) => {
  res.statusCode = 200;
  const newShortUrl = generateRandomString(0);
  urlDatabase[newShortUrl] = req.body.longURL;
  res.redirect(`/urls/${newShortUrl}`);
});

// Redirection for shortURL to access a long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Redirect from index home page to allow for view and edit of URL
app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

// Edit an existing longURL/ShortURL pair to update longURL
app.post("/urls/:shortURL/edit", (req, res) => {
  res.statusCode = 200;
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});