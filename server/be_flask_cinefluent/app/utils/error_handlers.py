# app/error_handlers.py
from flask import Flask
from pydantic import ValidationError
from .response import error_response  # Import hàm error_response của bạn


def register_error_handlers(app: Flask):
    @app.errorhandler(ValidationError)
    def handle_pydantic_error(e):
        first_error = e.errors()[0]
        field_name = first_error['loc'][-1]
        msg_content = first_error['msg']
        full_message = f"Error in field '{field_name}': {msg_content}"
        return error_response(message=full_message, code=400, error_code="VALIDATION_ERROR")

    @app.errorhandler(ValueError)
    def handle_value_error(e):
        return error_response(message=str(e), code=409, error_code="BUSINESS_ERROR")

    @app.errorhandler(Exception)
    def handle_global_error(e):
        print(f"SYSTEM ERROR: {e}")
        return error_response(message="Internal Server Error", code=500, error_code="INTERNAL_ERROR")