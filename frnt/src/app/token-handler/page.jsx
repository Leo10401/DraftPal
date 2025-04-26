export default function TokenHandler() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Completing authentication...</h1>
        <div className="animate-pulse">Please wait</div>
        
        {/* Client-side script to handle token */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (token) {
              // Save token to localStorage
              localStorage.setItem('authToken', token);
              
              // Redirect to home page
              window.location.href = '/';
            } else {
              // No token found, redirect to login
              window.location.href = '/login?error=auth_failed';
            }
          `
        }} />
      </div>
    </div>
  );
} 