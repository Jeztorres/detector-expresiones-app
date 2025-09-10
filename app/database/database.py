# This file simulates the database connection and stored procedure calls.
# In a real application, you would use a library like pyodbc, psycopg2, or similar
# to connect to a real database (SQL Server, PostgreSQL, etc.) and execute SPs.

# Mock data to simulate a database table
_users_data = [
    {"id": 1, "name": "Jules Verne", "email": "jules.verne@email.com"},
    {"id": 2, "name": "Jane Austen", "email": "jane.austen@email.com"}
]
_next_user_id = 3

def sp_get_all_users():
    """
    Simulates calling a stored procedure 'sp_get_all_users'
    that returns all users from the database.
    """
    print("DATABASE: Executing sp_get_all_users()")
    return _users_data

def sp_get_user_by_id(user_id):
    """
    Simulates calling a stored procedure 'sp_get_user_by_id'
    that returns a single user by their ID.
    """
    print(f"DATABASE: Executing sp_get_user_by_id(user_id={user_id})")
    for user in _users_data:
        if user["id"] == user_id:
            return user
    return None

def sp_create_user(name, email):
    """
    Simulates calling a stored procedure 'sp_create_user'
    that adds a new user to the database and returns the new user's ID.
    """
    print(f"DATABASE: Executing sp_create_user(name='{name}', email='{email}')")
    global _next_user_id
    new_user = {
        "id": _next_user_id,
        "name": name,
        "email": email
    }
    _users_data.append(new_user)
    _next_user_id += 1
    # Stored procedures in some DBs can return output parameters or a result set.
    # Here, we'll just return the ID.
    return new_user["id"]

def sp_update_user(user_id, name, email):
    """
    Simulates calling a stored procedure 'sp_update_user'
    that updates an existing user's data.
    """
    print(f"DATABASE: Executing sp_update_user(user_id={user_id}, name='{name}', email='{email}')")
    for user in _users_data:
        if user["id"] == user_id:
            user["name"] = name
            user["email"] = email
            return True # Indicate success
    return False # Indicate user not found

def sp_delete_user(user_id):
    """
    Simulates calling a stored procedure 'sp_delete_user'
    that removes a user from the database.
    """
    print(f"DATABASE: Executing sp_delete_user(user_id={user_id})")
    global _users_data
    original_len = len(_users_data)
    _users_data = [user for user in _users_data if user["id"] != user_id]
    return len(_users_data) < original_len # Return True if a user was deleted
