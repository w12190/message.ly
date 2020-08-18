"use strict";

const db = require('../db')
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const { BadRequestError, NotFoundError } = require('../expressError');



/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    //Calculates pw hash
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    //Insert into DB
    //TODO: added last_login_at to the INSERT INTo so we stopped failing the 'can get' test b/c it register a user via User.get, not /register which calls updateLastLoginTime().
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

  /** Authenticate: is username/password valid? Returns boolean.
   * Accepts a username and password; returns true if authenticated, false otherewise.
  */
  static async authenticate(username, password) {
    // Query DB for "username"
    //TODO: added await to following line
    const results = await db.query(`
      SELECT username, password
      FROM users
      WHERE username = $1`, [username])
  debugger
    // Check if user exists
    if (results.rows.length !== 0) { //TODO: cannot access .rows[0] if no rows, so changed to rows.length === 0 to check
      // Check if password correct
      if (await bcrypt.compare(password, results.rows[0].password) === true) {
        return true
      }
    }
    return false
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    // Assume logged in via authenticate()
    //TODO: forgot await
    const result = await db.query(` 
      UPDATE users
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username` //TODO: commented out this line
      , [username]) //TODO: changed new Date() to current_timestamp on 67
    if (!result) {
      throw new NotFoundError()
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(`
      SELECT username,
            first_name,
            last_name
      FROM users`);
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

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

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    try {
      //TODO: removed an extra m.to_username
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
      return next(err);
    }
  };

  // from_username

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    //TODO: added AS from_user to correct the column name
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
      message['from_user'] = { username, first_name, last_name, phone } //TODO: (leave this) changed id:username->username; instructions wanted id; either tests or instructions are wrong
      delete message.username;
      delete message.first_name;
      delete message.last_name;
      delete message.phone;
    }
    return messages;
  }
}


module.exports = User;