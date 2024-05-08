let token = localStorage.getItem("token");

if (token == null) {
  window.location.href = "login.html";
}

function Salir() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}