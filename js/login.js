    const firebaseConfig = {
      apiKey: "AIzaSyDBcBGXBF51CvvNcdeJNswEfnjyVjO5QY4",
      projectId: "safelyne-a3cc1",
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

    authForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (isSignup) {
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => alert("Account created successfully!"))
          .catch(error => alert(error.message));
      } else {
        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            alert("Login successful.");
            window.location.href = "home.html";
          })
          .catch(error => alert(error.message));
      }
    });

    function resetPassword() {
      const email = prompt("Please enter your email for password reset:");
      if (email) {
        auth.sendPasswordResetEmail(email)
          .then(() => alert("Password reset email sent."))
          .catch(error => alert(error.message));
      }
    }

    function googleLogin() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(() => window.location.href = "home.html")
        .catch(error => alert(error.message));
    }

    function facebookLogin() {
      const provider = new firebase.auth.FacebookAuthProvider();
      auth.signInWithPopup(provider)
        .then(() => window.location.href = "home.html")
        .catch(error => alert(error.message));
    }

    function twitterLogin() {
      const provider = new firebase.auth.TwitterAuthProvider();
      auth.signInWithPopup(provider)
        .then(() => window.location.href = "home.html")
        .catch(error => alert(error.message));
    }