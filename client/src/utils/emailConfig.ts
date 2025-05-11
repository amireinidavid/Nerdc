// EmailJS Configuration
// Replace these values with your actual EmailJS credentials
export const emailConfig = {
  serviceId: 'service_sh09e8g',
  templateId: 'template_t1wvj28', 
  publicKey: '4i0xDvFKKlBHKcKpK',
  // Default sender information if needed by the template
  defaultFrom: 'davidamireini@gmail.com',
  defaultName: 'NERDC Journal System',
};

// Validate configuration on import
(function validateConfig() {
  console.log('Validating EmailJS configuration...');
  const missingFields = [];
  
  if (!emailConfig.serviceId) missingFields.push('serviceId');
  if (!emailConfig.templateId) missingFields.push('templateId');
  if (!emailConfig.publicKey) missingFields.push('publicKey');
  
  if (missingFields.length > 0) {
    console.error('EmailJS configuration error: Missing required fields:', missingFields.join(', '));
  } else {
    console.log('EmailJS configuration validated successfully');
  }
})(); 