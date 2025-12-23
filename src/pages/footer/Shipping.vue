<template>
  <main class="policy-page container py-5">
    <h1 class="mb-3">Shipping Policy</h1>

    <p>
      Orders are shipped through registered domestic courier companies and/or speed post only.
      Orders are shipped within <strong>10 days</strong> from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation,
      subject to courier company/post office norms.
    </p>

    <p>
      Platform Owner shall not be liable for any delay in delivery caused by the courier company or postal authority.
      Delivery will be made to the address provided by the buyer at the time of purchase. Delivery confirmations will be sent to your registered email.
    </p>

    <h3>Shipping Costs</h3>
    <p>
      Shipping costs (if any) will be shown at checkout. Any customs, duties, or taxes for deliveries outside India (if available) are the responsibility of the buyer.
    </p>

    <h3>Delivery Issues</h3>
    <p>
      If a courier attempts delivery and no one is available, it may be returned to the local facility. In such instances, follow the courier’s instructions or contact our support team.
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
