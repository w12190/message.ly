"use strict";

const db = require('../db')
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const {BadRequestError} = require('../expressError');



/** User of the site. */

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    //Calculates pw hash
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    // debugger

    //Insert into DB
    const results = await db.query(`
      INSERT INTO users (username,
                         password,
                         first_name,
                         last_name,
                         phone,
                         join_at)
      VALUES
          ($1, $2, $3, $4, $5, $6)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone, new Date()])
    
    const newUser = results.rows[0];
    debugger
    if ( !newUser.username ) {
      throw new BadRequestError();
    }
    return newUser;
  }

  /** Authenticate: is username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    // Query DB for "username"
    const results = db.query(`
      SELECT username, password
      FROM users
      WHERE username = $1`, [username])

    // Check if user exists
    if (results.rows[0]){
      // Check if password correct
      if (await bcrypt.compare(password, results.rows[0][password]) === True){
        return true
      }
    }
    return false
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    // Assume logged in via authenticate()
    const results = db.query(`
      UPDATE users
      SET last_login_at = $1
      WHERE username = $2
      RETURNING last_login_at
      `, [new Date(), username])
    console.log(results.rows[0]['last_login_at'])
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
      const uMessages = await db.query(`
        SELECT m.id,
              m.to_username,
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
    const uMessages = await db.query(`
      SELECT m.id,
            m.from_username,
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
      WHERE m.to_username = $1`,[username])

      const messages = uMessages.rows;

      for (let message of messages) {
        const { username, first_name, last_name, phone } = message;
        message['from_username'] = { id: username, first_name, last_name, phone }
        delete message.username;
        delete message.first_name;
        delete message.last_name;
        delete message.phone;
      }
      return messages;
  }
}


module.exports = User;