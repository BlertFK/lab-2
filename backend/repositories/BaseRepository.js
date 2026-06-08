const db = require("../config/db");

class BaseRepository {
  constructor(tableName, dbClient = db) {
    this.tableName = tableName;
    this.db = dbClient;
  }

  query(sql, params = []) {
    return this.db.query(sql, params);
  }
}

module.exports = BaseRepository;
