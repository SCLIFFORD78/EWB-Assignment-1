"use strict";

const assert = require("chai").assert;
const HiveTracker = require("./hiveTracker");
const fixtures = require("./fixtures.json");
const _ = require("lodash");

suite("Hive API tests", function () {
  let hives = fixtures.hives;
  let newHive = fixtures.newHive;
  let newUser = fixtures.newUser;
  let returnedUser;

  const hiveTracker = new HiveTracker(fixtures.hiveTracker);

  suiteSetup(async function () {
    await hiveTracker.deleteAllHives();
    const returnedHive = await hiveTracker.createHive(newHive);
    returnedUser = await hiveTracker.createUser(newUser);
    const response = await hiveTracker.authenticate(newUser);
  });


  suiteTeardown(async function () {
    await hiveTracker.deleteAllHives();
    hiveTracker.clearAuth();
  });

  setup(async function () {
    await hiveTracker.deleteAllHives();
  });

  test("get all hives", async function () {
    await hiveTracker.createHive(newHive);
    for (let u of hives) {
      await hiveTracker.createHive(u);
    };

    const allHives = await hiveTracker.getHives();
    assert.equal(allHives.length, hives.length + 1);
  });

  test("get all hives by user", async function () {
    //await hiveTracker.deleteAllUsers();
    for (let u of hives) {
      await hiveTracker.createHive(u);
    };

    const testHive = {
      latitude: newHive.latitude,
      longtitude: newHive.longtitude,
      hiveType: newHive.hiveType,
      description: newHive.description,
      owner: returnedUser._id,
      details: newHive.details,
    };

    const u1 = await hiveTracker.createHive(testHive);
    const u2 = await hiveTracker.createHive(testHive);
    
    const allHiveCount = await hiveTracker.getHives();
    var allHivesByUser = await hiveTracker.getHiveByOwner(returnedUser._id);
    assert.notEqual(allHiveCount.length,allHivesByUser.length);
    assert.equal(allHivesByUser.length, 2);
    await hiveTracker.deleteOneHive(u1._id);
    allHivesByUser = await hiveTracker.getHiveByOwner(returnedUser._id);
    assert.equal(allHivesByUser.length,1);
  });

  test("create a hive", async function () {
    const returnedHive = await hiveTracker.createHive(newHive);
    assert(_.some([returnedHive], newHive), "returnedHive must be a superset of newHive");
    assert.isDefined(returnedHive._id, "not equal");
    assert.isDefined(returnedHive.details[0]._id,"object");
  });

  test("get hive", async function () {
    const u1 = await hiveTracker.createHive(newHive);
    const u2 = await hiveTracker.getHive(u1._id);
    assert.deepEqual(u1, u2);
  });

  test("Add comments", async function () {
    const u1 = await hiveTracker.createHive(newHive);
    const origCommentCount = u1.details.length;
    const addComment = await hiveTracker.addHiveComment(u1._id, u1.details[0].comments);
    const u2 = await hiveTracker.getHive(u1._id);
    const newCommentCount = u2.details.length;
    assert.deepEqual(u1.details[0].comments, u2.details[1].comments);
    assert.equal(origCommentCount + 1, newCommentCount);

  });

  test("Delete comments", async function () {
    const u1 = await hiveTracker.createHive(newHive);
    const id = u1.details[0]._id;
    const deletedComment = await hiveTracker.deleteHiveComment(u1._id, id);
    const u2 = await hiveTracker.getHive(u1._id);
    const newCommentCount = u2.details.length;
    assert.equal(u1.details.length, newCommentCount + 1);

  });

  test("get invalid hive", async function () {
    const u1 = await hiveTracker.getHive("1234");
    assert.isNull(u1);
    const u2 = await hiveTracker.getHive("012345678901234567890123");
    assert.isNull(u2);
  });

  test("delete a hive", async function () {
    let u = await hiveTracker.createHive(newHive);
    assert(u._id != null);
    await hiveTracker.deleteOneHive(u._id);
    u = await hiveTracker.getHive(u._id);
    await hiveTracker.deleteAllHives();
    assert(u == null);
  });



  test("get hives detail", async function () {
    const hive = await hiveTracker.createHive(newHive);
    for (let u of hives) {
      await hiveTracker.createHive(u);
    }

    const testHive = {
      latitude: hive.latitude,
      longtitude: hive.longtitude,
      hiveType: hive.hiveType,
      description: hive.description,
      details: hive.details,

    };
    hives.unshift(testHive);
    const allHives = await hiveTracker.getHives();
    for (var i = 0; i < hives.length; i++) {
      assert.deepEqual(allHives[i].latitude,hives[i].latitude);
      assert.deepEqual(allHives[i].longtitude,hives[i].longtitude);
      assert.deepEqual(allHives[i].hiveType,hives[i].hiveType);
      assert.deepEqual(allHives[i].description,hives[i].description);
      assert.deepEqual(allHives[i].details[0].comments,hives[i].details[0].comments);
      
    };
    
  });

  test("Delete all hives", async function () {
    const hive = await hiveTracker.createHive(newHive);
    const allHives = await hiveTracker.getHives();
    assert.equal(allHives.length, 1);
  });
});
