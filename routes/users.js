"use strict";

// Imports
const Router = require("express").Router;
const User = require('../models/user');

// Router
const router = new Router();

/**** Routes ****/

/**
 * GET '/' - Gets and returns a list of all users in JSON.
 * Format: {users: [{username, first_name, last_name, phone}, ...]}
 */
router.get('/', async function(req, res, next) {
  try {
    const users = await User.all();
    return res.json(users);
  } catch(err) {
    return next(err)
  }
})

/**
 * GET /:username - Gets a user's data.
 * Accepts a username; returns the user's data in JSON.
 * Format: {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 */
router.get('/:username', async function(req, res, next) {
  try {
    console.log('AT /:username');
    const username = req.params.username;
    // debugger
    const user = await User.get(username);
    return res.json(user);
  } catch (err) {
    return next(err);
  }
})

/**
 * GET /:username/to - Gets all messages to a given user.
 * Accepts a username; returns JSON of all messages to the user.
 * Format: {messages: [{id, body, sent_at, read_at,
 *          from_user: {username, first_name, last_name, phone}}, ...]}
 */
router.get('/:username/to', async function (req, res, next) {
  console.log('AT: /:username/to');
  try {
    const username = req.params.username;
    const messagesFrom = await User.messagesFrom(username);
    return res.json(messagesFrom);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /:username/from - Get all messages from a given user.
 * Accepts a username; returns JSON of all messages to the user.
 * JSON format: {messages: [{id, body, sent_at, read_at,
 *               to_user: {username, first_name, last_name, phone}}, ...]}
 */
 router.get('/:username/from', async function(req, res, next) {
   console.log('/:username/from');
   try {
     const username = req.params.username;
     const messagesTo = await User.messagesTo(username);
     return res.json(messagesTo);
   } catch (err) {
     return next(err);
   }
 })

// Exports
module.exports = router;