const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testURLS = {
  "CaCft": {
    longURL: "http://vicandkentietheknot.com/Home/", 
    userID: "userRandomID"
  }
};

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });

  it("should return undefined if email isn't in database", function() {
    const user = getUserByEmail("hello", testUsers)
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});

describe("validateUser", function() {
  it("should return true if shortURL exists in users database", function() {
    const user = validateUser("user2RandomID", testUsers)
    const expectedOutput = true;
    assert.strictEqual(user, expectedOutput);
  });
});

const urlsForUser = function(id,) {
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