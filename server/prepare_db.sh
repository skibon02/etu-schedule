sqlite3 db/sqlite.db ".databases"
DATABASE_URL="sqlite:db/sqlite.db" cargo sqlx migrate run --source db/migrations
