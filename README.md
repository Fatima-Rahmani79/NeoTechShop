# NeoTechShop

A responsive, front-end e-commerce demo for technology products (laptops, monitors, audio, accessories) built with HTML, CSS, Bootstrap 5, and vanilla JavaScript.

This project is a client-side implementation of an online store. It demonstrates dynamic product rendering from JSON, a persistent shopping cart, a local authentication flow (LocalStorage / SessionStorage) and client-side checkout flow.

Demo: https://fatima-rahmani79.github.io/NeoTechShop/

## Features

- Multi-page site: Home, product listings, product detail, cart, checkout, auth, contact
- Responsive design (desktop/tablet/mobile)
- RTL Persian layout using Vazir font
- Products loaded from `assets/data/products.json`
- Local user registration and login (LocalStorage / SessionStorage)
- Persistent shopping cart (LocalStorage) with add/remove/update and badge counter
- Client-side search, filtering, and sorting (no page reloads)
- Checkout form validation and Luhn card check (test mode only)
- Two payment options: Online (test) and Cash on Delivery
- Toast notifications and Swiper.js carousels for promotions

## Tech stack

- HTML5, CSS3, Bootstrap 5
- JavaScript (ES6+)
- Swiper.js (carousel)
- Font Awesome
- LocalStorage / SessionStorage
- JSON product data

## Project structure

NeoTechShop/

- assets/
  - css/
  - js/
  - data/
  - images/
  - screenShots/
- index.html
- auth.html
- product.html
- cart-page.html
- checkout.html
- confirmation.html
- accessory-products.html
- audio-products-listing.html
- laptop-products-listing.html
- monitor-products-listing.html
- contact.html
- README.md

Main files:
- `assets/js/script.js` — core logic
- `assets/js/cart.js` — cart management
- `assets/data/products.json` — product data

## Screenshots

Below are screenshots from the demo site (located in `assets/screenShots/`). Click any image to view the full-size file.

- Home page

![Home page screenshot](assets/screenShots/index-html.jpg)

- Laptop products listing

![Laptop products listing](assets/screenShots/loptop-products-listing-html.jpg)

- Product detail

![Product detail](assets/screenShots/product-html.jpg)

- Auth / Login page

![Auth page](assets/screenShots/auth-html.jpg)

- Cart page

![Cart page](assets/screenShots/cart-page-html.jpg)

- Checkout (main)

![Checkout page](assets/screenShots/checkout-html.jpg)

- Checkout (alternate)

![Checkout page 2](assets/screenShots/checkout-html-2.png)

- Order confirmation

![Order confirmation](assets/screenShots/confirmation.jpg)


## Getting started

Requirements: modern browser. Optional: Node.js for local server.

Clone the repository:

```bash
git clone https://github.com/Fatima-Rahmani79/NeoTechShop.git
cd NeoTechShop
```

Run locally:

- Open `index.html` directly in your browser, or
- Use a simple server (recommended):

```bash
npx live-server
# or
npx http-server -c-1
```

## Usage

- Browse and filter products, add items to the cart.
- Register and log in on the Auth page to enable checkout.
- Complete the checkout form to place an order (client-side only).

Test payment (online test mode):

- Card number: `4444 3333 2222 1111` (test)
- Use an expiry date within the next 10 years

Notes: All data and authentication are client-side only; no real payments or server processing are performed.

## Customize

- Edit `assets/data/products.json` to change product data.
- Update styles in `assets/css/main.css`.
- Modify behavior in `assets/js/*.js`.

## Contributing

Issues and pull requests are welcome. For code changes, please open a PR with a clear description and screenshots if applicable.

## License

No license file is included. Add a `LICENSE` (for example MIT) if you want to make this project open source.

## Author

Fatima Rahmani — fatima.rahmnai79@gmail.com


*Updated README to add screenshot gallery.*
