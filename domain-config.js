// Domain configuration for www.eps.su
module.exports = {
  domains: [
    'www.eps.su',
    'eps.su',
    // Add your replit domain as fallback
    process.env.REPLIT_DOMAINS || 'localhost:5000'
  ],
  
  // SSL/HTTPS configuration
  ssl: {
    enabled: true,
    redirectHttp: true
  },
  
  // CORS settings for multiple domains
  cors: {
    origin: [
      'https://www.eps.su',
      'https://eps.su',
      'http://localhost:5000',
      process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : null
    ].filter(Boolean),
    credentials: true
  }
};