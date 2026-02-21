import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 
"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { doc, setDoc, getDoc } from
"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function initAuth(Game){

  loginBtn.onclick = async ()=>{
    try{
      await signInWithEmailAndPassword(auth, email.value, password.value);
    }catch(e){
