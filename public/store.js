// Wait for the DOM content to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ready);
} else {
  ready();
}

function ready() {
  const cartItems = document.querySelector('.cart-items');
  const purchaseButton = document.querySelector('.btn-purchase');

  // Event delegation to handle remove button clicks
  cartItems.addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-danger')) {
      const cartRow = event.target.closest('.cart-row');
      cartRow.remove();
      updateCartTotal();
    }
  });

  // Event delegation to handle quantity input changes
  cartItems.addEventListener('change', function(event) {
    if (event.target.classList.contains('cart-quantity-input')) {
      const input = event.target;
      if (isNaN(input.value) || input.value <= 0) {
        input.value = 1;
      }
      updateCartTotal();
    }
  });

  // Handle "Add to Cart" button clicks
  const addToCartButtons = document.getElementsByClassName('btn-shop');
  Array.from(addToCartButtons).forEach(function(button) {
    button.addEventListener('click', function(event) {
      const shopItem = button.closest('.shop-item');
      const title = shopItem.querySelector('.shop-item-title').innerText;
      const price = shopItem.querySelector('.shop-item-price').innerText;
      const image = shopItem.querySelector('.shop-item-image').getAttribute('src');
      const id = shopItem.dataset.itemid;
      addItemToCart(title, price, image, id);
      updateCartTotal();
    });
  });

  // Handle "Purchase" button click
  if (purchaseButton) {
    purchaseButton.addEventListener('click', function() {
      const cartRows = cartItems.querySelectorAll('.cart-row');
      if (cartRows.length === 0) {
        alert('Your cart is empty. Add items to the cart before making a purchase.');
        return;
      }

      const items = Array.from(cartRows).map(function(cartRow) {
        const quantity = cartRow.querySelector('.cart-quantity-input').value;
        const id = cartRow.dataset.itemid;
        return { id, quantity };
      });

      // Remove the "Attention Album" item from the items array
      const filteredItems = items.filter(function(item) {
        return item.id !== '1';
      });

      const totalPrice = calculateTotalPrice(filteredItems);
      openStripeCheckout(totalPrice);
    });
  }
}

// Open Stripe checkout with the total price
function openStripeCheckout(totalPrice) {
  const stripeHandler = StripeCheckout.configure({
    key: "pk_test_51NHldkAyxwxmc2KCtuiQesfoxo5DBbKYHlj2tiBzjEiNVmWlLWM6TyuKd19ZTi3mthSKHk1SokulChIjrYZghNCi004NbaUx3P",
    locale: 'auto',
    token: function(token) {
      const items = Array.from(document.querySelectorAll('.cart-row')).map(function(cartRow) {
        const quantity = cartRow.querySelector('.cart-quantity-input').value;
        const id = cartRow.dataset.itemid;
        return { id, quantity };
      });

      const filteredItems = items.filter(function(item) {
        return item.id !== '1';
      });

      fetch('/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          stripeTokenId: token.id,
          items: filteredItems
        })
      })
        .then(function(res) {
          return res.json();
        })
        .then(function(data) {
          alert(data.message);
          const cartItems = document.querySelector('.cart-items');
          while (cartItems.firstChild) {
            cartItems.firstChild.remove();
          }
          updateCartTotal();
        })
        .catch(function(error) {
          console.error(error);
        });
    }
  });

  stripeHandler.open({
    amount: totalPrice * 100
  });
}

// Add item to the cart
function addItemToCart(title, price, imageSrc, id) {
  const cartItems = document.querySelector('.cart-items');
  const cartItemNames = cartItems.querySelectorAll('.cart-item-title');

  for (let i = 0; i < cartItemNames.length; i++) {
    if (cartItemNames[i].innerText === title) {
      alert('This item is already added to the cart');
      return;
    }
  }

  const cartRow = document.createElement('div');
  cartRow.classList.add('cart-row');
  cartRow.dataset.itemid = id;

  const cartRowContents = `
    <div class="cart-item cart-column">
      <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
      <span class="cart-item-title">${title}</span>
    </div>
    <span class="cart-price cart-column">${price}</span>
    <div class="cart-quantity cart-column">
      <input class="cart-quantity-input" type="number" value="1">
      <button class="btn btn-danger" type="button">REMOVE</button>
    </div>`;

  cartRow.innerHTML = cartRowContents;
  cartItems.appendChild(cartRow);

  const removeCartItemButton = cartRow.querySelector('.btn-danger');
  removeCartItemButton.addEventListener('click', function(event) {
    const buttonClicked = event.target;
    buttonClicked.parentElement.parentElement.remove();
    updateCartTotal();
  });

  const quantityInput = cartRow.querySelector('.cart-quantity-input');
  quantityInput.addEventListener('change', function(event) {
    const input = event.target;
    if (isNaN(input.value) || input.value <= 0) {
      input.value = 1;
    }
    updateCartTotal();
  });
}

// Update the total price of the cart
function updateCartTotal() {
  const cartItems = document.querySelector('.cart-items');
  const cartRows = cartItems.querySelectorAll('.cart-row');
  let total = 0;

  for (let i = 0; i < cartRows.length; i++) {
    const cartRow = cartRows[i];
    const priceElement = cartRow.querySelector('.cart-price');
    const quantityElement = cartRow.querySelector('.cart-quantity-input');
    const price = parseFloat(priceElement.innerText.replace('$', ''));
    const quantity = quantityElement.value;
    total += price * quantity;
  }

  total = Math.round(total * 100) / 100;
  const cartTotalPrice = document.querySelector('.cart-total-price');
  cartTotalPrice.innerText = '$' + total;
}

// Calculate the total price of items
function calculateTotalPrice(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const price = parseFloat(items[i].price);
    const quantity = parseInt(items[i].quantity);
    total += price * quantity;
  }
  return total;
}
