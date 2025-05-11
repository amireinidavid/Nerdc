import emailjs from '@emailjs/browser';
import { emailConfig } from './emailConfig';

// Define the email parameters interface as Record<string, unknown> for EmailJS compatibility
export interface EmailParams extends Record<string, unknown> {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  journal_title?: string;
  journal_id?: number;
  publication_date?: string;
}

/**
 * Send an email notification using EmailJS
 * @param params - The email parameters
 * @returns Promise with the result of the email sending operation
 */
export const sendEmail = async (params: EmailParams): Promise<any> => {
  try {
    // Add detailed logging to diagnose the issue
    console.log('Email parameters:', JSON.stringify({
      to_email: params.to_email,
      to_name: params.to_name,
      subject: params.subject,
      // Don't log full message for privacy
      hasMessage: !!params.message,
    }, null, 2));
    
    // Stronger validation for email
    if (!params.to_email) {
      console.error('Email sending failed: Recipient email address is null or undefined');
      return { success: false, error: 'Recipient email address is required' };
    }
    
    if (typeof params.to_email !== 'string') {
      console.error(`Email sending failed: Recipient email is not a string, got: ${typeof params.to_email}`);
      return { success: false, error: 'Invalid recipient email format' };
    }
    
    if (params.to_email.trim() === '') {
      console.error('Email sending failed: Recipient email address is empty string');
      return { success: false, error: 'Recipient email address is empty' };
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.to_email)) {
      console.error(`Email sending failed: Invalid email format: ${params.to_email}`);
      return { success: false, error: 'Invalid email format' };
    }
    
    if (!params.to_name || params.to_name.trim() === '') {
      console.warn('Warning: Recipient name is empty');
      // Set a default name to avoid issues
      params.to_name = 'Author';
    }
    
    // Log exactly what we're sending to EmailJS
    console.log('Attempting to send email via EmailJS with service ID:', emailConfig.serviceId);
    
    const result = await emailjs.send(
      emailConfig.serviceId,
      emailConfig.templateId,
      params,
      emailConfig.publicKey
    );
    
    console.log('Email sent successfully:', result.text);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending email:', error);
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    return { success: false, error };
  }
};

/**
 * Send a journal publication notification to an author
 * @param authorEmail - Author's email address
 * @param authorName - Author's name
 * @param journalTitle - Title of the published journal
 * @param journalId - ID of the published journal
 * @returns Promise with the result of the email sending operation
 */
export const sendJournalPublishedNotification = async (
  authorEmail: string,
  authorName: string,
  journalTitle: string,
  journalId: number
): Promise<any> => {
  console.log('Preparing to send publication notification to:', { authorEmail, authorName, journalTitle, journalId });
  
  // More robust validation
  if (!authorEmail) {
    console.error('Cannot send publication notification: Author email is null or undefined');
    return { success: false, error: 'Author email is required' };
  }
  
  if (typeof authorEmail !== 'string') {
    console.error(`Cannot send publication notification: Author email is not a string, got: ${typeof authorEmail}`);
    return { success: false, error: 'Invalid author email type' };
  }
  
  if (authorEmail.trim() === '') {
    console.error('Cannot send publication notification: Author email is empty string');
    return { success: false, error: 'Author email is empty' };
  }
  
  // Create a clean version of the email to remove any whitespace
  const cleanedEmail = authorEmail.trim();
  
  const publicationDate = new Date().toLocaleDateString();
  
  const params: EmailParams = {
    to_email: cleanedEmail,
    to_name: authorName?.trim() || 'Author', // Provide default if name is empty
    subject: 'Your Journal Has Been Published!',
    message: `Congratulations! Your journal "${journalTitle}" has been reviewed and published by NERDC. It is now available for the public to access and download.`,
    journal_title: journalTitle,
    journal_id: journalId,
    publication_date: publicationDate
  };
  
  console.log('Email parameters prepared:', { 
    to_email: params.to_email,
    to_name: params.to_name,
    subject: params.subject
  });
  
  return sendEmail(params);
}; 