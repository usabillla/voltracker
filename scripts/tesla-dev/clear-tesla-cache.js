// Helper script to clear Tesla OAuth cache
// Run this in browser console to clear all Tesla-related storage

function clearTeslaCache() {
  // Clear localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('tesla') || key.includes('voltracker')) {
      localStorage.removeItem(key);
      console.log('Cleared localStorage:', key);
    }
  });
  
  // Clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('tesla') || key.includes('voltracker')) {
      sessionStorage.removeItem(key);
      console.log('Cleared sessionStorage:', key);
    }
  });
  
  console.log('Tesla cache cleared! Refresh the page.');
}

// Run it
clearTeslaCache();