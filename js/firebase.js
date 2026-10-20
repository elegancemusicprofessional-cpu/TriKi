/* ============ TRIKI - CEREBRO (Firebase) v1 ============ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, increment,
  collection, getDocs, query, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQee92RoY89ih1S5OIxpxMRbPzFz_mCj8",
  authDomain: "trikicoin.firebaseapp.com",
  projectId: "trikicoin",
  storageBucket: "trikicoin.firebasestorage.app",
  messagingSenderId: "265870671632",
  appId: "1:265870671632:web:78bef3ece4603acab42f95",
  measurementId: "G-6SJR428EG2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// API global que usaran las demas pestanas
window.TrikiDB = { listo:false, uid:null };

const uref = () => doc(db, "users", auth.currentUser.uid);

onAuthStateChanged(auth, async (user) => {
  try{
    if(!user){ await signInAnonymously(auth); return; }
    window.TrikiDB.uid = user.uid;

    const snap = await getDoc(uref());
    if(!snap.exists()){
      await setDoc(uref(), {
        nombre: "Jugador-"+user.uid.slice(0,4),
        saldo: 0,
        tiempoSeg: 0,
        billetera: "",
        invitadoPor: "",
        invitaciones: 0,
        tareas: {},
        creado: Date.now()
      });
    }

    // ---- funciones del cerebro (las usaremos en el PASO 3) ----
    window.TrikiDB.leer          = async () => (await getDoc(uref())).data();
    window.TrikiDB.escribir = (obj) => updateDoc(uref(), obj);
    window.TrikiDB.sumarSaldo    = (n)   => updateDoc(uref(), { saldo: increment(n) });
    window.TrikiDB.sumarTiempo   = (seg) => updateDoc(uref(), { tiempoSeg: increment(seg) });
    window.TrikiDB.ponerBilletera= (a)   => updateDoc(uref(), { billetera: a });
    window.TrikiDB.ponerNombre   = (n)   => updateDoc(uref(), { nombre: n });
    window.TrikiDB.marcarTarea   = (id,estado) => updateDoc(uref(), { [`tareas.${id}`]: estado });
    window.TrikiDB.sumarInvitacion=(cod) => updateDoc(uref(), { invitaciones: increment(1), invitadoPor: cod });
    window.TrikiDB.top = async (n) => {
      const q = query(collection(db,"users"), orderBy("saldo","desc"), limit(n));
      const s = await getDocs(q);
      return s.docs.map(d => ({ id:d.id, ...d.data() }));
    };
    window.TrikiDB.verSaldo = (cb) => onSnapshot(uref(), (s)=> cb(s.data()));

    window.TrikiDB.listo = true;
    window.dispatchEvent(new Event("triki-db-listo"));
    console.log("TRIKI cerebro conectado. uid:", user.uid);
  }catch(e){
    console.error("TRIKI cerebro error:", e);
  }
});
