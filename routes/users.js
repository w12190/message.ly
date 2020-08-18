"use strict";

const Router = require("express").Router;
const router = new Router();
const User = require('../models/user');


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', async function(req, res, next) {
  try {
    const users = await User.all();
    return res.json(users);
  } catch(err) {
    return next(err)
  }
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
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

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
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

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

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

module.exports = router;