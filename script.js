import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyCX8teiRDyCKS2CWgfcobojYJBzilYHVis",
  authDomain: "civic-alert-web.firebaseapp.com",
  projectId: "civic-alert-web",
  storageBucket: "civic-alert-web.firebasestorage.app",
  messagingSenderId: "1091845466484",
  appId: "1:1091845466484:web:85727127cba556aa84e421"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const categories = [
  { name: "All", icon: "layout-grid" },
  { name: "Garbage", icon: "trash-2" },
  { name: "Water", icon: "droplet" },
  { name: "Drainage", icon: "waves" },
  { name: "Electricity", icon: "zap" },
  { name: "Emergency", icon: "alert-triangle" }
];
const ADMIN_EMAIL = "aaniket.7675@gmail.com";
let currentUser = null;
let activeTab = "All";

window.login = async function () {
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  const adminBar = document.getElementById("adminBar");
  const trigger = document.querySelector(".admin-trigger");

  if (user && user.email === ADMIN_EMAIL) {
    adminBar.style.display = "flex";
    trigger.style.display = "none";
  } else {
    adminBar.style.display = "none";
    trigger.style.display = "flex";
  }

  loadIssues();
});

async function loadIssues() {
  const container = document.getElementById("issues");
  container.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "issues"));

  querySnapshot.forEach((docSnap) => {
    const issue = docSnap.data();

    if (activeTab !== "All" && issue.category !== activeTab) return;

    const div = document.createElement("div");
    div.className = "issue";

    div.innerHTML = `
  <strong>${issue.title}</strong>
  <p>
    <i data-lucide="${
      categories.find(c => c.name === issue.category)?.icon || "circle"
    }"></i>
    ${issue.category}
  </p>
  <p>📍 ${issue.location}</p>
  <p>${issue.time}</p>

  ${issue.remark ? `<p class="remark">💬 ${issue.remark}</p>` : ""}

  ${(() => {
    let isAdmin = currentUser?.email === ADMIN_EMAIL; 

    return `
      <div class="status-row">
        <span class="status-badge ${
          issue.status === "Pending"
            ? "pending"
            : issue.status === "Accepted"
            ? "accepted"
            : "completed"
        }">
          ${issue.status}
        </span>

        ${
          isAdmin
            ? `
            <div class="admin-panel">
              <button onclick="cycleStatus('${docSnap.id}', '${issue.status}')">Update</button>
              <button onclick="deleteIssue('${docSnap.id}')">Delete</button>
              <button onclick="addRemark('${docSnap.id}')">Remark</button>
            </div>
            `
            : ""
        }
      </div>
    `;
  })()}
`;
  `;
  })()}
    `;

    container.appendChild(div);
  });

  if (window.lucide) lucide.createIcons();
  
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      document.getElementById("location").value =
        `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    });
  }
}

window.cycleStatus = async function (id, currentStatus) {
  let newStatus;

  if (currentStatus === "Pending") newStatus = "Accepted";
  else if (currentStatus === "Accepted") newStatus = "Completed";
  else newStatus = "Pending";

  await updateDoc(doc(db, "issues", id), {
    status: newStatus
  });

  loadIssues();
};
// TABS
function renderTabs() {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.innerHTML = `
      <i data-lucide="${cat.icon}"></i>
      <span>${cat.name}</span>
    `;

    if (cat.name === activeTab) btn.classList.add("active");

    btn.onclick = () => {
      activeTab = cat.name;
      renderTabs();
      loadIssues();
    };

    tabs.appendChild(btn);
  });

  if (window.lucide) lucide.createIcons();
}

window.openForm = function () {
  document.getElementById("modal").style.display = "flex";
  initCategorySelect();
  getLocation();
};

window.closeForm = function () {
  document.getElementById("modal").style.display = "none";
};

// SUBMIT ISSUE
window.submitIssue = async function () {
  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;
  const location = document.getElementById("location").value;

  if (!title || !category || !location) return;

  await addDoc(collection(db, "issues"), {
  title,
  category,
  location,
  status: "Pending",
  remark: "",   // ✅ NEW
  time: new Date().toLocaleString()
});

  document.getElementById("title").value = "";
  document.getElementById("category").value = "";
  document.getElementById("location").value = "";

  closeForm();
  loadIssues();
};

// DROPDOWN
function initCategorySelect() {
  const select = document.getElementById("category");
  select.innerHTML = `<option value="">Select Category</option>`;

  categories.slice(1).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.name;
    opt.innerText = `${cat.name}`;
    select.appendChild(opt);
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("Service Worker Registered"));
}

window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splash");
    splash.style.opacity = "0";
    splash.style.transition = "0.4s";

    setTimeout(() => {
      splash.style.display = "none";
    }, 400);
  }, 1400);
});


window.deleteIssue = async function (id) {
  await deleteDoc(doc(db, "issues", id));
  loadIssues();
};
window.addRemark = async function (id) {
  const text = prompt("Enter remark:");

  if (!text) return;

  await updateDoc(doc(db, "issues", id), {
    remark: text
  });

  loadIssues();
};
window.logout = async function () {
  await signOut(auth);
  currentUser = null;

  document.getElementById("adminBar").style.display = "none";

  loadIssues();
};
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.style.transform = "scale(0.95)";
    setTimeout(() => (btn.style.transform = "scale(1)"), 100);
  });
});
// INIT
initCategorySelect();
renderTabs();
loadIssues();
