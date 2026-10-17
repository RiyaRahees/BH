// Universal startup wrapper for LiteSpeed / Phusion Passenger
import('./server.js').then(() => {
  console.log('[LiteSpeed] ES Module server.js loaded successfully.');
}).catch(err => {
  console.error('[LiteSpeed Startup Error]', err);
});
