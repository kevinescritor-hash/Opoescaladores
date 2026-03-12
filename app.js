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
let currentIconHito = '📚';
let viewUserId = ''; 

// 1. Gestión de Sesiones e Icono Dinámico
window.addSession = async () => {
    const user = auth.currentUser;
    const h = parseFloat(document.getElementById('hInput').value);
    const d = document.getElementById('dInput').value;
    const c = document.getElementById('colorPicker').value;

    if (user && !isNaN(h) && h !== 0) {
        const timestamp = Date.now();
        const nuevaSesion = { h, d: d || "Estudiando", t: timestamp };

        const doc = await db.collection('escaladores').doc(user.uid).get();
        let historial = doc.exists ? (doc.data().historial || []) : [];
        historial.push(nuevaSesion);

        await db.collection('escaladores').doc(user.uid).set({
            nombre: user.displayName,
            color: c,
            horasTotales: firebase.firestore.FieldValue.increment(h),
            historial: historial 
        }, { merge: true });
        
        document.getElementById('hInput').value = '';
        document.getElementById('dInput').value = '';
        togglePanel(); 
    }
};

function getDynamicIcon(historial) {
    if (!historial || historial.length === 0) return '⛺';
    const unDiaAtras = Date.now() - (24 * 60 * 60 * 1000);
    const horas24h = historial
        .filter(s => s.t > unDiaAtras)
        .reduce((acc, curr) => acc + curr.h, 0);

    if (horas24h <= 0) return '⛺';
    if (horas24h <= 3) return '🧗‍♂️';
    if (horas24h <= 6) return '🐐';
    return '🚀';
}

// 2. Renderizado (LA FUNCIÓN QUE FALTABA)
function renderClimber(id, data, myUid) {
    const div = document.createElement('div');
    div.className = 'climber';
    if(id === myUid) div.id = 'my-climber';
    
    const posVisual = Math.max(0, data.horasTotales);
    div.style.bottom = (posVisual * SCALE) + 'px';
    const offset = (id.charCodeAt(0) % 40) - 20;
    div.style.left = `calc(50% + ${offset}%)`;

    const icon = getDynamicIcon(data.historial);

    div.innerHTML = `
        <div class="climber-icon" style="color: ${data.color || '#ffffff'}">${icon}</div>
        <div class="label" style="border-top: 3px solid ${data.color}">${data.nombre} (${data.horasTotales.toFixed(1)}h)</div>
    `;

    div.onclick = () => abrirMochila(id, data);
    document.getElementById('world').appendChild(div);

    if(id === myUid) {
        setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'center' }), 600);
    }
}

// 3. Mochila e Hitos
window.abrirMochila = (id, data) => {
    viewUserId = id;
    const myUid = auth.currentUser.uid;
    document.getElementById('mochila-titulo').innerText = `🎒 Mochila de ${data.nombre}`;
    document.getElementById('modal-mochila').style.display = 'flex';
    document.getElementById('form-hito').style.display = (id === myUid) ? 'block' : 'none';
    actualizarListaHitos(data.hitos || [], id === myUid);
};

window.cerrarMochila = () => { document.getElementById('modal-mochila').style.display = 'none'; };

function actualizarListaHitos(hitos, esDuenio) {
    const lista = document.getElementById('lista-hitos');
    lista.innerHTML = hitos.length === 0 ? '<p style="font-size:0.8rem; opacity:0.5;">La mochila está vacía...</p>' : '';
    hitos.forEach((hito, index) => {
        const item = document.createElement('div');
        item.className = 'hito-item';
        item.innerHTML = `
            <span class="hito-icon">${hito.icon}</span>
            <span>${hito.desc}</span>
            ${esDuenio ? `<button class="btn-delete" onclick="borrarHito(${index})">🗑️</button>` : ''}
        `;
        lista.appendChild(item);
    });
}

window.selectIcon = (el, icon) => {
    document.querySelectorAll('.icon-opt').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    currentIconHito = icon;
};

window.guardarHito = async () => {
    const desc = document.getElementById('hitoDesc').value;
    if (!desc) return;
    const userRef = db.collection('escaladores').doc(viewUserId);
    const doc = await userRef.get();
    let hitos = doc.data().hitos || [];
    hitos.push({ icon: currentIconHito, desc: desc });
    await userRef.update({ hitos: hitos });
    document.getElementById('hitoDesc').value = '';
    cerrarMochila();
};

window.borrarHito = async (index) => {
    if(!confirm("¿Borrar este hito?")) return;
    const userRef = db.collection('escaladores').doc(viewUserId);
    const doc = await userRef.get();
    let hitos = doc.data().hitos || [];
    hitos.splice(index, 1);
    await userRef.update({ hitos: hitos });
    cerrarMochila();
};

// 4. UI y Auth
window.togglePanel = () => { document.getElementById('app-content').classList.toggle('open'); };

const world = document.getElementById('world');
for(let i=30; i<=300; i+=30) {
    const meta = document.createElement('div');
    meta.className = 'milestone';
    meta.style.bottom = (i * SCALE) + 'px';
    meta.innerHTML = `🚩 Meta ${i}h`;
    world.appendChild(meta);
}

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