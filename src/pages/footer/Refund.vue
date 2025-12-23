<template>
  <main class="policy-page container py-5">
    <h1 class="mb-3">Refund &amp; Return Policy</h1>

    <p>
      This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service
      that you have purchased through the Platform.
    </p>

    <h3>Cancellations</h3>
    <p>
      Cancellations will only be considered if the request is made within <strong>2 days</strong> of placing the order.
      Cancellation requests may not be entertained if the orders have already been communicated to sellers/merchant(s)
      and they have initiated shipping, or the product is out for delivery. In such a case, you may reject the product
      at the doorstep.
    </p>

    <p>
      ScrollPagluSpot does not accept cancellation requests for perishable items like flowers, eatables, etc. However,
      refund/replacement can be considered if the user establishes that the product delivered is defective or of poor quality.
    </p>

    <h3>Damaged / Defective Items</h3>
    <p>
      For damaged or defective items, report to customer service within <strong>2 days</strong> of receipt. The request will be
      handled after seller/merchant verification.
    </p>

    <h3>Not as Described</h3>
    <p>
      If the product is materially different from what was shown or expected, inform customer service within <strong>2 days</strong> of receipt.
      The customer service team will review and decide on refunds/replacements.
    </p>

    <h3>Manufacturer Warranty</h3>
    <p>
      For products with manufacturer warranty, please refer to the manufacturer's warranty process.
    </p>

    <h3>Refund Processing Time</h3>
    <p>
      Approved refunds will be processed within <strong>5 days</strong> back to the original payment source or as per the payment provider's rules.
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
