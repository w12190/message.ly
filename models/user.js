"use strict";

// Imports
const db = require('../db')
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const { BadRequestError, NotFoundError } = require('../expressError');


/** User of the site. */
class User {
  /**
   * Register new user and adds user to database.
   * Accepts user data; returns user data if registration successful.
   * JSON format: {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    //Calculates pw hash
    try {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
      //TODO: check first before inserting into DB; validating too late
      //Insert into DB
      const results = await db.query(`
      INSERT INTO users (username,
                         password,
                         first_name,
                         last_name,
                         phone,
                         join_at,
                         last_login_at)
      VALUES
          ($1, $2, $3, $4, $5, $6, $7)
      RETURNING username, password, first_name, last_name, phone, last_login_at`,
        [username, hashedPassword, first_name, last_name, phone, new Date(), new Date()])

      const newUser = results.rows[0];
      if (!newUser.username) {
        throw new BadRequestError();
      }
      return newUser;
    }
    catch (error) {
      throw error
    }
  }

  /**
   * Authenticate - check if user credentials are valid
   * Accepts a username and password; returns true if authenticated, false otherewise.
  */
  static async authenticate(username, password) {
    try { //TODO: don't need these try/catch; if you were doing something else on top, then it's useful; otherwise it'll propagate up on their own
      // Query DB for "username"
      const results = await db.query(`
      SELECT username, password
      FROM users
      WHERE username = $1`, [username])

      // Check if user exists
      if (results.rows.length !== 0) {
        if (await bcrypt.compare(password, results.rows[0].password) === true) {
          return true
        }
      }
      return false
    }
    catch (error) {
      throw error
    }
  }

  /**
   * Updates a user's last login time. 
   * Accepts a username, returns the username if update successful.
   */
  static async updateLoginTimestamp(username) {
    try {
      // Assume logged in via authenticate()
      const result = await db.query(` 
      UPDATE users
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username`
        , [username])
      if (!result) { //TODO: this test doesn't work
        throw new NotFoundError()
      }
    }
    catch (error) {
      throw error
    }
  }

  /**
   * Gets and returns basic data on all users.
   * Return format: [{username, first_name, last_name}, ...]
   */
  static async all() {
    try { //TODO: hard to test if you don't order results; order by ASC/DESC any time you return a bunch
      const results = await db.query(`
      SELECT username,
            first_name,
            last_name
      FROM users`);
      return results.rows;
    }
    catch (error) {
      throw error
    }
  }

  /**
   * Gets a user's data.
   * Accepts a username; returns a POJO holding user data.
   * Return format: {username, first_name, last_name, phone, join_at, last_login_at }
   */
  static async get(username) {
    const result = await db.query(`
      SELECT username,
            first_name,
            last_name,
            phone,
            join_at,
            last_login_at
      FROM users
      WHERE username = $1`,
      [username]);

    const user = result.rows[0];
    return user;
  }

  /**
   * Gets all messages from a given user.
   * Accepts a username, returns all messages from the user in an array.
   * Array format: [{id, to_user, body, sent_at, read_at}, ...]
   * to_user format: {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) {
    try {//TODO: aliasing is good
      const uMessages = await db.query(`
        SELECT m.id,
              m.body,
              m.sent_at,
              m.read_at,
              u.username,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
        JOIN users AS u
        ON m.to_username = u.username
        WHERE m.from_username = $1
      `, [username]);
      const messages = uMessages.rows;

      for (let message of messages) {
        const { username, first_name, last_name, phone } = message;
        message['to_user'] = { username, first_name, last_name, phone };
        delete message.username;
        delete message.first_name;
        delete message.last_name;
        delete message.phone;
      }
      return messages;
    } catch (err) {
      return next(err); //TODO: no next, tkae off try/catch
    }
  };

  /**
   * Gets all messages to a given user.
   * Accepts a username, returns an array holding all messages to that user.
   * Array format: [{id, from_user, body, sent_at, read_at}, ...]
   * where rom_user is: {id, first_name, last_name, phone}
   */
  static async messagesTo(username) {
    try {
      const uMessages = await db.query(`
      SELECT m.id,
            m.from_username AS from_user,
            m.body,
            m.sent_at,
            m.read_at,
            u.username,
            u.first_name,
            u.last_name,
            u.phone
      FROM users AS u
      JOIN messages AS m
      ON m.from_username = u.username
      WHERE m.to_username = $1`, [username])

      const messages = uMessages.rows;

      for (let message of messages) {
        const { username, first_name, last_name, phone } = message;
        message['from_user'] = { username, first_name, last_name, phone } //T(leave this) changed id:username->username; instructions wanted id; either tests or instructions are wrong
        delete message.username;
        delete message.first_name;
        delete message.last_name;
        delete message.phone;
      }
      return messages;
    }
    catch (error) {
      throw error
    }
  }
}

// Exports
module.exports = User;