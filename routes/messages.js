"use strict";

const Message = require("../models/message");
const { json } = require("body-parser");
const { ensureLoggedIn } = require("../middleware/auth");
const { UnauthorizedError } = require("../expressError");

// Imports
const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 **/
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
  console.log('Route: /:id GET')
  console.log('res.locals.user', res.locals.user);
  try {
    const message = await Message.get(req.params.id);
    if (message.to_user.username === res.locals.user.username ||
      message.from_user.username === res.locals.user.username) {
      return res.json(message);
    } else {
      throw new UnauthorizedError('Don\'t read your neighbor\'s mail!');
    }
  }
  catch (error) {
    return next(error)
  }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async function (req, res, next) {
  console.log('Route: / POST')
  //TODO: get username from token, need token stuff setup

})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
//TODO check if changing the order of this route with /:id makes a difference
// router.get('/:id/read', async function (req, res, next){
//   console.log('Route: /:id/read GET')
// })

// Exports
module.exports = router;

// TODO: saved sql for inserting a message, delete later
// insert into messages (from_username, to_username, body, sent_at) VALUES ('test1', 'test2', 'testmessagebodylongtexthere', current_timestamp);