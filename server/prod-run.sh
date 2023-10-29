DATABASE_URL="sqlite:db/sqlite.db" cargo build --release
ROCKET_PROFILE=prod DATABASE_URL="sqlite:db/sqlite.db" ./target/release/etu_attendance --with-client $@
