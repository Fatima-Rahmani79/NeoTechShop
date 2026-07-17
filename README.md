💻 NeoTechShop — Modern Online Tech Store

NeoTechShop is a fully functional and responsive e-commerce website built using HTML, CSS, Bootstrap, and Vanilla JavaScript.
It offers a complete online shopping experience for technology products such as laptops, monitors, audio devices, and accessories, each with its own dedicated listing page and detailed product view.

🛍️ Project Overview

NeoTechShop allows users to:

Browse and search for tech products dynamically loaded from a JSON file.

Add and manage items in their shopping cart (data stored persistently in LocalStorage).

Create an account, log in/out, and place orders only after authentication.

Complete a checkout process with form validation, including credit card verification using the Luhn algorithm.

View an order confirmation page displaying personal and purchase details after successful checkout.

🚀 Main Features
🧾 General

Multi-page structure (Home, Product Listings, Product Details, Cart, Checkout, Auth)

Fully responsive design for desktop, tablet, and mobile

Right-to-left (RTL) Persian layout with the Vazir font

Dynamic product rendering from products.json

💡 User & Auth

Local user registration and login system using LocalStorage & SessionStorage

Persistent session even after closing the browser

Mandatory authentication before placing an order

Option to log out anytime

🛒 Shopping Cart

Add, remove, and update item quantities

Persistent cart storage via LocalStorage

Visual badge counter and cart modal synced across pages

💳 Checkout & Payment

Users fill out a detailed checkout form (name, address, etc.)

Two payment options: Online Payment and Cash on Delivery

For online payment, card validation follows:

Must start with 4 (test Visa pattern)

Must pass the Luhn Algorithm

Expiration date limited to a maximum of 10 years

Upon valid form submission, users are redirected to a confirmation page showing:

Their order details

Customer information

Payment method

🎯 Additional Highlights

Toast messages for all user actions (add to cart, login, logout, etc.)

Swiper.js slider for special offers and featured products

Search bar with live product filtering

Accessible and SEO-friendly structure

🎯 Product Listing Page

Users can sort products by:

🏷️ Product name

💰 Price (ascending or descending)

Users can filter products by:

💵 Price range

🏢 Brand name

⭐ Customer rating

Filtering and sorting are fully dynamic — no page reloads required

All product data is fetched from a JSON file

✨ Additional Highlights

Toast messages for all user actions (add to cart, login, logout, etc.)

Swiper.js slider for special offers and featured products

Search bar with live product filtering

Accessible and SEO-friendly structure

🧱 Technologies Used
Technology Purpose
HTML5 Page structure and content
CSS3 / Bootstrap 5 Responsive and modern UI
JavaScript (ES6+) Application logic and interactivity
Swiper.js Product sliders and carousels
Font Awesome Icons and UI elements
LocalStorage / SessionStorage Data persistence
JSON Product data storage

🗂️ Project Structure
NeoTechShop/
│
├── assets/
│ ├── css/
│ │ └── main.css
│ ├── js/
│ │ ├── script.js ← Core site logic
│ │ └── cart.js ← Cart management API
│ ├── data/
│ │ └── products.json ← Product data source
│ ├── images/
│ └── logo/
│
├── index.html ← Homepage
├── auth.html ← Login / Register
├── product.html ← Product details
├── cart-page.html ← Cart page
├── checkout.html ← Checkout form
├── confirmation.html ← Order confirmation
├── accessory-products.html ← Products List
├── audio-products-listing.html ← Products List
├── laptop-products-listing.html ← Products List
├── monitor-products-listing.html ← Products List
├── contact.html ← Contact page
└── README.md

⚙️ How to Run

Clone the repository

git clone https://github.com/Fatima-Rahmani79/NeoTechShop.git

Open the project folder

cd NeoTechShop

Run locally

Open index.html directly in your browser,
or use a local server such as:

npx live-server

Explore the store — add products, log in, and test the checkout process.

🧮 Payment Example (Test Mode)

Use the following test card number for validation during checkout:

Card Number: 4444 3333 2222 1111
Expiry Date: Any valid date within the next 10 years

📸 Screenshots:

🏠 Homepage
![Homepage Screenshot](https://github.com/Fatima-Rahmani79/NeoTechShop/blob/main/assets/screenShots/index-html.jpg
?raw=true)

🛍️ Product Listing
![Product Listing Screenshot](https://github.com/Fatima-Rahmani79/NeoTechShop/blob/main/assets/screenShots/loptop-products-listing-html.jpg?raw=true)

🧾 Product Detail Page
![Product Detail Screenshot](https://github.com/Fatima-Rahmani79/NeoTechShop/blob/main/assets/screenShots/product-html.jpg?raw=true)

🛒 Cart Page
![Cart Page Screenshot](https://github.com/Fatima-Rahmani79/NeoTechShop/blob/main/assets/screenShots/cart-page-html.jpg?raw=true)

💳 Checkout Page
![Checkout Page Screenshot](https://github.com/Fatima-Rahmani79/NeoTechShop/blob/main/assets/screenShots/checkout-html.jpg?raw=true)
![Checkout Page Screenshot](https://github.com/Fatima-Rahmani79/NeoTechShop/blob/main/assets/screenShots/checkout-html-2.png?raw=true)

✅ auth Page
![Checkout Page Screenshot](https://github.com/Fatima-Rahmani79/NeoTechShop/blob/main/assets/screenShots/auth-html.jpg?raw=true)

🌐 Live Demo (https://fatima-rahmani79.github.io/NeoTechShop/)

👉 View NeoTechShop on GitHub Pages

👩‍💻 Developer

Developed by: Fatima Rahmani
📧 Email: fatima.rahmnai79@gmail.com

📅 Year: 2025

🏁 Summary

NeoTechShop demonstrates a fully front-end e-commerce system with realistic functionality, user authentication, cart persistence, product data management, and client-side payment validation — all built with clean, organized code and modern web standards.
