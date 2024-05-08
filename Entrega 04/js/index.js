function initData() {
  let gallery = document.getElementById("gallery-container");
  let url = "http://localhost:3000/api/nfts";

  let xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.send();
  xhr.onload = function () {
    if (xhr.status != 200) {
      alert(xhr.status + ": " + xhr.statusText);
    } else {
      gallery.innerHTML = "";
      let nfts = JSON.parse(xhr.responseText);
      nfts.forEach((nft) => {
        let galleryItem = document.createElement("div");
        galleryItem.className = "gallery-item";
        galleryItem.innerHTML = `
            <img src="../img/${nft.imageUrl}" alt="Gallery image" />
            <div class="image-overlay">
              <div class="overlay-content">
                <h4>${nft.nombre}</h4>
                <h6>${nft.precio} ETH</h6>
                <button
                    class="btn btn-link custom-btn"
                    data-toggle="modal"
                    data-target="#imageModal"
                    data-src="../img/${nft.imageUrl}"
                    data-title="${nft.nombre}"
                    data-author="Leonardo Ruiz"
                    data-category="${nft.rareza}"
                    data-price="${nft.precio} ETH"
                    data-nftid="${nft._id}"
                    data-date="2024-03-12"> View 
                    
                </button>
              </div>
            </div>
          `;
        gallery.appendChild(galleryItem);
      });
      document.querySelectorAll(".btn-link.custom-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const imageSrc = this.dataset.src;
          const title = this.dataset.title;
          const author = this.dataset.author;
          const category = this.dataset.category;
          const price = this.dataset.price;
          const date = this.dataset.date;
          const id = this.dataset.nftid;
          openNav(imageSrc, author, title, price, category, date, id);
        });
      });
    }
  };
  xhr.onerror = function () {
    alert("Error en la solicitud de red.");
  };
}

function openNav(imageSrc, author, name, price, category, date, id) {
  var sidebar = document.getElementById("info-sidebar");
  sidebar.style.width = "250px"; 
  document.getElementById("sidebar-image").src = imageSrc;
  document.getElementById("sidebar-author").innerHTML = author;
  document.getElementById("sidebar-name").innerHTML = name;
  document.getElementById("sidebar-price").innerHTML = price;
  document.getElementById("sidebar-category").innerHTML = category;
  document.getElementById("sidebar-date").innerHTML = date;
  document.getElementById("sidebar-nftid").innerHTML = id;
}

function closeNav() {
  var sidebar = document.getElementById("info-sidebar");
  sidebar.style.width = "0"; 
  
}

// LOTTIE
function addToCart() {
  const nftId = document.getElementById("sidebar-nftid").innerText;
  const userId = JSON.parse(localStorage.getItem("token"))._id;
  const token = JSON.parse(localStorage.getItem("token")).token;
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/api/carritos");
  xhr.setRequestHeader("content-Type", "application/json");
  xhr.setRequestHeader("x-user-token", token);
  xhr.send(JSON.stringify({ nftId, userId, cantidad: 1 }));

  
  let cartAnimation = document.getElementById("cart-animation");
  cartAnimation.style.display = "block";
  cartAnimation.stop(); 
  cartAnimation.play(); 

  xhr.onload = function () {
    //if (xhr.status != 200) {
    //  alert("Error al agregar elemento al carrito");
    //}else{
    //    alert("Elemento agregado al carrito exitosamente");
    //}
    cartAnimation.addEventListener('complete', function() {
      cartAnimation.style.display = "none"; 
    }, {once: true});
  };
  xhr.onerror = function () {
    alert("Error en la solicitud de red.");
  };
}

initData();
