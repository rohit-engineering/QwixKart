<template>
  <main class="policy-page container py-5">
    <h1 class="mb-3">Cancellation Policy</h1>

    <p>
      Cancellation requests must be raised within <strong>2 days</strong> of placing the order. Cancellation may not be accepted if the order has already been picked up or shipped by the seller.
    </p>

    <p>
      If the seller has already dispatched the shipment, please refuse delivery at the time of delivery and contact customer service immediately. For certain products (e.g., perishable goods), cancellations may not be accepted.
    </p>

    <h3>How to Cancel</h3>
    <ol>
      <li>Go to your Orders page in your account.</li>
      <li>Select the order you want to cancel.</li>
      <li>Click Cancel and provide the reason.</li>
      <li>If cancellation is allowed, you will receive confirmation by email.</li>
    </ol>

    <h3>Refund on Cancellation</h3>
    <p>
      Refunds for cancelled orders (if approved) will be processed as per our <strong>Refund & Return Policy</strong> and may take up to 5 days to reflect.
    </p>

    <div class="policy-footer mt-4">
      <small>Last updated: {{ lastUpdated }}</small>
    </div>
  </main>
</template>

<script setup>
const lastUpdated = new Date().toLocaleDateString('en-GB')
</script>

<style scoped>
.policy-page { max-width: 900px; margin: 0 auto; color: #2b0b3a; }
</style>
