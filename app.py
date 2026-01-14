
from flask import Flask, render_template, jsonify
from pymongo import MongoClient
import os

app = Flask(__name__)
db = MongoClient("mongodb+srv://admin:naeem123@cluster0.mongodb.net/njp_global").njp_global

@app.route('/')
def home(): return render_template('index.html')

@app.route('/api/jobs')
def jobs(): return jsonify(list(db.jobs.find({}, {"_id":0}).limit(20)))

if __name__ == '__main__': app.run()
