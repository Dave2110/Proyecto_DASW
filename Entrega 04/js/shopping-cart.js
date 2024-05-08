function initData() {
  const userId = JSON.parse(localStorage.getItem("token"))._id;
  let gallery = document.getElementById("carrito-container");
  let listado = document.getElementById("listado");
  let grandTotal = document.getElementById("grandTotal");
  let url = "http://localhost:3000/api/carritos/" + userId;
  const token = JSON.parse(localStorage.getItem("token")).token;
  let totalTitle = 0.0;

  let xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.setRequestHeader("content-Type", "application/json");
  xhr.setRequestHeader("x-user-token", token);
  xhr.send();
  xhr.onload = function () {
    if (xhr.status != 200) {
      alert(xhr.status + ": " + xhr.statusText);
    } else {
      gallery.innerHTML = "";
      listado.innerHTML = "";
      let carrito = JSON.parse(xhr.responseText);
      carrito.forEach((item) => {
        const nftId = item.nftId;
        let nftXhr = new XMLHttpRequest();
        let nftUrl = "http://localhost:3000/api/nfts/" + nftId;
        nftXhr.open("GET", nftUrl);
        nftXhr.setRequestHeader("content-Type", "application/json");
        nftXhr.setRequestHeader("x-user-token", token);
        nftXhr.send();
        nftXhr.onload = function () {
          if (nftXhr.status == 200) {
            let nft = JSON.parse(nftXhr.responseText);
            // Crear el elemento HTML para cada NFT con su precio obtenido
            let galleryItem = document.createElement("div");
            galleryItem.className = "card";
            galleryItem.innerHTML = `
                <div class="card-body">
                  <div class="media">
                    <div class="media-body">
                      <h3 class="mt-0 mb-1">
                        ${nft.nombre}
                        <button type="button" onclick="deleteCartItem('${item._id}')" class="btn btn-sm btn-danger"><i class="fa fa-trash" aria-hidden="true"></i></button>
                      </h3>
                      <div class="input-group mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text" id="basic-addon1">Cantidad:</span>
                        </div>
                        <input type="number" class="form-control" placeholder="1" id="quantity" name="quantity" value="${item.cantidad}">
                      </div>
                      <div class="input-group mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text" id="basic-addon1">Precio:</span>
                        </div>
                        <span class="form-control"  align="center">${nft.precio}</span>
                        <div class="input-group-append">
                          <span class="input-group-text" id="basic-addon2">ETH</span>
                        </div>
                      </div>
                    </div>
                    <div class="media-right">
                      <img class="ml-3 shop-img" width="100px" src="../img/${nft.imageUrl}" alt="Generic placeholder image">
                    </div>
                  </div>
                </div>
              `;
            gallery.appendChild(galleryItem);
            let totals = document.createElement("p");
            totals.innerHTML = `
                <p>${nft.nombre} : ${nft.precio * item.cantidad}</p>
            `;
            listado.appendChild(totals);
            totalTitle += nft.precio * item.cantidad;
            let total = document.createElement("p");
            total.innerHTML = `
                        <p>Total : ${totalTitle}</p>
                    `;
            grandTotal.innerHTML = "";
            grandTotal.appendChild(total);
          } else {
            alert(nftXhr.status + ": " + nftXhr.statusText);
          }
        };
        nftXhr.onerror = function () {
          alert("Error en la solicitud de red.");
        };
      });
    }
  };
  xhr.onerror = function () {
    alert("Error en la solicitud de red.");
  };
}

function deleteCartItem(nftId) {
  const url = `http://localhost:3000/api/carritos/${nftId}`;
  const token = JSON.parse(localStorage.getItem("token")).token;
    
  fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-user-token": token,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error("Error al eliminar elemento del carrito");
    })
    .then((data) => {
      console.log(data);
      initData();
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Hubo un error al eliminar el elemento del carrito");
    });
}

initData();
