cargo DATABASE_URL="sqlite:db/sqlite.db" build --release
ROCKET_PROFILE=prod DATABASE_URL="sqlite:db/sqlite.db" ./target/release/server --with-client $@
