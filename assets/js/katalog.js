// Open Modal Function
function openOrderModal(button) {
  const card = button.closest(".card");

  // Ambil data produk dari elemen card
  const productId = card.getAttribute("data-id");
  const name = card.querySelector("#nama_produk").textContent.trim();
  const description = card.querySelector("#deskrip_produk").textContent.trim();
  const image = card.querySelector(".img-box img").src;
  const priceText = card.querySelector("#harga_produk").textContent.trim();
  const price = parseInt(priceText.replace(/\D/g, ""));
  const stock = parseInt(
    card.querySelector("#stock_produk").textContent.replace(/\D/g, "")
  );

  // Isi data produk ke modal
  document.getElementById("modalProductId").value = productId;
  document.getElementById("modalProductName").textContent = name;
  document.getElementById("modalProductDescription").textContent = description;
  document.getElementById("modalProductImage").src = image;
  document.getElementById(
    "modalProductPrice"
  ).textContent = `Rp. ${price.toLocaleString("id-ID")}`;
  document.getElementById("modalProductStock").textContent = stock;

  // Tampilkan modal
  document.getElementById("orderModal").classList.add("show");
  document.querySelector(".background-modal").classList.add("show");
}

// Close Modal Function
function closeOrderModal() {
  document.getElementById("orderModal").classList.remove("show");
  document.querySelector(".background-modal").classList.remove("show");
}

// Prevent Background Modal from Closing Modal
document
  .querySelector(".background-modal")
  .addEventListener("click", (event) => {
    const modal = document.getElementById("orderModal");
    if (!modal.contains(event.target)) {
      closeOrderModal();
    }
  });

// Prevent Propagation of Click Inside Modal
document.querySelector(".modal").addEventListener("click", (event) => {
  event.stopPropagation(); // Prevent click inside modal from closing it
});

async function orderProduct() {
  const quantity = parseInt(
    document.getElementById("modalProductQuantity").value
  );
  const stock = parseInt(
    document.getElementById("modalProductStock").textContent
  );
  const productId = document.getElementById("modalProductId").value;
  const rawPrice = document
    .getElementById("modalProductPrice")
    .textContent.replace(/[^\d]/g, "");
  const productPrice = parseInt(rawPrice);
  const totalHarga = quantity * productPrice;

  if (quantity > stock) {
    Swal.fire({
      icon: "error",
      title: "Stok Tidak Cukup!",
      text: "Jumlah produk yang dipesan melebihi stok yang tersedia.",
    });
    return;
  }

  if (quantity < 1) {
    Swal.fire({
      icon: "error",
      title: "Jumlah Tidak Valid!",
      text: "Jumlah produk harus minimal 1.",
    });
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire({
      icon: "warning",
      title: "Belum Login!",
      text: "Anda harus login untuk melakukan pemesanan.",
    });
    return;
  }

  const orderData = {
    id_produk: productId,
    jumlah: quantity,
    total_harga: totalHarga,
    finish_redirect_url:
      "https://proyek-3-proyek.github.io/tokline.github.io/belanja",
  };

  try {
    Swal.fire({
      title: "Sedang Memproses...",
      text: "Mohon tunggu sebentar.",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await fetch(
      "https://backend-eight-phi-75.vercel.app/api/payment/create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      Swal.fire({
        icon: "error",
        title: "Gagal Membuat Pesanan",
        text: errorData.message,
      });
      return;
    }

    const result = await response.json();

    Swal.fire({
      icon: "success",
      title: "Pesanan Berhasil!",
      text: "Anda akan diarahkan ke halaman pembayaran.",
      showConfirmButton: false,
      timer: 2000,
    });

    setTimeout(async () => {
      window.location.href = result.data.snap_url;
      setTimeout(() => {
        updateTransactionStatus(result.data.transaction_id);
      }, 3000);
    }, 2000);
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    Swal.fire({
      icon: "error",
      title: "Terjadi Kesalahan",
      text: "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.",
    });
  }
}

