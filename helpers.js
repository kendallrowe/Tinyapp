const { urlDatabase } = require("./constants");

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

const createUserClosure = function() {
  let userNum = 0;
  return function() {
    userNum += 1;
    return `user${userNum}-${generateRandomString(0)}`
  }
}

const newUser = createUserClosure();

module.exports = { newUser, generateRandomString }