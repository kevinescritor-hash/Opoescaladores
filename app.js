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

// 1. Función para abrir/cerrar panel
window.togglePanel = () => {
    const panel = document.getElementById('app-content');
    panel.classList.toggle('open');
};

// 2. Modificación de addSession para permitir negativos
window.addSession = async () => {
    const user = auth.currentUser;
    const hInput = document.getElementById('hInput');
    const dInput = document.getElementById('dInput');
    const cInput = document.getElementById('colorPicker');

    const h = parseFloat(hInput.value);
    
    // Ahora solo pedimos que h no sea 0 (para permitir negativos)
    if (user && h !== 0) {
        await db.collection('escaladores').doc(user.uid).set({
            nombre: user.displayName,
            color: cInput.value,
            // FieldValue.increment funciona perfectamente con números negativos para restar
            horasTotales: firebase.firestore.FieldValue.increment(h),
            ultimoLog: dInput.value || (h > 0 ? "Subiendo..." : "Bajando un poco")
        }, { merge: true });
        
        hInput.value = '';
        dInput.value = '';
        togglePanel(); // Cerramos el panel automáticamente al terminar
    }
};

// 3. Renderizado con auto-scroll mejorado
function renderClimber(id, data, myUid) {
    const div = document.createElement('div');
    div.className = 'climber';
    
    // Aseguramos que las horas no bajen de 0 visualmente
    const posicionReal = Math.max(0, data.horasTotales);
    div.style.bottom = (posicionReal * SCALE) + 'px';
    
    const offset = (id.charCodeAt(0) % 40) - 20;
    div.style.left = `calc(50% + ${offset}%)`;

    div.innerHTML = `
        <div class="climber-icon" style="color: ${data.color || '#ffffff'}">🧗‍♂️</div>
        <div class="label" style="border-top: 3px solid ${data.color}">${data.nombre} (${data.horasTotales.toFixed(1)}h)</div>
    `;

    div.onclick = () => alert(`${data.nombre}:\n"${data.ultimoLog}"`);
    world.appendChild(div);

    // AUTO-SCROLL: Solo cuando es nuestro escalador
    if(id === myUid) {
        // Usamos un pequeño delay para que el DOM se asiente
        setTimeout(() => {
            div.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
    }
}

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