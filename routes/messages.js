"use strict";

// Imports
const Message = require("../models/message");
const { json } = require("body-parser");
const { ensureLoggedIn } = require("../middleware/auth");
const { UnauthorizedError } = require("../expressError");
const Router = require("express").Router;

// Router
const router = new Router();


/**** Routes ****/

/**
 * GET '/:id' - Gets a message.
 * Accepts a message id via URL param; returns the message if successful.
 * Returns: {message: {id, body, sent_at, read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 */
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
  console.log('Route: /:id GET')
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

/**
 * POST '/' - Adds a message.
 * Accepts JSON of basic message data; returns the message if add successful.
 * Accepts: {to_username, body}
 * Returns: {message: {id, from_username, to_username, body, sent_at}}
 */
router.post('/', ensureLoggedIn, async function (req, res, next) {
  console.log('Route: messages/ POST')
  try {
    req.body.from_username = res.locals.user.username // ??????????????
    // console.log('req.bodyfrom_user', req.body.from_user)
    console.log('req.body', req.body)
    const message = await Message.create(req.body)
    return res.json(message)
  }
  catch (error) {
    return next(error)
  }
})


/**
 * POST '/:id/read' - Marks a message as read (update its last read time).
 * Accepts a message id; returns JSON of the updated message's data.
 * Accepts: {message: {id, read_at}}
 */
router.get('/:id/read', ensureLoggedIn, async function (req, res, next) {
  console.log('Route: /:id/read GET')

  try {
    const message = await Message.get(req.params.id)
    let updatedMessage

    if (res.locals.user.username === message.to_user.username) {
      updatedMessage = await Message.markRead(message.id)
    }
    return res.json(updatedMessage)
  }
  catch (error) {
      return next(error)
    }
  })

// Exports
module.exports = router;