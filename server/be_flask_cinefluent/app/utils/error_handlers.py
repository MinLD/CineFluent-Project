# app/error_handlers.py
from flask import Flask
from pydantic import ValidationError
from werkzeug.exceptions import HTTPException
from .response import error_response


def register_error_handlers(app: Flask):
    @app.errorhandler(ValidationError)
    def handle_pydantic_error(e):
        # Lấy lỗi đầu tiên để hiển thị cho FE
        try:
            errors = e.errors()
            if errors:
                first_error = errors[0]
                field = first_error.get('loc', ['field'])[-1]
                msg = first_error.get('msg', 'Dữ liệu không hợp lệ')
                
                # Custom lại một số thông báo phổ biến
                if "Field required" in msg:
                    friendly_msg = f"Trường '{field}' là bắt buộc."
                elif "string_too_short" in msg:
                    friendly_msg = f"Trường '{field}' quá ngắn."
                elif "string_too_long" in msg:
                    friendly_msg = f"Trường '{field}' quá dài."
                else:
                    friendly_msg = f"Lỗi trường '{field}': {msg}"
                    
                return error_response(message=friendly_msg, code=400, error_code="VALIDATION_ERROR")
        except:
            pass
            
        return error_response(message="Dữ liệu gửi lên không đúng định dạng.", code=400, error_code="VALIDATION_ERROR")

    @app.errorhandler(ValueError)
    def handle_value_error(e):
        return error_response(message=str(e), code=409, error_code="BUSINESS_ERROR")

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return error_response(message=e.description, code=e.code, error_code="HTTP_ERROR")

    @app.errorhandler(Exception)
    def handle_global_error(e):
        # Vẫn log chi tiết ra terminal để Admin/Dev theo dõi
        print(f"--- SYSTEM ERROR LOG ---")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"------------------------")
        
        # Trả về thông báo chung chung và an toàn cho Frontend
        return error_response(message="Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.", code=500, error_code="INTERNAL_ERROR")