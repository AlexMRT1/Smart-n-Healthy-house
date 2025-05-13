export async function registerUser(email, password, nombre) {
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        nombre
      })
    });

    // First check if the response is ok
    if (!response.ok) {
      // Try to parse error message if available
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      } catch (jsonError) {
        // If JSON parsing fails, throw generic error with status
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    // Try to parse successful response
    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      throw new Error('Invalid response format from server');
    }

  } catch (error) {
    console.error('Registration error:', error);
    throw error; 
  }
}

export async function signInWithGoogle() {
  throw new Error('Función no implementada');
}

export async function signInWithApple() {
  throw new Error('Función no implementada');
}