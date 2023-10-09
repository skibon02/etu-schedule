#!/bin/bash
DATABASE_URL="sqlite:db/sqlite.db" sqlx migrate run
