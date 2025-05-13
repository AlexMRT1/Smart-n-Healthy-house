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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en el registro');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error en el registro:', error);
    throw error;
  }
}

export async function signInWithGoogle() {
  // Implementar cuando se agregue la autenticación con Google
  throw new Error('Función no implementada');
}

export async function signInWithApple() {
  // Implementar cuando se agregue la autenticación con Apple
  throw new Error('Función no implementada');
}