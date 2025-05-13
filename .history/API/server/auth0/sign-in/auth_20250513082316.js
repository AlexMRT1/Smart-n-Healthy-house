import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyA8OuZidC17oS9ZsesopN0S78m_DrmVhTo",
  authDomain: "prueba-1e1a3.firebaseapp.com",
  projectId: "prueba-1e1a3",
  storageBucket: "prueba-1e1a3.appspot.com",
  messagingSenderId: "824486865843",
  appId: "1:824486865843:web:0b2b9b0b0b0b0b0b0b0b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function registerUser(email, password, nombre) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // You could store additional user data (like nombre) in Firestore here

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        nombre: nombre
      }
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    // Mensajes de error en español
    let errorMessage;
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Este correo electrónico ya está registrado';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El correo electrónico no es válido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El registro con correo electrónico no está habilitado';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es demasiado débil';
        break;
      default:
        errorMessage = 'Error en el registro. Por favor intenta nuevamente';
    }
    
    throw new Error(errorMessage);
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw new Error('Error al iniciar sesión con Google');
  }
}

export async function signInWithApple() {
  throw new Error('El inicio de sesión con Apple estará disponible próximamente');
}