const { urlDatabase, users } = require("./constants");

// Helper function to generate a random string of 6 characters for short URL
const generateRandomString = function(n) {
  n += 1;
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result           = '';
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  // If the randomly created string already exists, recurse to generate a new random string. Will only attempt max 1000 times.
  // If 1000 is exceeded, will overwrite one of the strings (for larger userbase would need to revisit this logic)
  if (!urlDatabase[result]) {
    return result;
  }
  return generateRandomString(n);
};

// Closure function used to generate increasing numbered random ID's for users
const createUserClosure = function() {
  let userNum = 0;
  return function() {
    userNum += 1;
    return `user-${userNum}${generateRandomString(0)}`;
  };
};

const newUser = createUserClosure();

// Returns user given an email address if user already exists in database
const emailAlreadyExists = function(email, database) {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return undefined;
};

// Returns the URLs where the userID is equal to the id of the currently logged in user.
const urlsForUser = function(id) {
  const userURLS = [];
  if (id === undefined) {
    return [];
  } else {
    for (let shortURL in urlDatabase) {
      if (urlDatabase[shortURL].userID === id) {
        userURLS.push({
          shortURL: shortURL,
          longURL: urlDatabase[shortURL].longURL
        });
      }
    }
  }
  return userURLS;
};
const validateUser = function(userID, shortURL) {
  const userURLS = urlsForUser(userID);
  if (userURLS.length > 0) {
    if (userURLS.find(user => user.shortURL === shortURL)) {
      return true;
    }
  }
  return false;
};

module.exports = { newUser, generateRandomString, emailAlreadyExists, urlsForUser, validateUser };