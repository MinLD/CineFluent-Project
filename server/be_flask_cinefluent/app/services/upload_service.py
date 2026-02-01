import cloudinary.uploader

def upload_file(file):
    if not file:
        return None

    try:
        upload_result = cloudinary.uploader.upload(file)

        public_id = upload_result.get('public_id')
        secure_url = upload_result.get('secure_url')
        resource_type = upload_result.get('resource_type')

        if not all([public_id, secure_url, resource_type]):
            return None

        return {
            "public_id": public_id,
            "secure_url": secure_url,
            "resource_type": resource_type
        }
    except Exception as e:
        print(f"Cloudinary Error: {e}")
        return None