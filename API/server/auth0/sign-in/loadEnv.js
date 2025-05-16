async function loadEnvVariables() {
  try {
    const response = await fetch('http://localhost:3000/config', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    return {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    };
  } catch (error) {
    console.error('Error loading environment variables:', error);
    throw error;
  }
}

export default loadEnvVariables;