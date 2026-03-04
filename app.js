// ELIMINAMOS la línea de "import" porque ya cargamos Firebase en el HTML
// con las etiquetas <script src="...">

const firebaseConfig = {
  apiKey: "AIzaSyAPFcmkmAibJoRdHKS5ZrRy_fLuLysY1ZA",
  authDomain: "escaladoresopo.firebaseapp.com",
  projectId: "escaladoresopo",
  storageBucket: "escaladoresopo.firebasestorage.app", // Corregido: .app en lugar de .com
  messagingSenderId: "1046020869775",
  appId: "1:1046020869775:web:76467fc5317a775d3d6afa"
};

// Inicialización necesaria para la versión "compat" que usamos en el HTML
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

const SCALE = 20; // 1 hora = 20 píxeles

// Dibujar metas
const world = document.getElementById('world');
for(let i=30; i<=300; i+=30) {
    const meta = document.createElement('div');
    meta.className = 'milestone';
    meta.style.bottom = (i * SCALE) + 'px';
    meta.innerHTML = `🚩 ${i}h - META`;
    world.appendChild(meta);
}

// Login (Global para que el botón del HTML lo vea)
window.loginConGoogle = function() { 
    auth.signInWithPopup(provider).catch(err => console.error("Error login:", err)); 
};

// Persistencia y Escucha en Tiempo Real
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'flex';
        
        // Escuchar a todos los escaladores
        db.collection('escaladores').onSnapshot(snapshot => {
            // Limpiamos solo los escaladores, no las metas
            document.querySelectorAll('.climber').forEach(el => el.remove());
            snapshot.forEach(doc => renderClimber(doc.id, doc.data(), user.uid));
        });
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-content').style.display = 'none';
    }
});

function renderClimber(id, data, myUid) {
    const div = document.createElement('div');
    div.className = 'climber';
    if(id === myUid) div.id = 'my-climber';
    
    div.style.bottom = (data.horasTotales * SCALE) + 'px';
    // Posición horizontal basada en el ID para evitar solapamientos
    const offset = (id.charCodeAt(0) % 40) - 20;
    div.style.left = `calc(50% + ${offset}%)`;

    div.innerHTML = `
        <img src="${data.foto}" style="border: 4px solid ${data.color || '#27ae60'}">
        <div class="label">${data.nombre} (${data.horasTotales.toFixed(1)}h)</div>
    `;

    div.onclick = () => alert(`Log de ${data.nombre}:\n${data.ultimoLog || "Sin registros"}`);
    world.appendChild(div);

    // Zoom suave al propio escalador al cargar
    if(id === myUid) {
        setTimeout(() => {
            div.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }
}

// Función global para el botón
window.addSession = async function() {
    const user = auth.currentUser;
    const hInput = document.getElementById('hInput');
    const dInput = document.getElementById('dInput');
    const cInput = document.getElementById('colorPicker');

    const h = parseFloat(hInput.value);
    const d = dInput.value;
    const c = cInput.value;

    if (user && h > 0) {
        try {
            await db.collection('escaladores').doc(user.uid).set({
                nombre: user.displayName,
                foto: user.photoURL,
                color: c,
                horasTotales: firebase.firestore.FieldValue.increment(h),
                ultimoLog: `[${h}h] ${d}`
            }, { merge: true });
            
            hInput.value = '';
            dInput.value = '';
        } catch (error) {
            console.error("Error guardando datos:", error);
            alert("Error al guardar. Revisa las reglas de Firestore.");
        }
    }
};