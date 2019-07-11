const { assert } = require('chai');

const { getUserByEmail, urlsForUser, validateUser } = require('../helpers.js');

const testURLS = {
  "CaCft": {
    longURL: "http://vicandkentietheknot.com/Home/",
    userID: "userRandomID",
    numberOfVisits: 1,
    uniqueVisitors: ["adsf"]
  },
  "adsf32": {
    longURL: "https://www.lighthouselabs.ca",
    userID: "userRandomID2",
    numberOfVisits: 0,
    uniqueVisitors: []
  },
  "ters44": {
    longURL: "https://www.facebook.com/",
    userID: "userRandomID2",
    numberOfVisits: 5,
    uniqueVisitors: ["adsf", "adsf", "adsf"]
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
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });

  it("should return undefined if email isn't in database", function() {
    const user = getUserByEmail("hello", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});

describe("urlsForUser", function() {
  it("should return array of correct shortURL and LongURLS in array if user has multiple urls on site", function() {
    const user = urlsForUser("userRandomID2", testURLS);
    const expectedOutput = [{
      shortURL: "adsf32", 
      longURL: "https://www.lighthouselabs.ca",
      numberOfVisits: 0,
      uniqueVisitors: []
    }, 
    {
      shortURL: "ters44", 
      longURL: "https://www.facebook.com/",
      numberOfVisits: 5,
      uniqueVisitors: ["adsf", "adsf", "adsf"]
    }];
    assert.deepEqual(user, expectedOutput);
  });

  it("should return empty array if user has not created any urls", function() {
    const user = urlsForUser("kendall", testURLS);
    const expectedOutput = [];
    assert.deepEqual(user, expectedOutput);
  });

});

describe("validateUser", function() {
  it("should return true if shortURL exists in url database and has tag matching to current user", function() {
    const user = validateUser("userRandomID2", "ters44", testURLS);
    const expectedOutput = true;
    assert.strictEqual(user, expectedOutput);
  });

  it("should return false if shortURL does not exists in url database", function() {
    const user = validateUser("userRandomID2", "iewiuriu", testURLS);
    const expectedOutput = false;
    assert.strictEqual(user, expectedOutput);
  });

  it("should return false if shortURL does exist in url database but to a different user", function() {
    const user = validateUser("userRandomID2", "CaCft", testURLS);
    const expectedOutput = false;
    assert.strictEqual(user, expectedOutput);
  });
});
