from flask import jsonify

def success_response(data=None, code=200, message= None):
    response_body = {
        'code': code,
        'message': message,
        'data': data
    }
    return jsonify(response_body), code

def error_response(message, code=400, error_code=None):
    response_body = {
        'code': code,          
        'message': message,
        'error_code': error_code
            
    }
    return jsonify(response_body), code

def paginated_response(items, paginated_result):
    return{
            'data': items,
            "pagination": {
            "current_page": paginated_result.page,
            "per_page": paginated_result.per_page,
            "total_items": paginated_result.total,
            "total_pages": paginated_result.pages,
            "has_next": paginated_result.has_next,
            "has_prev": paginated_result.has_prev
        }
    }
