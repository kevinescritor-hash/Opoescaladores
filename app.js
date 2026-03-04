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

// 1. UI Control
window.togglePanel = () => {
    document.getElementById('app-content').classList.toggle('open');
};

// 2. Metas de la montaña
const world = document.getElementById('world');
for(let i=30; i<=300; i+=30) {
    const meta = document.createElement('div');
    meta.className = 'milestone';
    meta.style.bottom = (i * SCALE) + 'px';
    meta.innerHTML = `🚩 Meta ${i}h`;
    world.appendChild(meta);
}

// 3. Login/Auth
window.loginConGoogle = () => auth.signInWithPopup(provider);

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('toggle-panel').style.display = 'block';
        db.collection('escaladores').onSnapshot(snap => {
            document.querySelectorAll('.climber').forEach(el => el.remove());
            snap.forEach(doc => renderClimber(doc.id, doc.data(), user.uid));
        });
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('toggle-panel').style.display = 'none';
        document.getElementById('app-content').classList.remove('open');
    }
});

// 4. Renderizado y Auto-Scroll
function renderClimber(id, data, myUid) {
    const div = document.createElement('div');
    div.className = 'climber';
    if(id === myUid) div.id = 'my-climber';
    
    const posVisual = Math.max(0, data.horasTotales);
    div.style.bottom = (posVisual * SCALE) + 'px';
    const offset = (id.charCodeAt(0) % 40) - 20;
    div.style.left = `calc(50% + ${offset}%)`;

    div.innerHTML = `
        <div class="climber-icon" style="color: ${data.color || '#ffffff'}">🧗‍♂️</div>
        <div class="label" style="border-top: 3px solid ${data.color}">${data.nombre} (${data.horasTotales.toFixed(1)}h)</div>
    `;

    div.onclick = () => alert(`${data.nombre} dice:\n"${data.ultimoLog || '¡Subiendo!'}"`);
    world.appendChild(div);

    if(id === myUid) {
        setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'center' }), 600);
    }
}

// 5. Gestión de Sesiones (Subir/Bajar)
window.addSession = async () => {
    const user = auth.currentUser;
    const h = parseFloat(document.getElementById('hInput').value);
    const d = document.getElementById('dInput').value;
    const c = document.getElementById('colorPicker').value;

    if (user && !isNaN(h) && h !== 0) {
        await db.collection('escaladores').doc(user.uid).set({
            nombre: user.displayName,
            color: c,
            horasTotales: firebase.firestore.FieldValue.increment(h),
            ultimoLog: d || (h > 0 ? "Sumando horas" : "Corrigiendo tiempo")
        }, { merge: true });
        
        document.getElementById('hInput').value = '';
        document.getElementById('dInput').value = '';
        togglePanel(); 
    }
};

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(e => console.error(e));
}