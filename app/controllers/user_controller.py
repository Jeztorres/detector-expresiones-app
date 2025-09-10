from app.models.user_model import User
from app.database import database

class UserController:
    @staticmethod
    def get_all_users():
        """
        Controller method to get all users.
        It calls the corresponding SP from the database layer.
        """
        users_data = database.sp_get_all_users()
        # Convert list of dicts to list of User objects
        users = [User(**data).to_dict() for data in users_data]
        return users

    @staticmethod
    def get_user_by_id(user_id):
        """
        Controller method to get a single user by ID.
        """
        user_data = database.sp_get_user_by_id(user_id)
        if user_data:
            return User(**user_data).to_dict()
        return None

    @staticmethod
    def create_user(data):
        """
        Controller method to create a new user.
        'data' is expected to be a dictionary with 'name' and 'email'.
        """
        name = data.get("name")
        email = data.get("email")

        if not name or not email:
            return None # Invalid data

        new_user_id = database.sp_create_user(name, email)

        # After creating, we can fetch the new user's data to return it
        new_user_data = database.sp_get_user_by_id(new_user_id)
        return User(**new_user_data).to_dict()

    @staticmethod
    def update_user(user_id, data):
        """
        Controller method to update an existing user.
        """
        name = data.get("name")
        email = data.get("email")

        if not name or not email:
            return {"error": "Missing name or email"}, 400 # Bad request

        if database.sp_update_user(user_id, name, email):
            # Return updated user data
            updated_user_data = database.sp_get_user_by_id(user_id)
            return User(**updated_user_data).to_dict()

        return {"error": "User not found"}, 404 # Not found

    @staticmethod
    def delete_user(user_id):
        """
        Controller method to delete a user.
        """
        if database.sp_delete_user(user_id):
            return {"message": "User deleted successfully"}, 200

        return {"error": "User not found"}, 404
