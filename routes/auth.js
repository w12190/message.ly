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

/**** Routes ****/

/**
 * POST '/login' - Handles user login.
 * Accepts user's login credentials; returns JWT token if login successful.
 * Request: {username, password}
 * Response: {token}
 */
router.post('/login', async function (req, res, next) {
  console.log('Route: /login')

  try {
    // Check if user credentials valid
    if (await User.authenticate(req.body.username, req.body.password)) {
      await User.updateLoginTimestamp(req.body.username)

      // Create and return JWT token
      const token = jwt.sign({ username: req.body.username }, config.SECRET_KEY)
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

/**
 * POST '/register' - Handles user registration.
 * Accepts user's credentials; returns user data if registration successful.
 * Request: {username, password, first_name, last_name, phone}
 * Response: {token}
 */
router.post('/register', async function (req, res, next) {
  console.log('Route: /register')
  try {
    const newUser = await User.register(req.body)
    // const username = await User.updateLoginTimestamp(req.body.username) //TODO: added this line to update timestamp on login
    return res.json(newUser)
  } catch (err) {
    return next(err);
  }
})

// Exports
module.exports = router;