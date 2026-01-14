import os
from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient

# Resolve absolute paths for Vercel and local runs
base_dir = os.path.dirname(os.path.abspath(__file__))
template_dir = os.path.join(base_dir, '..', 'templates')
static_dir = os.path.join(base_dir, '..', 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# Fallback data for demonstration and robustness
FALLBACK_JOBS = [
    {
        "title": "Senior Software Architect",
        "company": "NJP Global Tech",
        "location": "London, UK (Remote)",
        "type": "Executive",
        "salary": "$150k - $220k",
        "category": "Technology"
    },
    {
        "title": "Director of Marketing",
        "company": "Elite Growth Partners",
        "location": "New York, USA",
        "type": "Full-time",
        "salary": "$130k - $180k",
        "category": "Marketing"
    },
    {
        "title": "Chief Financial Officer",
        "company": "Global Finance Corp",
        "location": "Dubai, UAE",
        "type": "Executive",
        "salary": "$200k - $300k",
        "category": "Finance"
    },
    {
        "title": "Lead UI/UX Designer",
        "company": "Creative Minds Studio",
        "location": "Berlin, Germany",
        "type": "Contract",
        "salary": "$80 - $120 / hr",
        "category": "Design"
    }
]

# MongoDB Setup with environment variable and error handling
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://naeem:khan4321@cluster0.lypnlgr.mongodb.net/njp_global")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client.njp_global
    # Quick check to see if we can connect
    client.server_info()
    db_connected = True
    print("Successfully connected to MongoDB Atlas.")
except Exception as e:
    db_connected = False
    print(f"Warning: MongoDB connection failed: {str(e)}")
    print("Using fallback data for preview.")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/jobs')
def jobs():
    query = request.args.get('q', '').strip()
    location_query = request.args.get('l', '').strip()
    
    # Mocking a last sync time (in a real app, this comes from a meta collection or the latest doc)
    last_sync = "Just now"

    try:
        if db_connected:
            mongo_query = {}
            if query:
                mongo_query["$or"] = [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"company": {"$regex": query, "$options": "i"}},
                    {"category": {"$regex": query, "$options": "i"}}
                ]
            if location_query:
                mongo_query["location"] = {"$regex": location_query, "$options": "i"}

            jobs_list = list(db.jobs.find(mongo_query, {"_id": 0}).sort("created_at", -1).limit(20))
            
            # Simple metadata wrapper
            return jsonify({
                "jobs": jobs_list if jobs_list else (FALLBACK_JOBS if not (query or location_query) else []),
                "last_updated": last_sync,
                "count": len(jobs_list)
            })
        else:
            # Fallback logic
            results = FALLBACK_JOBS
            if query:
                results = [j for j in results if query.lower() in j['title'].lower() or query.lower() in j['company'].lower()]
            if location_query:
                results = [j for j in results if location_query.lower() in j['location'].lower()]
            
            return jsonify({
                "jobs": results,
                "last_updated": "Fallback Mode (Live Sync Paused)",
                "count": len(results)
            })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "jobs": FALLBACK_JOBS,
            "last_updated": "Review Needed",
            "count": len(FALLBACK_JOBS)
        }), 200

if __name__ == '__main__':
    app.run(debug=True)
