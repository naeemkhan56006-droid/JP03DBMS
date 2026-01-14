
from flask import Flask, render_template, jsonify
from pymongo import MongoClient
import os

app = Flask(__name__)
db = MongoClient("mongodb+srv://admin:naeem123@cluster0.mongodb.net/njp_global").njp_global

@app.route('/')
def home(): return render_template('index.html')

@app.route('/api/jobs')
def jobs():
    try:
        jobs_list = list(db.jobs.find({}, {"_id":0}).limit(20))
        return jsonify(jobs_list)
    except Exception as e:
        return jsonify({"error": str(e), "status": 500}), 500

if __name__ == '__main__': app.run()
