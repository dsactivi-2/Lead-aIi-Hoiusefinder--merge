"""Communication modules for email and WhatsApp"""
from .email_sender import EmailSender
from .whatsapp_sender import WhatsAppSender
from .templates import EmailTemplate, WhatsAppTemplate

__all__ = ['EmailSender', 'WhatsAppSender', 'EmailTemplate', 'WhatsAppTemplate']
