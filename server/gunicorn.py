import os

bind= f"0.0.0.0:{os.getenv('PORT')}"
worker_class = "eventlet"
workers = 1
log_level = "debug"
timeout = 30