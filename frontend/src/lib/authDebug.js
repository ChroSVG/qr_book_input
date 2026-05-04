/**
 * Auth Debug Helper - Available in browser console
 * Usage: window.authDebug() or just call authDebug()
 */

export function setupAuthDebug() {
  window.authDebug = function() {
    console.group('🔐 Auth Debug Info');
    
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    
    console.log('📍 Token exists:', !!token);
    console.log('📍 Token length:', token ? token.length : 0);
    console.log('📍 Token preview:', token ? token.substring(0, 30) + '...' : 'N/A');
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        console.log('👤 User data:', parsed);
      } catch (e) {
        console.error('❌ Invalid user data:', userData);
      }
    } else {
      console.log('👤 User data: Not set');
    }
    
    console.log('📊 LocalStorage keys:', Object.keys(localStorage));
    
    console.groupEnd();
    
    return {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      hasUserData: !!userData,
      userData: userData ? JSON.parse(userData) : null,
    };
  };
  
  console.log('✅ Auth debug helper loaded. Run authDebug() in console to check auth state.');
}
