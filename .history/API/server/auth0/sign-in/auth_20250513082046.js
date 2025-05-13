export async function registerUser(email, password, nombre) {
  try {
    // First validate the request method is allowed
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        nombre
      })
    });

    // Check if method not allowed
    if (response.status === 405) {
      throw new Error('Método de registro no disponible temporalmente. Por favor intenta más tarde.');
    }

    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
    }

    // Parse successful response
    const data = await response.json();
    return data;

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