import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

import { setCookie, getCookie, deleteCookie } from './utils/cookies.js';

let app;
let auth;
let googleProvider;
let appleProvider;

export async function initializeFirebase(config) {
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    appleProvider = new OAuthProvider('apple.com');
    
    // Verificar si hay una sesión activa al inicializar
    const userUID = getCookie('userUID');
    if (userUID) {
      try {
        // Cambiado a puerto 3003
        const response = await fetch(`http://localhost:3003/verify-user/${userUID}`, {
          credentials: 'include' // Añadido para CORS
        });
        const data = await response.json();
        
        if (!data.exists) {
          deleteCookie('userUID');
          deleteCookie('userEmail');
          deleteCookie('userName');
          window.location.href = '/API/server/auth0/sign-in/index.html';
          return;
        }
        
        window.location.href = '/WWW/Dashboard/Index.html';
        return;
      } catch (error) {
        console.error('Error verificando usuario:', error);
        deleteCookie('userUID');
        deleteCookie('userEmail');
        deleteCookie('userName');
        window.location.href = '/API/server/auth0/sign-in/index.html';
        return;
      }
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        showToast('¡Bienvenido!', 'success');
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error inicializando Firebase:', error);
    showToast('Error inicializando la aplicación', 'error');
    return { success: false, error };
  }
}

function showToast(message, type = 'info') {
  const icons = {
    success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 6L9 17L4 12"></path>
    </svg>`,
    error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="8"></line>
    </svg>`,
    warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12" y2="17"></line>
    </svg>`
  };

  window.Toastify({
    text: `<span style="display: flex; align-items: center; gap: 8px;">
      <span style="color: white;">${icons[type]}</span>
      <span>${message}</span>
    </span>`,
    duration: 3000,
    gravity: "top",
    position: "right",
    escapeMarkup: false,
    style: {
      background: type === 'success' ? '#48bb78' : 
                 type === 'error' ? '#f56565' : 
                 type === 'warning' ? '#ed8936' : '#4299e1',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px'
    }
  }).showToast();
}

function saveUserSession(user) {
  try {
    if (!user) {
      console.error('No user provided to saveUserSession');
      return;
    }

    // Set each cookie individually
    setCookie('userUID', user.uid);
    setCookie('userEmail', user.email);
    setCookie('userName', user.displayName || '');

    // Verify cookies were set
    console.log('Cookies after setting:');
    console.log('UID:', getCookie('userUID'));
    console.log('Email:', getCookie('userEmail'));
    console.log('Name:', getCookie('userName'));

    // Only redirect if cookies are set
    if (getCookie('userUID')) {
      window.location.href = './Data/index.html';
    } else {
      showToast('Error guardando la sesión', 'error');
    }
  } catch (error) {
    console.error('Error in saveUserSession:', error);
    showToast('Error guardando la sesión', 'error');
  }
}

export async function registerUser(email, password, nombre, event) {
  if (event) event.preventDefault();
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nombre });
    await user.reload();
    const updatedUser = auth.currentUser;

    // Cambiado a puerto 3003
    const response = await fetch('http://localhost:3003/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Añadido para CORS
      body: JSON.stringify({
        email,
        password,
        nombre,
        uid: updatedUser.uid
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en el registro del backend');
    }

    showToast('¡Registro exitoso!', 'success');
    saveUserSession(updatedUser);
    
    return { success: true, user: updatedUser };

  } catch (error) {
    console.error('Registration error:', error);
    showToast(getErrorMessage(error), 'error');
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Cambiado a puerto 3003
    const response = await fetch('http://localhost:3003/social-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Añadido para CORS
      body: JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        nombre: result.user.displayName,
        photoURL: result.user.photoURL
      })
    });

    if (!response.ok) throw new Error('Error en la autenticación');

    showToast('¡Bienvenido!', 'success');
    saveUserSession(result.user);
    return { success: true, user: result.user };

  } catch (error) {
    console.error('Google sign in error:', error);
    showToast('Error al iniciar sesión con Google', 'error');
    throw error;
  }
}

export async function signInWithApple() {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    
    const response = await fetch('http://localhost:3003/social-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        nombre: result.user.displayName,
        photoURL: result.user.photoURL
      })
    });

    if (!response.ok) throw new Error('Error en la autenticación');

    showToast('¡Bienvenido!', 'success');
    saveUserSession(result.user); // Save user session
    return { success: true, user: result.user };

  } catch (error) {
    console.error('Apple sign in error:', error);
    showToast('Error al iniciar sesión con Apple', 'error');
    throw error;
  }
}

function getErrorMessage(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado';
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido';
    case 'auth/operation-not-allowed':
      return 'Operación no permitida';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    default:
      return error.message || 'Error en el registro. Por favor intenta nuevamente';
  }
}