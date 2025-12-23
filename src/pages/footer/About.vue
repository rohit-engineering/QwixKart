<template>
  <main class="about-page container py-5">
    <h1 class="mb-3">About Us</h1>

    <p>
      <strong>ScrollPaglu Spot</strong> is a curated online destination for aesthetic finds, cool gadgets, and statement pieces tailored for the GenZ spirit. We focus on design-forward products, community-driven drops and affordable trend-led items.
    </p>

    <h3>Legal &amp; Business Information</h3>
    <p>
      <strong>Legal Owner:</strong> Rohit<br />
      <strong>Registered Office:</strong> {{ registeredAddress }}<br />
      <strong>Company Registration:</strong> Incorporated under the Companies Act (details available on request).
    </p>

    <h3>Contact</h3>
    <p>
      For customer support please use:<br />
      Phone: <strong>{{ phone }}</strong><br />
      Email: <strong><a :href="`mailto:${email}`">{{ email }}</a></strong>
    </p>

    <h3>Our Promise</h3>
    <p>
      We aim to deliver high-quality products with great service. If you ever feel an order did not meet your expectations, reach out and we will help make it right.
    </p>

    <div class="policy-footer mt-4">
      <small>Last updated: {{ lastUpdated }}</small>
    </div>
  </main>
</template>

<script setup>
const registeredAddress = 'RZH 705 GALI NO 15 RAJ NAGAR 2 PALAM COLONY NEW DELHI 110077, New Delhi, India'
// IMPORTANT: replace with PayU contact details
const phone = '+91 7827411020'
const email = 'rk4817341@gmail.com'
const lastUpdated = new Date().toLocaleDateString('en-GB')
</script>

<style scoped>
.about-page { max-width: 900px; margin: 0 auto; color: #2b0b3a; }
</style>