// ------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".container-card");

  const token = localStorage.getItem("token");

  if (!token) {
    Swal.fire({
      icon: "warning",
      title: "Anda belum login",
      text: "Silakan login terlebih dahulu.",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "/login";
    });
    return;
  }

  try {
    const response = await fetch(
      "https://backend-eight-phi-75.vercel.app/api/produk/all",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        Swal.fire({
          icon: "warning",
          title: "Sesi Berakhir",
          text: "Silakan login kembali.",
          confirmButtonText: "OK",
        }).then(() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        });
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Gagal Mengambil Data",
        text: "Gagal mengambil data produk.",
        confirmButtonText: "OK",
      });

      throw new Error("Gagal mengambil data produk");
    }

    const produkList = await response.json();
    container.innerHTML = "";

    produkList.forEach((produk) => {
      const card = `
        <div class="card" style="--clr: #009688" data-id="${produk.id_produk}">
          <div class="img-box">
            <img src="https://qzbythadanrtksusxdtq.supabase.co/storage/v1/object/public/gambar/${
              produk.gambar
            }" width="100" height="100" />
          </div>
          <div class="content">
            <h2 id="nama_produk" class="pt-2">${produk.nama}</h2>
            <p id="deskrip_produk" class="p-3">${produk.deskripsi}</p>
            <div class="harstok pb-1">
              <p id="harga_produk" class="text-sky-400">Harga: Rp. ${produk.harga.toLocaleString(
                "id-ID"
              )}</p>
            </div>
            <div class="stock pb-1">
              <p id="stock_produk" class="text-sky-400">Stok: ${produk.qty}</p>
            </div>
            <button class="button-buy" onclick="openOrderModal(this)">
              Beli
            </button>
          </div>
        </div>`;
      container.innerHTML += card;
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p>Gagal memuat produk. Coba lagi nanti.</p>`;
  }
});
// ------------------------------------------------------------------------------------

// logout botton
function checkLoginStatus() {
  // Cek status login dari localStorage
  const token = localStorage.getItem("token"); // Simpan token login di localStorage
  return token !== null; // Jika token ada, anggap user sudah login
}

function updateLoginButton() {
  const profileContainer = document.querySelector(".profil");

  if (checkLoginStatus()) {
    // Jika user sudah login, tampilkan tombol Logout
    profileContainer.innerHTML = `
      <button
        id="logoutButton"
        class="pr-7 pl-7 pb-2 pt-2 bg-red-500 hover:bg-red-700 rounded-3xl text-white"
      >
        Logout
      </button>
    `;

    // Tambahkan event listener untuk tombol Logout
    document.getElementById("logoutButton").addEventListener("click", () => {
      localStorage.removeItem("token");

      Swal.fire({
        icon: "success",
        title: "Logout Berhasil",
        text: "Anda telah logout.",
        confirmButtonText: "OK",
      }).then(() => {
        updateLoginButton();
        window.location.href = "/login";
      });
    });
  } else {
    // Jika user belum login, tampilkan tombol Login
    profileContainer.innerHTML = `
    <a
      href="/login"
      class="pr-7 pl-7 pb-2 pt-2 bg-sky-500 hover:bg-sky-700 rounded-3xl text-white"
    >
      Login
    </a>
  `;
  }
}

// Panggil fungsi saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", updateLoginButton);

document.addEventListener("DOMContentLoaded", () => {
  // Pastikan elemen ditemukan sebelum menambahkan event listener
  const belanjaLink = document.querySelector("a[href='/belanja']");

  if (belanjaLink) {
    belanjaLink.addEventListener("click", function (event) {
      event.preventDefault(); // Mencegah perilaku default link
      window.location.href = "/belanja"; // Arahkan ke halaman belanja
    });
  } else {
    console.log("Elemen Belanja tidak ditemukan di halaman.");
  }
});

// ------------------------------Transaction Status-----------------------------------------
async function updateTransactionStatus(orderId) {
  // Data untuk mengubah status transaksi
  const notificationData = {
    transaction_status: "settlement",
    order_id: orderId,
  };

  try {
    // Kirim permintaan POST ke endpoint notification
    const response = await fetch(
      "https://backend-eight-phi-75.vercel.app/api/payment/notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gagal memperbarui status transaksi:", errorData);
      return;
    }

    const result = await response.json();
    console.log("Status transaksi berhasil diperbarui:", result);

    // Tampilkan notifikasi ke pengguna
    Swal.fire({
      icon: "success",
      title: "Transaksi Selesai!",
      text: "Status transaksi telah diperbarui menjadi Paid.",
    });
  } catch (error) {
    console.error(
      "Terjadi kesalahan saat memperbarui status transaksi:",
      error
    );
    Swal.fire({
      icon: "error",
      title: "Kesalahan!",
      text: "Gagal memperbarui status transaksi.",
    });
  }
}
