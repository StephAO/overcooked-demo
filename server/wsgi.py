from app import create_app, on_exit, socketio
import os
import atexit

app = create_app()

if __name__ == "__main__":
    print("??? IS TIS BEIGN CALLED", flush=True)
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 80))

    # Attach exit handler to ensure graceful shutdown
    atexit.register(on_exit)

    # https://localhost:80 is external facing address regardless of build environment
    socketio.run(app, host=host, port=port, log_output=app.config['DEBUG'])