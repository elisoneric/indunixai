import asyncio
import logging
import smtplib
import socket
import ssl
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any, List, Tuple
from backend.core.config import settings

logger = logging.getLogger("indunix.email")

class EmailService:
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL or "notifications@indunixai.com"
        self.from_name = settings.SMTP_FROM_NAME or "Indunix AI"
        self.use_ssl = settings.SMTP_USE_SSL
        self.use_tls = settings.SMTP_USE_TLS
        self.admin_email = settings.ADMIN_NOTIFICATION_EMAIL or "system@indunixai.com"

    def _build_html_wrapper(self, title: str, badge: str, badge_color: str, content_html: str) -> str:
        """
        Ultra-clean, dark glassmorphic email template matching Indunix AI's website aesthetic.
        """
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #07090E;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #F1F5F9;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #07090E;
      padding: 40px 10px;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background-color: #0E131F;
      border: 1px solid #1E293B;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }}
    .header {{
      padding: 32px 32px 24px;
      border-bottom: 1px solid #1E293B;
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 19, 31, 0) 100%);
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .brand-title {{
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      margin: 0;
    }}
    .brand-sub {{
      color: #10B981;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background-color: {badge_color};
      color: #FFFFFF;
      margin-top: 16px;
    }}
    .content {{
      padding: 32px;
      font-size: 14px;
      line-height: 1.6;
      color: #CBD5E1;
    }}
    .card {{
      background-color: #141B2D;
      border: 1px solid #24314A;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: #07090E !important;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 28px;
      text-decoration: none;
      border-radius: 8px;
      margin: 24px 0 8px;
      text-align: center;
    }}
    .data-table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }}
    .data-table td {{
      padding: 10px 0;
      border-bottom: 1px solid #1E293B;
      font-size: 13px;
    }}
    .data-label {{
      color: #64748B;
      width: 40%;
    }}
    .data-val {{
      color: #F8FAFC;
      font-weight: 600;
      text-align: right;
      font-family: 'SF Mono', Consolas, Monaco, monospace;
    }}
    .footer {{
      padding: 24px 32px;
      background-color: #0A0D15;
      border-top: 1px solid #1E293B;
      font-size: 11px;
      color: #64748B;
      line-height: 1.5;
    }}
    .footer-link {{
      color: #94A3B8;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <h1 class="brand-title">INDUNIX<span class="brand-sub">.AI</span></h1>
              <span style="font-size: 11px; color: #94A3B8; display: block; margin-top: 2px;">Sovereign AI Infrastructure</span>
            </td>
            <td align="right">
              <span class="badge">{badge}</span>
            </td>
          </tr>
        </table>
      </div>

      <div class="content">
        {content_html}
      </div>

      <div class="footer">
        <p style="margin: 0 0 8px;">
          This is an automated transmission from <strong>Indunix AI Infrastructure Gateway</strong>.<br>
          Payment processing and corporate compliance governed under <strong>Esam Creative Technologies</strong>.
        </p>
        <p style="margin: 0;">
          <a href="{settings.APP_URL}" class="footer-link">indunixai.com</a> &bull; 
          <a href="{settings.APP_URL}/docs" class="footer-link">Documentation</a> &bull; 
          <a href="{settings.APP_URL}/privacy" class="footer-link">Privacy Policy</a> &bull; 
          <a href="{settings.APP_URL}/terms" class="footer-link">Terms</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""

    def update_config(self, cfg: Dict[str, Any]):
        """Dynamically updates active SMTP configuration from database or admin dashboard."""
        if not cfg:
            return
        if "host" in cfg and cfg["host"]:
            self.host = str(cfg["host"]).strip()
        if "port" in cfg and cfg["port"]:
            try:
                self.port = int(cfg["port"])
            except (ValueError, TypeError):
                pass
        if "user" in cfg and cfg["user"]:
            self.user = str(cfg["user"]).strip()
        if "password" in cfg and cfg["password"]:
            self.password = str(cfg["password"])
        if "from_email" in cfg and cfg["from_email"]:
            self.from_email = str(cfg["from_email"]).strip()
        if "from_name" in cfg and cfg["from_name"]:
            self.from_name = str(cfg["from_name"]).strip()
        if "use_ssl" in cfg:
            self.use_ssl = bool(cfg["use_ssl"])
        if "use_tls" in cfg:
            self.use_tls = bool(cfg["use_tls"])
        logger.info(f"[SMTP CONFIG UPDATED] Host={self.host}, Port={self.port}, User={self.user}")

    def _create_ssl_context(self) -> ssl.SSLContext:
        """Builds an SSL context optimized for cPanel and shared hosting mail servers."""
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx

    def _get_candidate_hosts(self, primary_host: str) -> List[str]:
        """
        Returns candidate hostnames to try.
        If user configured 'mail.indunixai.com' (which resolves to the web application VPS),
        automatically include webmail.indunixai.com and sbg106.truehost.cloud as verified cPanel fallbacks.
        """
        hosts = [primary_host]
        lower_host = primary_host.lower().strip()
        if "indunixai.com" in lower_host:
            for alt in ["webmail.indunixai.com", "sbg106.truehost.cloud"]:
                if alt not in hosts:
                    hosts.append(alt)
        return hosts

    def _send_sync_email_with_diagnostics(
        self, to_email: str, subject: str, html_body: str, text_body: str
    ) -> Tuple[bool, str]:
        """
        Synchronously transmits email via cPanel SMTP with comprehensive diagnostics and auto-fallback.
        Returns: (success: bool, diagnostic_message: str)
        """
        configured_host = (self.host or settings.SMTP_HOST or "").strip()
        port = int(self.port or settings.SMTP_PORT or 465)
        user = (self.user or settings.SMTP_USER or "").strip()
        password = self.password or settings.SMTP_PASSWORD or ""
        from_email = (self.from_email or settings.SMTP_FROM_EMAIL or user or "notifications@indunixai.com").strip()
        from_name = (self.from_name or settings.SMTP_FROM_NAME or "Indunix AI").strip()
        use_ssl = self.use_ssl if self.use_ssl is not None else (port == 465)
        use_tls = self.use_tls if self.use_tls is not None else (port == 587)

        if not configured_host:
            return False, "SMTP configuration missing: Host is not defined."
        if not user or not password:
            return False, "SMTP configuration missing: Username and Password are required."

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg["Date"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")

        part1 = MIMEText(text_body, "plain", "utf-8")
        part2 = MIMEText(html_body, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)
        raw_msg = msg.as_string()

        candidate_hosts = self._get_candidate_hosts(configured_host)
        last_error = ""
        ssl_ctx = self._create_ssl_context()

        for current_host in candidate_hosts:
            try:
                if use_ssl or port == 465:
                    with smtplib.SMTP_SSL(current_host, port, context=ssl_ctx, timeout=12.0) as server:
                        server.ehlo("indunixai.com")
                        server.login(user, password)
                        server.sendmail(from_email, [to_email], raw_msg)
                else:
                    with smtplib.SMTP(current_host, port, timeout=12.0) as server:
                        server.ehlo("indunixai.com")
                        if use_tls or port == 587 or server.has_extn("STARTTLS"):
                            server.starttls(context=ssl_ctx)
                            server.ehlo("indunixai.com")
                        server.login(user, password)
                        server.sendmail(from_email, [to_email], raw_msg)

                logger.info(f"[SMTP DISPATCH SUCCESS] Delivered email to {to_email} via {current_host}:{port}")
                return True, f"Successfully delivered via {current_host}:{port}."

            except smtplib.SMTPAuthenticationError as auth_err:
                code = getattr(auth_err, "smtp_code", 535)
                err_text = ""
                if hasattr(auth_err, "smtp_error") and isinstance(auth_err.smtp_error, bytes):
                    err_text = auth_err.smtp_error.decode(errors="ignore")
                elif hasattr(auth_err, "smtp_error"):
                    err_text = str(auth_err.smtp_error)
                msg_desc = f"cPanel Authentication Failed (Code {code}): {err_text or 'Incorrect username or password'}. Verify that username is your full email address ('{user}') and password is correct in cPanel -> Email Accounts."
                logger.warning(f"[SMTP AUTH ERROR] {msg_desc}")
                return False, msg_desc

            except smtplib.SMTPSenderRefused as sender_err:
                code = getattr(sender_err, "smtp_code", 550)
                msg_desc = f"cPanel Sender Rejected (Code {code}): Address '{from_email}' rejected. Ensure 'Sender From Address' matches your authenticated cPanel email ('{user}')."
                logger.warning(f"[SMTP SENDER ERROR] {msg_desc}")
                return False, msg_desc

            except (smtplib.SMTPConnectError, ConnectionRefusedError) as conn_err:
                last_error = f"Connection refused on {current_host}:{port}."
                logger.warning(f"[SMTP CONNECT REFUSED] {current_host}:{port} - {conn_err}")
                continue

            except (socket.timeout, TimeoutError) as time_err:
                last_error = f"Connection timed out on {current_host}:{port}."
                logger.warning(f"[SMTP TIMEOUT] {current_host}:{port} - {time_err}")
                continue

            except Exception as e:
                last_error = f"Error connecting to {current_host}:{port} ({type(e).__name__}): {str(e)}"
                logger.warning(f"[SMTP DISPATCH FAILED] {current_host}:{port} - {e}")
                continue

        return False, last_error or f"Unable to establish SMTP connection to {configured_host}:{port}."

    def _send_sync_email(self, to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        """Synchronously transmits email via cPanel SMTP."""
        success, _ = self._send_sync_email_with_diagnostics(to_email, subject, html_body, text_body)
        return success

    def test_connection(self, to_email: str) -> Tuple[bool, str]:
        """Tests SMTP credentials and sends a live test email with rich diagnostics."""
        configured_host = (self.host or settings.SMTP_HOST or "").strip()
        port = int(self.port or settings.SMTP_PORT or 465)
        user = (self.user or settings.SMTP_USER or "").strip()
        password = self.password or settings.SMTP_PASSWORD or ""
        from_email = (self.from_email or settings.SMTP_FROM_EMAIL or user or "notifications@indunixai.com").strip()
        from_name = (self.from_name or settings.SMTP_FROM_NAME or "Indunix AI").strip()

        if not configured_host or not user or not password:
            return False, "SMTP configuration incomplete: Host, User, and Password are required."

        subject = "Indunix AI • SMTP Test Dispatch Verification"
        text_body = f"Hello from Indunix AI! This test email confirms that your SMTP mail server ({configured_host}:{port}) is properly connected."
        timestamp = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        content_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">SMTP Dispatch Verified</h2>
          <p>Your mail server has successfully connected to Indunix AI Sovereign Infrastructure and passed live dispatch verification.</p>
          <div class="card">
            <table class="data-table">
              <tr><td class="data-label">Configured Host</td><td class="data-val">{configured_host}</td></tr>
              <tr><td class="data-label">Port</td><td class="data-val">{port}</td></tr>
              <tr><td class="data-label">Authenticated User</td><td class="data-val">{user}</td></tr>
              <tr><td class="data-label">Sender Address</td><td class="data-val">{from_name} &lt;{from_email}&gt;</td></tr>
              <tr><td class="data-label">Timestamp</td><td class="data-val">{timestamp}</td></tr>
              <tr><td class="data-label">Status</td><td class="data-val" style="color: #10B981;">Connected &amp; Verified</td></tr>
            </table>
          </div>
        """
        html = self._build_html_wrapper(subject, "SYSTEM TEST", "#10B981", content_html)
        success, detail = self._send_sync_email_with_diagnostics(to_email, subject, html, text_body)
        if success:
            return True, f"Test email successfully delivered to {to_email}! ({detail})"
        return False, detail

    async def _send_async_email(self, to_email: str, subject: str, html_body: str, text_body: str):
        """Dispatches email in background thread without blocking HTTP requests."""
        try:
            await asyncio.to_thread(self._send_sync_email, to_email, subject, html_body, text_body)
        except Exception as e:
            logger.warning(f"[EMAIL ASYNC ERROR] {str(e)}")

    def send_welcome_email(self, to_email: str, full_name: str):
        """Triggered upon new developer registration."""
        subject = "Welcome to Indunix AI • Your ₦1,000 Starter Credits Are Ready"
        content_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">Welcome aboard, {full_name or 'Builder'}!</h2>
          <p>Your account on <strong>Indunix AI</strong> has been provisioned. We have automatically credited your balance with <strong>₦1,000.00</strong> in complimentary API tokens so you can start testing immediately.</p>
          
          <div class="card">
            <h4 style="margin: 0 0 10px; color: #10B981; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Account Summary</h4>
            <table class="data-table">
              <tr>
                <td class="data-label">Account Email</td>
                <td class="data-val">{to_email}</td>
              </tr>
              <tr>
                <td class="data-label">Starter Grant</td>
                <td class="data-val" style="color: #10B981;">₦1,000.00 NGN</td>
              </tr>
              <tr>
                <td class="data-label">Gateway Endpoint</td>
                <td class="data-val">api.indunixai.com/v1</td>
              </tr>
              <tr>
                <td class="data-label">SDK Compatibility</td>
                <td class="data-val">OpenAI Drop-In</td>
              </tr>
            </table>
          </div>

          <p>Generate your first API key in the Developer Console and point your OpenAI SDK client to our endpoint:</p>
          <pre style="background: #080B11; border: 1px solid #1E293B; padding: 12px; border-radius: 8px; font-size: 12px; color: #38BDF8; overflow-x: auto;">client = OpenAI(
    base_url="https://api.indunixai.com/v1",
    api_key="indunix-live-sk-YOUR_KEY"
)</pre>

          <a href="{settings.APP_URL}/console" class="btn">Launch Developer Console &rarr;</a>
        """
        text_body = f"Welcome to Indunix AI, {full_name}! Your account is active with ₦1,000.00 in starter credits. Visit {settings.APP_URL}/console to generate your API keys."
        html = self._build_html_wrapper(subject, "ACCOUNT ACTIVATED", "#059669", content_html)
        asyncio.create_task(self._send_async_email(to_email, subject, html, text_body))

    def send_login_alert(self, to_email: str, full_name: str, ip_address: str = "Unknown", user_agent: str = "Unknown"):
        """Security alert triggered on account sign-in."""
        subject = "Security Notice: New Sign-In to Your Indunix AI Account"
        timestamp = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        content_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">New Login Detected</h2>
          <p>Hello {full_name or 'Developer'}, your Indunix AI developer console was just accessed. If this was you, no action is required.</p>

          <div class="card">
            <h4 style="margin: 0 0 10px; color: #38BDF8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Session Details</h4>
            <table class="data-table">
              <tr>
                <td class="data-label">Timestamp</td>
                <td class="data-val">{timestamp}</td>
              </tr>
              <tr>
                <td class="data-label">IP Address</td>
                <td class="data-val">{ip_address}</td>
              </tr>
              <tr>
                <td class="data-label">Client Device</td>
                <td class="data-val" style="font-size: 11px;">{user_agent[:60]}...</td>
              </tr>
              <tr>
                <td class="data-label">Status</td>
                <td class="data-val" style="color: #10B981;">Authorized</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94A3B8;">If you did not perform this login, please immediately rotate your account credentials and revoke any active API keys in the developer console.</p>

          <a href="{settings.APP_URL}/console/keys" class="btn">Review Active Keys &rarr;</a>
        """
        text_body = f"New sign-in to your Indunix AI account on {timestamp} from IP {ip_address}. If this wasn't you, revoke your keys at {settings.APP_URL}/console/keys immediately."
        html = self._build_html_wrapper(subject, "SECURITY ALERT", "#2563EB", content_html)
        asyncio.create_task(self._send_async_email(to_email, subject, html, text_body))

    def send_payment_receipt_email(
        self,
        to_email: str,
        full_name: str,
        amount_ngn: float,
        reference: str,
        new_balance_ngn: float,
        channel: str = "CARD"
    ):
        """Payment confirmation invoice email triggered on successful Paystack deposit."""
        subject = f"Receipt: ₦{amount_ngn:,.2f} Deposited to Your Indunix Wallet"
        timestamp = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        content_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">Payment Confirmed</h2>
          <p>Your deposit of <strong>₦{amount_ngn:,.2f} NGN</strong> has been successfully verified and credited to your sovereign API wallet.</p>

          <div class="card">
            <h4 style="margin: 0 0 10px; color: #10B981; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Breakdown</h4>
            <table class="data-table">
              <tr>
                <td class="data-label">Transaction Ref</td>
                <td class="data-val">{reference}</td>
              </tr>
              <tr>
                <td class="data-label">Amount Deposited</td>
                <td class="data-val" style="color: #10B981; font-size: 15px;">₦{amount_ngn:,.2f} NGN</td>
              </tr>
              <tr>
                <td class="data-label">Payment Channel</td>
                <td class="data-val">{channel}</td>
              </tr>
              <tr>
                <td class="data-label">Date & Time</td>
                <td class="data-val">{timestamp}</td>
              </tr>
              <tr>
                <td class="data-label">Updated Balance</td>
                <td class="data-val" style="color: #38BDF8;">₦{new_balance_ngn:,.2f} NGN</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94A3B8;">
            Your credits never expire and are metered per-token with zero foreign exchange fees. Settle all production inference at native Nigerian Naira rates.
          </p>

          <a href="{settings.APP_URL}/console/billing" class="btn">View Billing Ledger &rarr;</a>
        """
        text_body = f"Receipt: ₦{amount_ngn:,.2f} deposited to Indunix AI. Reference: {reference}. New balance: ₦{new_balance_ngn:,.2f}. Manage billing at {settings.APP_URL}/console/billing."
        html = self._build_html_wrapper(subject, "PAYMENT VERIFIED", "#059669", content_html)
        asyncio.create_task(self._send_async_email(to_email, subject, html, text_body))

    def send_api_key_alert(self, to_email: str, full_name: str, key_name: str, key_prefix: str):
        """Security alert triggered when a new API secret key is generated."""
        subject = f"Security Notice: New API Key Created ({key_prefix}...)"
        timestamp = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        content_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">New API Key Issued</h2>
          <p>Hello {full_name or 'Developer'}, a new production API key was just generated in your Indunix AI workspace.</p>

          <div class="card">
            <h4 style="margin: 0 0 10px; color: #F59E0B; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Key Specifications</h4>
            <table class="data-table">
              <tr>
                <td class="data-label">Key Name</td>
                <td class="data-val">{key_name}</td>
              </tr>
              <tr>
                <td class="data-label">Prefix Mask</td>
                <td class="data-val">{key_prefix}...</td>
              </tr>
              <tr>
                <td class="data-label">Created At</td>
                <td class="data-val">{timestamp}</td>
              </tr>
              <tr>
                <td class="data-label">Status</td>
                <td class="data-val" style="color: #10B981;">Active</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94A3B8;">
            <strong>Security Reminder:</strong> Never commit raw API secret keys to public version control (GitHub, GitLab) or embed them in untrusted client-side web apps.
          </p>

          <a href="{settings.APP_URL}/console/keys" class="btn">Manage API Keys &rarr;</a>
        """
        text_body = f"New API key '{key_name}' ({key_prefix}...) created on {timestamp}. Manage keys at {settings.APP_URL}/console/keys."
        html = self._build_html_wrapper(subject, "KEY GENERATION", "#D97706", content_html)
        asyncio.create_task(self._send_async_email(to_email, subject, html, text_body))

    def send_enterprise_inquiry_receipt(
        self,
        lead_email: str,
        full_name: str,
        company_name: str,
        deployment_type: str,
        phone: str,
        estimated_volume: str
    ):
        """Sends confirmation to enterprise client and dispatches alert to internal enterprise sales team."""
        # 1. Email to Lead
        lead_subject = "Enterprise Deployment Request Received • Indunix AI Infrastructure"
        lead_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">Deployment Inquiry Received</h2>
          <p>Dear {full_name},</p>
          <p>Thank you for reaching out regarding dedicated infrastructure for <strong>{company_name}</strong>. Our enterprise engineering team has received your deployment specifications.</p>

          <div class="card">
            <h4 style="margin: 0 0 10px; color: #10B981; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Inquiry Summary</h4>
            <table class="data-table">
              <tr>
                <td class="data-label">Organization</td>
                <td class="data-val">{company_name}</td>
              </tr>
              <tr>
                <td class="data-label">Architecture Type</td>
                <td class="data-val">{deployment_type}</td>
              </tr>
              <tr>
                <td class="data-label">Token Volume</td>
                <td class="data-val">{estimated_volume or 'Custom'}</td>
              </tr>
              <tr>
                <td class="data-label">Callback Target</td>
                <td class="data-val">{phone}</td>
              </tr>
              <tr>
                <td class="data-label">SLA Commitment</td>
                <td class="data-val" style="color: #10B981;">Under 24 Hours</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94A3B8;">
            A senior infrastructure specialist will review your workload requirements and contact you at <strong>{phone}</strong> to provide custom throughput benchmarks and deployment architecture specs.
          </p>
        """
        lead_text = f"Hello {full_name}, your enterprise inquiry for {company_name} has been received. Our team will call you within 24 hours at {phone}."
        wrapped_lead = self._build_html_wrapper(lead_subject, "INQUIRY LOGGED", "#059669", lead_html)
        asyncio.create_task(self._send_async_email(lead_email, lead_subject, wrapped_lead, lead_text))

        # 2. Email alert to Admin/Sales
        admin_subject = f"[NEW ENTERPRISE LEAD] {company_name} ({full_name}) - {deployment_type}"
        admin_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">New Enterprise Client Inquiry</h2>
          <p>An enterprise lead has submitted an inquiry requesting dedicated infrastructure:</p>

          <div class="card">
            <table class="data-table">
              <tr><td class="data-label">Company</td><td class="data-val">{company_name}</td></tr>
              <tr><td class="data-label">Contact Name</td><td class="data-val">{full_name}</td></tr>
              <tr><td class="data-label">Phone</td><td class="data-val">{phone}</td></tr>
              <tr><td class="data-label">Email</td><td class="data-val">{lead_email}</td></tr>
              <tr><td class="data-label">Architecture</td><td class="data-val">{deployment_type}</td></tr>
              <tr><td class="data-label">Volume</td><td class="data-val">{estimated_volume or 'Not specified'}</td></tr>
            </table>
          </div>
          <p><strong>Action Required:</strong> Contact lead within 24 hours.</p>
        """
        wrapped_admin = self._build_html_wrapper(admin_subject, "ACTION REQUIRED", "#DC2626", admin_html)
        asyncio.create_task(self._send_async_email(self.admin_email, admin_subject, wrapped_admin, admin_subject))

    def send_password_changed_alert(self, to_email: str, full_name: str, ip_address: str = "Unknown"):
        """Security alert triggered when account password is changed."""
        subject = "Security Notice: Your Indunix AI Password Was Updated"
        timestamp = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        content_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">Password Changed</h2>
          <p>Hello {full_name or 'Developer'}, your Indunix AI account password was successfully updated.</p>

          <div class="card">
            <h4 style="margin: 0 0 10px; color: #F59E0B; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Security Audit Details</h4>
            <table class="data-table">
              <tr>
                <td class="data-label">Event</td>
                <td class="data-val" style="color: #10B981;">Password Updated</td>
              </tr>
              <tr>
                <td class="data-label">Timestamp</td>
                <td class="data-val">{timestamp}</td>
              </tr>
              <tr>
                <td class="data-label">Originating IP</td>
                <td class="data-val">{ip_address}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94A3B8;">If you did not make this change, please contact support immediately or revoke your credentials.</p>
        """
        text_body = f"Your Indunix AI password was updated on {timestamp} from IP {ip_address}."
        html = self._build_html_wrapper(subject, "SECURITY ALERT", "#F59E0B", content_html)
        asyncio.create_task(self._send_async_email(to_email, subject, html, text_body))

    def send_credit_granted_email(
        self,
        to_email: str,
        full_name: str,
        amount_ngn: float,
        credit_type: str,
        reason: str
    ):
        """Dispatched when system administrator awards bonus or cash credits to a user wallet."""
        type_label = "Bonus Credits" if credit_type == "bonus" else "Direct Cash Balance"
        subject = f"Credit Awarded: ₦{amount_ngn:,.2f} Added to Your Indunix Wallet"
        timestamp = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        content_html = f"""
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px;">Wallet Credit Received</h2>
          <p>Hello {full_name or 'Developer'}, an administrative credit adjustment of <strong>₦{amount_ngn:,.2f} NGN</strong> has been applied to your sovereign API wallet.</p>

          <div class="card">
            <h4 style="margin: 0 0 10px; color: #10B981; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Credit Details</h4>
            <table class="data-table">
              <tr>
                <td class="data-label">Credit Amount</td>
                <td class="data-val" style="color: #10B981; font-size: 15px;">₦{amount_ngn:,.2f} NGN</td>
              </tr>
              <tr>
                <td class="data-label">Type</td>
                <td class="data-val">{type_label}</td>
              </tr>
              <tr>
                <td class="data-label">Audit Reason</td>
                <td class="data-val">{reason}</td>
              </tr>
              <tr>
                <td class="data-label">Timestamp</td>
                <td class="data-val">{timestamp}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #94A3B8;">
            These credits can be used immediately across all sovereign AI model inference endpoints.
          </p>

          <a href="{settings.APP_URL}/console/billing" class="btn">View Ledger in Console &rarr;</a>
        """
        text_body = f"₦{amount_ngn:,.2f} {type_label} credited to your Indunix AI wallet. Reason: {reason}."
        html = self._build_html_wrapper(subject, "CREDIT AWARDED", "#059669", content_html)
        asyncio.create_task(self._send_async_email(to_email, subject, html, text_body))

email_service = EmailService()

