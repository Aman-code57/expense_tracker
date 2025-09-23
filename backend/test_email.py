import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config

# Test email configuration
SMTP_SERVER = config("SMTP_SERVER", default="smtp.gmail.com")
SMTP_PORT = config("SMTP_PORT", default=587, cast=int)
EMAIL_USER = config("EMAIL_USER", default="amanraturi5757@gmail.com")
EMAIL_PASSWORD = config("EMAIL_PASSWORD", default="epif azzt hgjg zvcy")

def test_email_connection():
    """Test email connection and send a test email"""
    try:
        print(f"Testing email connection to {EMAIL_USER}")
        print(f"SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")

        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = EMAIL_USER  # Send to self for testing
        msg['Subject'] = "Email Test - Expense Tracker"

        body = "This is a test email to verify SMTP configuration is working correctly."
        msg.attach(MIMEText(body, 'plain'))

        # Connect to SMTP server
        print("Connecting to SMTP server...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.set_debuglevel(1)  # Enable debug output
        server.starttls()

        print("Attempting to login...")
        server.login(EMAIL_USER, EMAIL_PASSWORD)

        print("Sending test email...")
        server.sendmail(EMAIL_USER, EMAIL_USER, msg.as_string())
        server.quit()

        print(" Email test successful!")
        return True

    except smtplib.SMTPAuthenticationError as e:
        print(f"Authentication failed: {e}")
        print("This usually means the email password is incorrect or Gmail requires app-specific password.")
        return False
    except smtplib.SMTPConnectError as e:
        print(f"Connection failed: {e}")
        print("This usually means the SMTP server settings are incorrect.")
        return False
    except Exception as e:
        print(f"Email test failed: {e}")
        return False

if __name__ == "__main__":
    print("=== Email Configuration Test ===")
    print(f"Email User: {EMAIL_USER}")
    print(f"SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
    print(f"Password configured: {'Yes' if EMAIL_PASSWORD else 'No'}")
    print("-" * 40)

    success = test_email_connection()

    if success:
        print("\nEmail configuration is working correctly!")
        print("The forgot password and OTP functionality should work.")
    else:
        print("\nEmail configuration needs to be fixed.")
        print("\nTroubleshooting steps:")
        print("1. Check if the email password is correct")
        print("2. Make sure you're using an App Password for Gmail")
        print("3. Verify Gmail settings allow less secure apps or use OAuth2")
        print("4. Check if 2-factor authentication is enabled on Gmail")
