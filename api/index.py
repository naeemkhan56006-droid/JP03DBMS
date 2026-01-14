import os
from flask import Flask, render_template, jsonify
from pymongo import MongoClient

# Configure Flask to find templates and static files in the root directory
app = Flask(__name__, template_folder='../templates', static_folder='../static')

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
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://naeem:khan4321@cluster0.mongodb.net/njp_global")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client.njp_global
    # Quick check to see if we can connect
    client.server_info()
    db_connected = True
except Exception:
    db_connected = False
    print("Warning: MongoDB connection failed. Using fallback data.")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/jobs')
def jobs():
    try:
        if db_connected:
            jobs_list = list(db.jobs.find({}, {"_id": 0}).limit(20))
            # If DB is empty, use fallback
            if not jobs_list:
                return jsonify(FALLBACK_JOBS)
            return jsonify(jobs_list)
        else:
            return jsonify(FALLBACK_JOBS)
    except Exception as e:
        return jsonify({"error": str(e), "status": 500, "fallback": FALLBACK_JOBS}), 200 # Return 200 with fallback on error

if __name__ == '__main__':
    app.run(debug=True)
