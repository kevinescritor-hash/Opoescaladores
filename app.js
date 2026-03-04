const firebaseConfig = {
  apiKey: "AIzaSyAPFcmkmAibJoRdHKS5ZrRy_fLuLysY1ZA",
  authDomain: "escaladoresopo.firebaseapp.com",
  projectId: "escaladoresopo",
  storageBucket: "escaladoresopo.firebasestorage.app",
  messagingSenderId: "1046020869775",
  appId: "1:1046020869775:web:76467fc5317a775d3d6afa"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

const SCALE = 20;

// 1. Decorar con Cabras y Metas
const world = document.getElementById('world');
function initWorld() {
    // Metas cada 30h
    for(let i=30; i<=300; i+=30) {
        const meta = document.createElement('div');
        meta.className = 'milestone';
        meta.style.bottom = (i * SCALE) + 'px';
        meta.innerHTML = `🚩 Meta ${i}h`;
        world.appendChild(meta);
    }
    // Cabras aleatorias
    for(let i=0; i<15; i++) {
        const goat = document.createElement('div');
        goat.className = 'goat';
        goat.innerText = '🐐';
        goat.style.bottom = (Math.random() * 5500 + 200) + 'px';
        goat.style.left = (Math.random() * 60 + 20) + '%';
        world.appendChild(goat);
    }
}
initWorld();

// 2. Login
window.loginConGoogle = () => auth.signInWithPopup(provider);

// 3. Persistencia
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'flex';
        db.collection('escaladores').onSnapshot(snap => {
            document.querySelectorAll('.climber').forEach(el => el.remove());
            snap.forEach(doc => renderClimber(doc.id, doc.data(), user.uid));
        });
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-content').style.display = 'none';
    }
});

// 4. Renderizado de Escaladores con Color
function renderClimber(id, data, myUid) {
    const div = document.createElement('div');
    div.className = 'climber';
    if(id === myUid) div.id = 'my-climber';
    
    div.style.bottom = (data.horasTotales * SCALE) + 'px';
    const offset = (id.charCodeAt(0) % 40) - 20;
    div.style.left = `calc(50% + ${offset}%)`;

    div.innerHTML = `
        <div class="climber-icon" style="color: ${data.color || '#ffffff'}">🧗‍♂️</div>
        <div class="label" style="border-top: 3px solid ${data.color}">${data.nombre} (${data.horasTotales.toFixed(1)}h)</div>
    `;

    div.onclick = () => alert(`${data.nombre} dice:\n"${data.ultimoLog || '¡Subiendo!'}"`);
    world.appendChild(div);

    if(id === myUid) {
        setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
    }
}

// 5. Añadir sesión
window.addSession = async () => {
    const user = auth.currentUser;
    const h = parseFloat(document.getElementById('hInput').value);
    const d = document.getElementById('dInput').value;
    const c = document.getElementById('colorPicker').value;

    if (user && h > 0) {
        await db.collection('escaladores').doc(user.uid).set({
            nombre: user.displayName,
            color: c,
            horasTotales: firebase.firestore.FieldValue.increment(h),
            ultimoLog: d || "Estudiando duro"
        }, { merge: true });
        document.getElementById('hInput').value = '';
        document.getElementById('dInput').value = '';
    }
};

// 6. Service Worker para Instalación
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(e => console.error(e));
}