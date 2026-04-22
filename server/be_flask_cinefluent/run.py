from app import create_app
import os
import click
from app.extensions import db, socketio
from app.models.models_model import Role, User, UserProfile
from app.services.role_service import get_role_by_name
from app.services.users_service import get_user_by_email


app = create_app()


@app.cli.command("seed")
@click.option("--with-admin", is_flag=True, help="Create an admin user.")
def seed(with_admin):
    roles_to_create = {
        "admin": "Administrator with all permissions",
        "user": "Regular user with limited permissions",
    }

    roles_created_count = 0
    for role_name, role_desc in roles_to_create.items():
        if not Role.query.filter_by(name=role_name).first():
            new_role = Role(name=role_name, description=role_desc)
            db.session.add(new_role)
            roles_created_count += 1

    if roles_created_count > 0:
        db.session.commit()
        click.echo(f"{roles_created_count} role(s) da duoc tao.")
    else:
        click.echo("Tat ca cac role mac dinh da ton tai.")

    if with_admin:
        click.echo("Dang tien hanh tao tai khoan admin...")
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if not all([admin_email, admin_password]):
            click.echo("Loi: Can thiet lap ADMIN_EMAIL va ADMIN_PASSWORD trong file .env.")
            return

        if get_user_by_email(admin_email):
            click.echo(f'Tai khoan admin "{admin_email}" da ton tai.')
            return

        try:
            admin_user = User(email=admin_email, status="active")
            admin_user.set_password(admin_password)

            admin_role = get_role_by_name("admin")
            if admin_role:
                admin_user.roles.append(admin_role)

            admin_profile = UserProfile(
                fullname="System Admin",
                english_level="Advanced",
                total_points=0,
                is_online=False,
                user=admin_user,
            )

            db.session.add(admin_user)
            db.session.add(admin_profile)
            db.session.commit()
            click.echo(f'Tai khoan admin "{admin_email}" da duoc tao thanh cong.')
        except Exception as e:
            db.session.rollback()
            click.echo(f"Loi khi tao tai khoan admin: {e}")


if __name__ == "__main__":
    print("Server dang chay voi SocketIO tai http://0.0.0.0:5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)
