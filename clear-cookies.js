// Clear NextAuth cookies script
console.log('To fix the JWT session error, please:');
console.log('1. Open your browser');
console.log('2. Go to Developer Tools (F12)');
console.log('3. Go to Application/Storage > Cookies');
console.log('4. Delete all cookies for localhost:3000');
console.log('5. Or run this in browser console:');
console.log('');
console.log('document.cookie.split(";").forEach(function(c) { ');
console.log('  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); ');
console.log('});');
console.log('');
console.log('Then try signing in again!');
