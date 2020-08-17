"use strict";

const db = require('../db')
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');



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
    return results.rows[0]
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
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;