const firebaseConfig = {
  authDomain: "safelyne-a3cc1.firebaseapp.com",
  apiKey: "AIzaSyDBcBGXBF51CvvNcdeJNswEfnjyVjO5QY4",
  projectId: "safelyne-a3cc1",
  storageBucket: "safelyne-a3cc1.appspot.com",
  databaseURL: "https://safelyne-a3cc1.firebaseio.com",
  messagingSenderId: "123456789012",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const formTitle = document.getElementById("formTitle");
const authBtn = document.getElementById("authBtn");
const authForm = document.getElementById("authForm");
let isSignup = false;

function toggleForm(signup) {
  isSignup = signup;
  formTitle.textContent = signup ? "Sign Up" : "Login";
  authBtn.textContent = signup ? "SIGN UP" : "LOGIN";
}

// Email/Password Authentication
authForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (isSignup) {
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("Account created successfully!");
        // Redirect to home page after successful signup
        window.location.href = "home.html";
      })
      .catch(error => alert(error.message));
  } else {
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("Login successful.");
        window.location.href = "home.html";
      })
      .catch(error => alert(error.message));
  }
});

// Password Reset Function
function resetPassword() {
  const email = prompt("Please enter your email for password reset:");
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => alert("Password reset email sent."))
      .catch(error => alert(error.message));
  }
}

// Google Login Function - Using Popup for better UX
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  // Optional: Add additional OAuth 2.0 scopes
  provider.addScope('profile');
  provider.addScope('email');
  
  auth.signInWithPopup(provider)
    .then((result) => {
      // Successfully signed in
      const user = result.user;
      console.log("Google login successful:", user.displayName);
      alert(`Welcome ${user.displayName}! Login successful.`);
      
      // Redirect to home page
      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Google login error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        alert("Login cancelled by user.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Popup blocked. Please allow popups and try again.");
      } else {
        alert("Google login failed: " + error.message);
      }
    });
}

// Facebook Login Function - Using Popup for better UX
function facebookLogin() {
  const provider = new firebase.auth.FacebookAuthProvider();
  
  // Optional: Add additional Facebook permissions
  provider.addScope('email');
  provider.addScope('public_profile');
  
  auth.signInWithPopup(provider)
    .then((result) => {
      // Successfully signed in
      const user = result.user;
      console.log("Facebook login successful:", user.displayName);
      alert(`Welcome ${user.displayName}! Login successful.`);
      
      // Redirect to home page
      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Facebook login error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        alert("Login cancelled by user.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Popup blocked. Please allow popups and try again.");
      } else {
        alert("Facebook login failed: " + error.message);
      }
    });
}

// Alternative: Google Login with Redirect (use if popup doesn't work)
function googleLoginRedirect() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  
  auth.signInWithRedirect(provider);
}

// Alternative: Facebook Login with Redirect (use if popup doesn't work)
function facebookLoginRedirect() {
  const provider = new firebase.auth.FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  
  auth.signInWithRedirect(provider);
}

// Handle redirect result after sign-in (for redirect-based auth)
firebase.auth().getRedirectResult()
  .then((result) => {
    if (result.user) {
      console.log("Redirect login successful:", result.user.displayName);
      alert(`Welcome ${result.user.displayName}! Login successful.`);
      window.location.href = "home.html";
    }
  })
  .catch(error => {
    console.error("Redirect login error:", error);
    alert("Login error: " + error.message);
  });

// Auth State Observer - Automatically redirect if user is already logged in
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("User is already logged in:", user.displayName || user.email);
    // Uncomment the line below if you want automatic redirect for logged-in users
    // window.location.href = "home.html";
  } else {
    console.log("User is not logged in");
  }
});

// Logout function (optional - for testing purposes)
function logout() {
  auth.signOut().then(() => {
    alert("Logged out successfully");
    // Optionally redirect to login page
    window.location.reload();
  }).catch((error) => {
    alert("Logout error: " + error.message);
  });
}