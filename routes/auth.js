"use strict";

// Imports
const User = require('../models/user')
const express = require('express')
const jwt = require('jsonwebtoken')
const config = require('../config')
const { UnauthorizedError, BadRequestError } = require('../expressError')

const Router = require("express").Router;
const router = new Router();

// Middleware
router.use(express.json());


/** POST /login: {username, password} => {token} */
router.post('/login', function (req, res, next) {
  console.log('Route: /login')

  try {
    const { username, password } = req.body
    // Check if user credentials valid
    if (User.authenticate(req.body)) {
      User.updateLoginTimestamp(username)

      // Create and return JWT token
      const token = jwt.sign({ username }, config.SECRET_KEY)
      return res.json({ token })
    }
    else {
      throw new UnauthorizedError()
    }
  }
  catch (error) {
    return next(error)
  }
})

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function (req, res, next) {
  console.log('Route: /register')
  try {
  const newUser = await User.register(req.body)
  return res.json(newUser)
  
} catch (err) {
  return next(err);
}
});

// Exports
module.exports = router;