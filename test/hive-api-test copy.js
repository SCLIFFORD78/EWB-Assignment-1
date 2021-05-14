"use strict";

const assert = require("chai").assert;
const HiveTracker = require("./hiveTracker");
const fixtures = require("./fixtures.json");
const _ = require("lodash");

suite("Hive API tests", function () {
  let hives = fixtures.hives;
  let newHive = fixtures.newHive;

  const hiveTracker = new HiveTracker(fixtures.hiveTracker);

  suiteSetup(async function () {
    await hiveTracker.deleteAllHives();
    const returnedHive = await hiveTracker.createHive(newHive);
    const response = await hiveTracker.authenticate(newHive);
  });


  suiteTeardown(async function () {
    await hiveTracker.deleteAllHives();
    hiveTracker.clearAuth();
  });

  test("get all hives", async function () {
    await hiveTracker.deleteAllHives();
    await hiveTracker.createHive(newHive);
    await hiveTracker.authenticate(newHive);
    for (let u of hives) {
      await hiveTracker.createHive(u);
    };

    const allHives = await hiveTracker.getHives();
    assert.equal(allHives.length, hives.length + 1);
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
    const addComment = await hiveTracker.addHiveComment(u1._id);
    const u2 = await hiveTracker.getHive(u1._id);
    const newCommentCount = u2.details.length;
    assert.deepEqual(u1.details[0].comments, u2.details[1].comments);
    assert.equal(origCommentCount + 1, newCommentCount);

  });

  test("Delete comments", async function () {
    await hiveTracker.deleteAllHives();
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
    await hiveTracker.deleteAllHives();
    const hive = await hiveTracker.createHive(newHive);
    await hiveTracker.authenticate(newHive);
    for (let u of hives) {
      await hiveTracker.createHive(u);
    }

    const testHive = {
      latitude: hive.latitude,
      longtitude: hive.longtitude,
      hiveType: hive.hiveType,
      description: hive.description,
      details: hive.details,
      added: hive.added,
      hiveType: hive.hiveType,
      hiveNumber: hive.hiveNumber,

    };
    hives.unshift(testHive);
    const allHives = await hiveTracker.getHives();
    for (var i = 0; i < hives.length; i++) {
      assert.include(allHives[i], hives[i]);
      
    };
    
  });

  test("get all hives empty", async function () {
    await hiveTracker.deleteAllHives();
    const hive = await hiveTracker.createHive(newHive);
    await hiveTracker.authenticate(newHive);
    const allHives = await hiveTracker.getHives();
    assert.equal(allHives.length, 1);
  });
});
