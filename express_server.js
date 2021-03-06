const express = require("express");
const bcrypt = require("bcrypt");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const { urlDatabase, users } = require("./constants");
const { newUser, newVisitor, generateRandomString, getUserByEmail, urlsForUser, validateUser, dateFormat } = require("./helpers");

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

// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    req.session.user_id = null;
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
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    req.session.user_id = null;
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
  // If logged in, render main page
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
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
  if (!users[req.session.user_id]) {
    res.statusCode = 403;
    return res.send("Make sure you log in or register to be able to start creating your own Tiny URL's!");
  } else if (!validateUser(req.session.user_id, req.params.shortURL, urlDatabase)) {
    res.statusCode = 403;
    return res.send("You are only able to edit and delete short URL's created by you.");
  } else {
    // Go through each timestamp for each given uniquevisitor for this url and add in an array to be sorted
    const timeStampArray = [];
    for (let visitor of urlDatabase[req.params.shortURL].uniqueVisitors) {
      visitor.timeStamp.map(timestamp => timeStampArray.push(timestamp));
    }

    timeStampArray.sort((a, b) => (new Date(b)) - (new Date(a)));
    let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      numberOfVisits: urlDatabase[req.params.shortURL].numberOfVisits,
      uniqueVisitors: urlDatabase[req.params.shortURL].uniqueVisitors,
      timeStamps: timeStampArray
    };
    res.render("urls_show", templateVars);
  }
});

// Generate new random shortURL string upon form entry and update database with short and long URL
app.post("/urls", (req, res) => {
  res.statusCode = 200;
  const newShortUrl = generateRandomString(0, urlDatabase);
  urlDatabase[newShortUrl] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    numberOfVisits: 0,
    uniqueVisitors: []
  };
  res.redirect(`/urls/${newShortUrl}`);
});

// Redirection for shortURL to access a long URL
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.statusCode = 400;
    return res.send("The page you have requested does not exist. Please check to make sure you've entered the correct Tiny URL and try again :)");
  }
  // Obtain the index of the visitor with a visitor ID matching to current cookie session visitor ID
  const visitor = urlDatabase[req.params.shortURL].uniqueVisitors.indexOf(urlDatabase[req.params.shortURL].uniqueVisitors.find(visitor => visitor.visitorID === req.session.visitor_id));
  // If current visitorID is found, update the number of visits and add a new timestamp
  if (visitor !== -1) {
    urlDatabase[req.params.shortURL].uniqueVisitors[visitor].numberOfVisits += 1;
    urlDatabase[req.params.shortURL].uniqueVisitors[visitor].timeStamp.push(dateFormat(new Date()));
  } else {
    // If visitorID is not found, create a new ID for them and update their cookie
    req.session.visitor_id = newVisitor(urlDatabase);

    // push an object for the new visitorID updating with their individual number of visits
    urlDatabase[req.params.shortURL].uniqueVisitors.push({
      visitorID: req.session.visitor_id,
      numberOfVisits: 1,
      timeStamp: [dateFormat(new Date())]
    });
  }
  // Update the total number of visits for a given shortURL
  urlDatabase[req.params.shortURL].numberOfVisits += 1;
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// Redirect from index home page to allow for view and edit of URL
app.post("/urls/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

// Edit an existing longURL/ShortURL pair to update longURL
app.put("/urls/:shortURL/edit/", (req, res) => {
  if (!users[req.session.user_id]) {
    res.statusCode = 403;
    return res.send("Make sure you log in or register to be able to start creating your own Tiny URL's!");
  } else if (validateUser(req.session.user_id, req.params.shortURL, urlDatabase)) {
    res.statusCode = 200;
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;

    res.redirect(`/urls/`);
  } else {
    res.statusCode = 403;
    return res.send("You are only able to edit and delete short URL's created by you.");
  }
});

app.delete("/urls/:shortURL/delete/", (req, res) => {
  if (!users[req.session.user_id]) {
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