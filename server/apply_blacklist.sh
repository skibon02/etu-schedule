#!/bin/bash

# Path to IP blacklist file
BLACKLIST="ip_blacklist.txt"

while IFS= read -r ip
do
    # Add a rule to drop packets from blacklisted IP
    iptables -A INPUT -s "$ip" -j DROP
done < "$BLACKLIST"