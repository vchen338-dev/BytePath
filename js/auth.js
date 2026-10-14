import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const configured = !String(firebaseConfig.apiKey).startsWith("YOUR_");

const form = $("auth-form");        // only exists on login.html
const msg = $("auth-msg");
const headerLink = $("auth-link");  // header link on every page

function say(text, ok) {
  if (!msg) return;
  msg.textContent = text || "";
  msg.className = "auth-msg" + (ok ? " ok" : "");
}

const ERRORS = {
  "auth/invalid-credential": "The email or password is wrong.",
  "auth/user-not-found": "The email or password is wrong.",
  "auth/wrong-password": "The email or password is wrong.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/invalid-email": "That email address does not look right.",
  "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
  "auth/network-request-failed": "No connection. Check your internet and try again.",
  "auth/unauthorized-domain": "This website is not in your Firebase authorized domains yet."
};
const explain = (e) => ERRORS[e && e.code] || "Something went wrong. Please try again.";

if (!configured) {
  say("Login is not set up yet. Add your Firebase settings to js/firebase-config.js.");
  if (form) form.querySelectorAll("button").forEach((b) => (b.disabled = true));
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  let mode = "login"; // or "signup"

  // Keep a small profile document for each user: users/{uid}
  async function saveProfile(user, name) {
    await setDoc(doc(db, "users", user.uid), {
      name: name || user.displayName || "",
      email: user.email,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  function setMode(next) {
    mode = next;
    const signup = mode === "signup";
    $("name-row").hidden = !signup;
    $("auth-title").textContent = signup ? "Create your account" : "Log in";
    $("auth-lead").textContent = signup
      ? "Sign up to save your progress and pick up on any device."
      : "Log in to save your progress and pick up on any device.";
    $("auth-submit").textContent = signup ? "Create account" : "Log in";
    $("toggle-mode").textContent = signup ? "Have an account? Log in" : "Need an account? Sign up";
    $("password").autocomplete = signup ? "new-password" : "current-password";
    say("");
  }

  function render(user) {
    if (headerLink) headerLink.textContent = user ? "Account" : "Log in";
    if (!$("account-panel")) return;
    $("auth-panel").hidden = !!user;
    $("account-panel").hidden = !user;
    if (user) {
      $("auth-title").textContent = "Your account";
      $("auth-lead").textContent = "You are logged in.";
      $("acct-name").textContent = user.displayName || "friend";
      $("acct-email").textContent = user.email;
    } else {
      setMode("login");
    }
  }

  onAuthStateChanged(auth, render);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("email").value.trim();
      const password = $("password").value;
      if (!email || !password) return say("Enter your email and password.");
      const button = $("auth-submit");
      button.disabled = true;
      say("");
      try {
        if (mode === "signup") {
          const name = $("name").value.trim();
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          if (name) await updateProfile(cred.user, { displayName: name });
          await saveProfile(cred.user, name);
          render(auth.currentUser); // show the name we just saved
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
        form.reset();
      } catch (err) {
        say(explain(err));
      } finally {
        button.disabled = false;
      }
    });

    $("toggle-mode").addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

    $("google-btn").addEventListener("click", async () => {
      say("");
      try {
        const cred = await signInWithPopup(auth, new GoogleAuthProvider());
        await saveProfile(cred.user);
      } catch (err) {
        if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") say(explain(err));
      }
    });

    $("forgot").addEventListener("click", async () => {
      const email = $("email").value.trim();
      if (!email) return say("Type your email above first, then press Forgot password.");
      try {
        await sendPasswordResetEmail(auth, email);
        say("If that email has an account, a reset link is on its way.", true);
      } catch (err) {
        say(explain(err));
      }
    });
  }

  if ($("logout")) $("logout").addEventListener("click", () => signOut(auth));
}
