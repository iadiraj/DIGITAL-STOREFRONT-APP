from flask import jsonify

def success_response(data=None, message="Operation successful", status_code=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data or {}
    }), status_code

def error_response(message="Operation failed", status_code=400):
    return jsonify({
        "success": False,
        "message": message
    }), status_code
