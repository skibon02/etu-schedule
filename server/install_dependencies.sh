#!/bin/bash

# Exit script on any error
set -e

# Update package list
echo "Updating package list..."
sudo apt update

# Install PostgreSQL and its contrib package
echo "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
echo "Starting and enabling PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a new PostgreSQL role
echo "Creating new PostgreSQL role..."
ROLE="etu_attend_app"
DB="etu_attend_app"
echo "Checking if role '$ROLE' exists..."
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$ROLE'" | grep -q 1; then
    echo "Role '$ROLE' already exists. Skipping creation."
else
    echo "Creating new PostgreSQL role '$ROLE'..."
    sudo -u postgres psql -c "CREATE ROLE $ROLE WITH LOGIN SUPERUSER PASSWORD '12346543';"
fi

# Check if the database exists and create it if it doesn't
echo "Checking if database '$DB' exists..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB; then
    echo "Database '$DB' already exists. Skipping creation."
else
    echo "Creating new database '$DB'..."
    sudo -u postgres createdb -O $ROLE $DB
fi

# Modify pg_hba.conf for md5 authentication
echo "Updating pg_hba.conf for md5 authentication..."
PG_VERSION=$(psql -V | grep -oP '\d+' | head -1)
PG_CONF_PATH="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

if ! sudo grep -q "local   all             all                                     md5" "$PG_CONF_PATH"; then
    sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_CONF_PATH"
    echo "pg_hba.conf updated."

    # Restart PostgreSQL to apply changes
    echo "Restarting PostgreSQL service to apply changes..."
    sudo systemctl restart postgresql
else
    echo "pg_hba.conf already set to md5. No changes made."
fi

echo "Installing sqlx-cli..."
cargo install sqlx-cli --no-default-features --features postgres

echo "PostgreSQL installation and setup completed successfully."
