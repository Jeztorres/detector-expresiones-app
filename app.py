from flask import Flask, request, jsonify
from app.controllers.user_controller import UserController

app = Flask(__name__)

@app.route('/users', methods=['GET'])
def get_users():
    """Endpoint to get all users."""
    users = UserController.get_all_users()
    return jsonify(users)

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Endpoint to get a single user by ID."""
    user = UserController.get_user_by_id(user_id)
    if user:
        return jsonify(user)
    return jsonify({"error": "User not found"}), 404

@app.route('/users', methods=['POST'])
def create_user():
    """Endpoint to create a new user."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data"}), 400

    user = UserController.create_user(data)
    if user:
        # Return the newly created user with a 201 Created status code
        return jsonify(user), 201
    return jsonify({"error": "Failed to create user, check input data"}), 400

@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Endpoint to update an existing user."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data"}), 400

    result = UserController.update_user(user_id, data)

    if "error" in result:
        # The controller returns a dictionary with an error and a status code
        return jsonify(result), result.get("status_code", 404)

    return jsonify(result)

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Endpoint to delete a user."""
    result = UserController.delete_user(user_id)

    if "error" in result:
        return jsonify(result), 404

    # Return the success message with a 200 OK or 204 No Content status
    return jsonify(result), 200

if __name__ == '__main__':
    # Running on 0.0.0.0 makes it accessible from the network
    # This is useful for testing with clients like Thunder Client from the host machine.
    app.run(host='0.0.0.0', port=5000, debug=True)
