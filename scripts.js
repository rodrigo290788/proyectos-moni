import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDp8IPHSH36VyoabvFQpCphgK2k3EUvt3Q",
  authDomain: "manager-proyect.firebaseapp.com",
  projectId: "manager-proyect", 
  storageBucket: "manager-proyect.appspot.com",
  messagingSenderId: "800791501859",
  appId: "1:800791501859:web:d72c7bb1e2e669e4aea596",
  measurementId: "G-0NG2NW2YZN",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const adminSection = document.querySelector(".admin-section");
  if (user) {
    adminSection.style.display = "block";
    document.getElementById("login-btn").textContent = "Cerrar Sesión";
  } else {
    adminSection.style.display = "none";
    document.getElementById("login-btn").textContent = "Iniciar Sesión";
  }
});

document.getElementById("login-btn").addEventListener("click", async () => {
  if (auth.currentUser) {
    await signOut(auth);
  } else {
    const email = prompt("Ingrese su correo electrónico:");
    const password = prompt("Ingrese su contraseña:");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Inicio de sesión exitoso");
    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    }
  }
});

async function loadFiles(searchTerm = "") {
  const resultsContainer = document.getElementById("search-results");
  resultsContainer.innerHTML = "";

  const renderedFiles = new Set();

  try {
    const querySnapshot = await getDocs(collection(db, "files"));
    querySnapshot.forEach((doc) => {
      if (renderedFiles.has(doc.id)) return;
      const data = doc.data();
      if (!searchTerm || Object.values(data).some((value) => value.toString().toLowerCase().includes(searchTerm.toLowerCase()))) {
        let formattedEntryDate = new Date(data.entryDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
        if (formattedEntryDate == "Invalid Date") {
          formattedEntryDate = "";
        }

        let formattedApprovalDate = new Date(data.approvalDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
        if (formattedApprovalDate == "Invalid Date") {
          formattedApprovalDate = "";
        }
        
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
         <div>
            ${data.projectName ? `<strong>${data.projectName.toUpperCase()}</strong>` : ""}
            ${data.projectType ? `(${data.projectType.toUpperCase()})` : ""}
            ${data.projectStatus ? `- <strong>Estado:</strong> ${data.projectStatus}` : ""}
            ${data.commission ? `- <strong>Comisión:</strong> ${data.commission}` : ""}
            ${data.ordinance ? `- <strong>Ordenanza:</strong> ${data.ordinance}` : ""}
            ${data.expedient ? `- <strong>Expediente:</strong> ${data.expedient}` : ""}
            ${formattedEntryDate ? `- <strong>Fecha de Ingreso:</strong> ${formattedEntryDate}` : ""}
            ${formattedApprovalDate ? `- <strong>Fecha de Aprobación:</strong> ${formattedApprovalDate}` : ""}
            ${data.fileLink ? `- <a href="${data.fileLink}" target="_blank">Ver archivo</a>` : ""}
          </div>
          ${auth.currentUser ? `
          <div>
            <button class="btn btn-warning btn-sm me-2 my-1" onclick="editFile('${doc.id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm my-1" onclick="deleteFile('${doc.id}')"><i class="bi bi-trash"></i></button>
          </div>` : ""}
        `;
        resultsContainer.insertBefore(li, resultsContainer.firstChild);
        renderedFiles.add(doc.id);
      }
    });
  } catch (error) {
    console.error("Error al cargar archivos:", error);
  }
}

document.getElementById("search-query").addEventListener("input", (event) => {
  loadFiles(event.target.value);
});

window.uploadFile = async function () {
  const saveButton = document.getElementById("save-btn");
  saveButton.disabled = true;

  const id = document.getElementById("file-id").value;
  const data = {
    projectName: document.getElementById("project-name").value,
    projectType: document.getElementById("project-type").value,
    projectStatus: document.getElementById("project-status").value,
    commission: document.getElementById("commission").value,
    ordinance: document.getElementById("ordinance").value,
    expedient: document.getElementById("expedient").value,
    entryDate: document.getElementById("project-entry-date").value || "",
    approvalDate: document.getElementById("approval-date").value || "",
    fileLink: document.getElementById("file-link").value,
  };
  try {
    if (id) {
      await updateDoc(doc(db, "files", id), data);
      alert("Archivo actualizado con éxito.");
    } else {
      await addDoc(collection(db, "files"), data);
      alert("Archivo cargado con éxito.");
    }
    document.getElementById("upload-form").reset();
    document.getElementById("file-id").value = "";
    loadFiles();
  } catch (error) {
    alert("Error al guardar el archivo: " + error.message);
  } finally {
    saveButton.disabled = false;
  }
};

window.editFile = async function (id) {
  try {
    const fileDoc = await getDoc(doc(db, "files", id));
    const data = fileDoc.data();
    document.getElementById("file-id").value = id;
    document.getElementById("project-name").value = data.projectName;
    document.getElementById("project-type").value = data.projectType;
    document.getElementById("ordinance").value = data.ordinance;
    document.getElementById("expedient").value = data.expedient;
    document.getElementById("project-entry-date").value = data.entryDate;
    document.getElementById("approval-date").value = data.approvalDate;
    document.getElementById("file-link").value = data.fileLink;
  } catch (error) {
    alert("Error al cargar los datos para edición: " + error.message);
  }
};

window.deleteFile = async function (id) {
  try {
    await deleteDoc(doc(db, "files", id));
    alert("Archivo eliminado con éxito.");
    loadFiles();
  } catch (error) {
    alert("Error al eliminar el archivo: " + error.message);
  }
};

window.toggleCommissionSelect = function () {
  var statusSelect = document.getElementById("project-status");
  var commissionSelect = document.getElementById("commission");
  if (statusSelect.value === "En Comisión") {
    commissionSelect.disabled = false;
  } else {
    commissionSelect.disabled = true;
    commissionSelect.value = "";
  }
};

window.onload = () => {
  loadFiles();
};
