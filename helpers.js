// Helper function to generate a random string of 6 characters for short URL
const generateRandomString = function(n, database) {
  n += 1;
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result           = '';
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  // If the randomly created string already exists, recurse to generate a new random string. Will only attempt max 1000 times.
  // If 1000 is exceeded, will overwrite one of the strings (for larger userbase would need to revisit this logic)
  if (!database[result] || n > 1000) {
    return result;
  }
  return generateRandomString(n, database);
};

// Closure function used to generate increasing numbered random ID's for users
const createLabelClosure = function(type) {
  let userNum = 0;
  return function(database) {
    userNum += 1;
    return `${type}-${userNum}${generateRandomString(0, database)}`;
  };
};

const newUser = createLabelClosure("user");
const newVistor = createLabelClosure("visitor")

const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
};

// Returns the URLs where the userID is equal to the id of the currently logged in user.
const urlsForUser = function(id, database) {
  const userURLS = [];
  if (id === undefined) {
    return [];
  } else {
    for (let shortURL in database) {
      if (database[shortURL].userID === id) {
        userURLS.push({
          shortURL: shortURL,
          longURL: database[shortURL].longURL
        });
      }
    }
  }
  return userURLS;
};

// Takes a user ID and shorturl as arguments. If the passed shortURL exists among the urls of the userID return true.
const validateUser = function(userID, shortURL, database) {
  const userURLS = urlsForUser(userID, database);
  if (userURLS.length > 0) {
    if (userURLS.find(user => user.shortURL === shortURL)) {
      return true;
    }
  }
  return false;
};

module.exports = { newUser, newVistor, generateRandomString, getUserByEmail, urlsForUser, validateUser };