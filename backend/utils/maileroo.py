"""
Maileroo Email Utility Module

This module provides a unified email sending interface using the Maileroo API.
All email functionality in the application should use this module.

Configuration (via environment variables):
- MAILEROO_API_KEY: Your Maileroo sending key (required)
- MAILEROO_FROM_EMAIL: The verified sender email address (required)

Usage:
    from utils.maileroo import send_email, test_maileroo_connection
    
    # Send an email
    result = await send_email(
        to="recipient@example.com",
        subject="Hello",
        html="<h1>Hello World</h1>",
        text="Hello World"  # Optional plain text fallback
    )
    
    # Test connectivity
    is_connected = await test_maileroo_connection()
"""

import os
import logging
import httpx
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

# Maileroo API Configuration
# Uses the /send endpoint with form data (simpler than JSON endpoint)
MAILEROO_API_URL = "https://smtp.maileroo.com/send"
MAILEROO_API_KEY = os.environ.get('MAILEROO_API_KEY', '')
MAILEROO_FROM_EMAIL = os.environ.get('MAILEROO_FROM_EMAIL', '')


class EmailStatus(Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class EmailResult:
    """Result of an email send operation"""
    success: bool
    message: str
    email_id: Optional[str] = None
    error: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None


@dataclass
class BulkEmailResult:
    """Result of a bulk email send operation"""
    status: EmailStatus
    total_sent: int
    total_failed: int
    failed_emails: List[str]
    message: str
    error_details: str = ""


def _get_config() -> tuple:
    """
    Get Maileroo configuration from environment variables.
    
    Returns:
        tuple: (api_key, from_email)
        
    Raises:
        ValueError: If required configuration is missing
    """
    api_key = os.environ.get('MAILEROO_API_KEY', MAILEROO_API_KEY)
    from_email = os.environ.get('MAILEROO_FROM_EMAIL', MAILEROO_FROM_EMAIL)
    
    if not api_key:
        logger.error("MAILEROO_API_KEY environment variable is not set")
        raise ValueError("Maileroo API key is not configured. Set MAILEROO_API_KEY environment variable.")
    
    if not from_email:
        logger.error("MAILEROO_FROM_EMAIL environment variable is not set")
        raise ValueError("Maileroo sender email is not configured. Set MAILEROO_FROM_EMAIL environment variable.")
    
    return api_key, from_email


async def send_email(
    to: Union[str, List[str]],
    subject: str,
    html: str,
    text: Optional[str] = None,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> EmailResult:
    """
    Send an email using the Maileroo API.
    
    Args:
        to: Recipient email address(es) - can be a string or list of strings
        subject: Email subject line
        html: HTML content of the email
        text: Optional plain text version of the email
        from_email: Optional sender email (defaults to MAILEROO_FROM_EMAIL)
        from_name: Optional sender display name
        reply_to: Optional reply-to email address
        
    Returns:
        EmailResult: Object containing success status, message, and any errors
        
    Example:
        result = await send_email(
            to="user@example.com",
            subject="Welcome!",
            html="<h1>Welcome to our platform</h1>"
        )
        if result.success:
            print(f"Email sent successfully: {result.email_id}")
        else:
            print(f"Failed to send email: {result.error}")
    """
    try:
        api_key, default_from_email = _get_config()
        sender_email = from_email or default_from_email
        
        # Normalize 'to' to a string (comma-separated for multiple)
        if isinstance(to, list):
            to_str = ", ".join(to)
        else:
            to_str = to
        
        # Build form data payload (Maileroo /send endpoint uses form data)
        form_data = {
            "from": f"{from_name} <{sender_email}>" if from_name else sender_email,
            "to": to_str,
            "subject": subject,
            "html": html,
        }
        
        # Add optional fields
        if text:
            form_data["plain"] = text
        if reply_to:
            form_data["reply_to"] = reply_to
        
        logger.info(f"Sending email to {to_str} via Maileroo")
        logger.debug(f"Maileroo payload: from={form_data['from']}, subject={subject}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MAILEROO_API_URL,
                headers={
                    "X-API-Key": api_key,
                },
                data=form_data,  # Use form data, not JSON
                timeout=30.0
            )
            
            # Try to parse response
            try:
                response_data = response.json() if response.text else {}
            except Exception:
                response_data = {"raw_text": response.text}
            
            logger.debug(f"Maileroo response: status={response.status_code}, body={response_data}")
            
            if response.status_code == 200:
                # Success - extract message/reference ID
                email_id = response_data.get("ref_id") or response_data.get("message_id") or response_data.get("id", "")
                logger.info(f"Email sent successfully to {to_str}. Ref ID: {email_id}")
                return EmailResult(
                    success=True,
                    message=f"Email sent successfully",
                    email_id=email_id,
                    raw_response=response_data
                )
            else:
                # Error - extract error message
                error_msg = (
                    response_data.get("message") or 
                    response_data.get("error") or 
                    response_data.get("raw_text") or 
                    f"HTTP {response.status_code}"
                )
                logger.error(f"Maileroo API error: {error_msg}")
                return EmailResult(
                    success=False,
                    message="Failed to send email",
                    error=error_msg,
                    raw_response=response_data
                )
                
    except ValueError as e:
        # Configuration error
        return EmailResult(
            success=False,
            message="Email configuration error",
            error=str(e)
        )
    except httpx.TimeoutException:
        logger.error("Maileroo API request timed out")
        return EmailResult(
            success=False,
            message="Email service timeout",
            error="Request to email service timed out. Please try again."
        )
    except httpx.RequestError as e:
        logger.error(f"Maileroo API request failed: {e}")
        return EmailResult(
            success=False,
            message="Email service connection error",
            error=f"Failed to connect to email service: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error sending email: {e}")
        return EmailResult(
            success=False,
            message="Unexpected error sending email",
            error=str(e)
        )


async def send_bulk_emails(
    emails: List[Dict[str, Any]],
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
) -> BulkEmailResult:
    """
    Send multiple emails with individual content.
    
    Args:
        emails: List of email dicts with keys: to, subject, html, text (optional)
        from_email: Optional sender email override
        from_name: Optional sender display name
        
    Returns:
        BulkEmailResult: Summary of the bulk send operation
        
    Example:
        emails = [
            {"to": "user1@example.com", "subject": "Hello User 1", "html": "<p>Hi!</p>"},
            {"to": "user2@example.com", "subject": "Hello User 2", "html": "<p>Hi!</p>"},
        ]
        result = await send_bulk_emails(emails)
        print(f"Sent {result.total_sent} of {len(emails)} emails")
    """
    successful_count = 0
    failed_emails = []
    last_error = ""
    
    for email_data in emails:
        result = await send_email(
            to=email_data["to"],
            subject=email_data["subject"],
            html=email_data["html"],
            text=email_data.get("text"),
            from_email=from_email,
            from_name=from_name,
        )
        
        if result.success:
            successful_count += 1
        else:
            failed_emails.append(email_data["to"])
            last_error = result.error or "Unknown error"
    
    total = len(emails)
    
    if successful_count == total:
        status = EmailStatus.SUCCESS
        message = f"Successfully sent all {total} email(s)"
    elif successful_count == 0:
        status = EmailStatus.FAILED
        message = f"Failed to send any emails"
    else:
        status = EmailStatus.PARTIAL
        message = f"Sent {successful_count} of {total} email(s)"
    
    return BulkEmailResult(
        status=status,
        total_sent=successful_count,
        total_failed=len(failed_emails),
        failed_emails=failed_emails,
        message=message,
        error_details=last_error if failed_emails else ""
    )


async def test_maileroo_connection() -> Dict[str, Any]:
    """
    Test Maileroo API connectivity and configuration.
    
    This function verifies that:
    1. The API key is configured
    2. The sender email is configured
    3. The API endpoint is reachable
    
    Returns:
        dict: Status information with keys:
            - connected: bool
            - api_key_set: bool
            - from_email_set: bool
            - from_email: str
            - message: str
            
    Example:
        status = await test_maileroo_connection()
        if status["connected"]:
            print("Maileroo is configured correctly")
    """
    result = {
        "connected": False,
        "api_key_set": False,
        "from_email_set": False,
        "from_email": "",
        "message": "",
    }
    
    # Check API key
    api_key = os.environ.get('MAILEROO_API_KEY', MAILEROO_API_KEY)
    result["api_key_set"] = bool(api_key)
    
    # Check sender email
    from_email = os.environ.get('MAILEROO_FROM_EMAIL', MAILEROO_FROM_EMAIL)
    result["from_email_set"] = bool(from_email)
    result["from_email"] = from_email if from_email else "Not configured"
    
    if not api_key:
        result["message"] = "MAILEROO_API_KEY environment variable is not set"
        return result
    
    if not from_email:
        result["message"] = "MAILEROO_FROM_EMAIL environment variable is not set"
        return result
    
    # Test API connectivity with a minimal request
    try:
        async with httpx.AsyncClient() as client:
            # Make a minimal request - Maileroo will return an error for missing fields
            # but we can verify the API key is valid
            response = await client.post(
                MAILEROO_API_URL,
                headers={
                    "X-API-Key": api_key,
                },
                data={
                    "from": from_email,
                    "to": "",  # Empty to trigger validation error, not auth error
                    "subject": "",
                    "html": "",
                },
                timeout=10.0
            )
            
            # If we get any response (even validation error), the API is reachable
            # Auth errors would be 401/403
            if response.status_code in [200, 400, 422]:
                result["connected"] = True
                result["message"] = "Maileroo API is configured and reachable"
            elif response.status_code == 401 or response.status_code == 403:
                result["message"] = "Maileroo API key is invalid or unauthorized"
            else:
                result["connected"] = True  # Any other response means API is reachable
                result["message"] = f"Maileroo API is reachable (status: {response.status_code})"
                
    except httpx.TimeoutException:
        result["message"] = "Maileroo API connection timed out"
    except httpx.RequestError as e:
        result["message"] = f"Failed to connect to Maileroo API: {str(e)}"
    except Exception as e:
        result["message"] = f"Unexpected error testing Maileroo: {str(e)}"
    
    return result


def get_email_config() -> Dict[str, str]:
    """
    Get current email configuration (for debugging/display).
    
    Returns:
        dict with api_key_set (bool), from_email (string)
    """
    api_key = os.environ.get('MAILEROO_API_KEY', MAILEROO_API_KEY)
    from_email = os.environ.get('MAILEROO_FROM_EMAIL', MAILEROO_FROM_EMAIL)
    
    return {
        "api_key_set": bool(api_key),
        "from_email": from_email if from_email else "Not configured",
        "provider": "Maileroo",
        "api_url": MAILEROO_API_URL,
    }
