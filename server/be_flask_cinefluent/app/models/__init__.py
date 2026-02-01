# class User(db.Model) - class UserProfile(db.Model): quan hệ 1-1
'''
    - uselist=False: Đây là chỉ thị quan trọng cho SQLAlchemy. Nó nói rằng thuộc tính user.profile sẽ là một
    đối tượng duy nhất, chứ không phải là một danh sách.
    - back_populates='user': Kết nối mối quan hệ này với thuộc tính user được định nghĩa trong model UserProfile.
    Đây là cách khai báo tường minh và được khuyến khích hơn backref vì nó giúp code dễ đọc hơn.
    - cascade="all, delete-orphan": Thuộc tính này quản lý vòng đời của đối tượng con (UserProfile)
      khi đối tượng cha (User) thay đổi.
    - delete: Khi một User bị xóa, UserProfile liên quan cũng sẽ tự động bị xóa theo.
    - delete-orphan: Nếu bạn ngắt kết nối một profile khỏi user (ví dụ: user.profile = None),
      UserProfile "mồ côi" đó sẽ tự động bị xóa khỏi CSDL. Điều này giúp dữ liệu luôn sạch sẽ.

    - Trong UserProfile model:
    user = db.relationship('User', back_populates='profile')

    Đây là định nghĩa ở phía đối diện, chỉ định rằng thuộc tính userprofile.
    user sẽ trỏ ngược lại User thông qua thuộc tính profile đã khai báo ở trên.
'''

