const express = require("express");
const bcrypt = require("bcrypt");
const cookieSession = require('cookie-session');
const { urlDatabase, users } = require("./constants");
const { newUser, generateRandomString, getUserByEmail, urlsForUser, validateUser } = require("./helpers");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ["key1"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  // Random id generated using same random string function
  let userID = newUser(urlDatabase);
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    return res.send("Missing password or email");
  } else if (getUserByEmail(req.body.email, users)) {
    res.statusCode = 400;
    return res.send("It looks like your email already exists. Try the login page!");
  } else {
    // Add a new user object to global users - Include id, email and password
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password,10)
    };

    // After adding user, set user_id cookie with ID
    req.session.user_id = userID;
  }
  // Redirect to /urls
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_login", templateVars);
  }
});

// Take login userID and store in cookie if user doesn't already have a userID as cookie
app.post("/login", (req, res) => {
  let userID = getUserByEmail(req.body.email, users);
  // If user with email can't be found, return 403 status code
  if (!userID) {
    res.statusCode = 403;
    return res.send("Unable to find your email address, make sure you have registered!");
  }

  // If user with email is located, compare password with existing, if it does not match return 403 status code
  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    res.statusCode = 403;
    return res.send("Password did not match. Make sure to check your password!");
  }
  
  // If both checks pass, set user_id cookie with matching user's id, redirect to urls
  req.session.user_id = userID;
  res.redirect("/urls");
});

// If cookie for userID already exists, provide logout screen to logout
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  // Authenticase that user is logged in
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    // If logged in, render main page
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id, urlDatabase)
    };
    
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 403;
    return res.send("Make sure you log in or register to be able to start creating your own Tiny URL's!");
  } else if (!validateUser(req.session.user_id, req.params.shortURL, urlDatabase)) {
    res.statusCode = 403;
    return res.send("You are only able to edit and delete short URL's created by you.");
  } else {
    let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  }
});

// Generate new random shortURL string upon form entry and update database with short and long URL
app.post("/urls", (req, res) => {
  res.statusCode = 200;
  const newShortUrl = generateRandomString(0, urlDatabase); this;
  urlDatabase[newShortUrl] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${newShortUrl}`);
});

// Redirection for shortURL to access a long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Redirect from index home page to allow for view and edit of URL
app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

// Edit an existing longURL/ShortURL pair to update longURL
app.post("/urls/:shortURL/edit", (req, res) => {
  if (validateUser(req.session.user_id, req.params.shortURL, urlDatabase)) {
    res.statusCode = 200;
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;

    res.redirect(`/urls/`);
  } else {
    res.statusCode = 403;
    return res.send("You are only able to edit and delete short URL's created by you.");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 403;
    return res.send("Make sure you log in or register to be able to start creating your own Tiny URL's!");
  } else if (!validateUser(req.session.user_id, req.params.shortURL, urlDatabase)) {
    res.statusCode = 403;
    return res.send("You are only able to edit and delete short URL's created by you.");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});