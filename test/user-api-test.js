"use strict";

const assert = require("chai").assert;
const HiveTracker = require("./hiveTracker");
const fixtures = require("./fixtures.json");
const _ = require("lodash");

suite("User API tests", function () {
  let users = fixtures.users;
  let newUser = fixtures.newUser;

  const hiveTracker = new HiveTracker(fixtures.hiveTracker);

  suiteSetup(async function () {
    await hiveTracker.deleteAllUsers();
    const returnedUser = await hiveTracker.createUser(newUser);
    const response = await hiveTracker.authenticate(newUser);
  });

  suiteTeardown(async function () {
    await hiveTracker.deleteAllUsers();
    hiveTracker.clearAuth();
  });

  test("create a user", async function () {
    const returnedUser = await hiveTracker.createUser(newUser);
    assert(_.some([returnedUser], newUser), "returnedUser must be a superset of newUser");
    assert.isDefined(returnedUser._id);
  });

  test("get user", async function () {
    const u1 = await hiveTracker.createUser(newUser);
    const u2 = await hiveTracker.getUser(u1._id);
    assert.deepEqual(u1, u2);
  });

  test("get invalid user", async function () {
    const u1 = await hiveTracker.getUser("1234");
    assert.isNull(u1);
    const u2 = await hiveTracker.getUser("012345678901234567890123");
    assert.isNull(u2);
  });

  test("delete a user", async function () {
    let u = await hiveTracker.createUser(newUser);
    assert(u._id != null);
    await hiveTracker.deleteOneUser(u._id);
    u = await hiveTracker.getUser(u._id);
    assert(u == null);
  });

  test("get all users", async function () {
    await hiveTracker.deleteAllUsers();
    await hiveTracker.createUser(newUser);
    await hiveTracker.authenticate(newUser);
    for (let u of users) {
      await hiveTracker.createUser(u);
    }

    const allUsers = await hiveTracker.getUsers();
    assert.equal(allUsers.length, users.length + 1);
  });

  test("get users detail", async function () {
    await hiveTracker.deleteAllUsers();
    const user = await hiveTracker.createUser(newUser);
    await hiveTracker.authenticate(newUser);
    for (let u of users) {
      await hiveTracker.createUser(u);
    }

    const testUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
    };
    users.unshift(testUser);
    const allUsers = await hiveTracker.getUsers();
    for (var i = 0; i < users.length; i++) {
      assert(_.some([allUsers[i]], users[i]), "returnedUser must be a superset of newUser");
    }
  });

  test("get all users empty", async function () {
    await hiveTracker.deleteAllUsers();
    const user = await hiveTracker.createUser(newUser);
    await hiveTracker.authenticate(newUser);
    const allUsers = await hiveTracker.getUsers();
    assert.equal(allUsers.length, 1);
  });
});
