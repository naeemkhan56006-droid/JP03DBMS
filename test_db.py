import os
import sys
from pymongo import MongoClient
import dns.resolver

MONGO_URI = "mongodb+srv://naeem:khan4321@cluster0.lypnlgr.mongodb.net/njp_global"

print(f"Testing connection to: {MONGO_URI}")

try:
    # Check DNS resolution for SRV record
    print("Checking DNS resolution for _mongodb._tcp.cluster0.lypnlgr.mongodb.net...")
    try:
        answers = dns.resolver.resolve('_mongodb._tcp.cluster0.lypnlgr.mongodb.net', 'SRV')
        for rdata in answers:
            print(f"SRV record found: {rdata.target}")
    except Exception as dns_err:
        print(f"DNS Resolution Error: {dns_err}")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    print("Attempting to get server info...")
    info = client.server_info()
    print("Successfully connected to MongoDB!")
    print(f"Server Info: {info.get('version')}")
    
    db = client.njp_global
    count = db.jobs.count_documents({})
    print(f"Number of jobs in database: {count}")

except Exception as e:
    print(f"Detailed Error: {type(e).__name__}: {e}")
    sys.exit(1)
