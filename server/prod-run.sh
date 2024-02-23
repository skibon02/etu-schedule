DATABASE_URL=postgres://etu_attend_app:12346543@localhost cargo build --release
ROCKET_PROFILE=production DATABASE_URL=postgres://etu_attend_app:12346543@localhost ./target/release/etu-schedule --with-client $@
