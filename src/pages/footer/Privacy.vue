<template>
  <main class="policy-page container py-5">
    <h1 class="mb-3">Privacy Policy</h1>

    <p>
      This Privacy Policy describes how ScrollPagluSpot and its affiliates (collectively "ScrollPagluSpot, we,
      our, us") collect, use, share, protect or otherwise process your information/ personal data through our
      website <a :href="websiteUrl" target="_blank">{{ websiteUrl }}</a> (Platform).
    </p>

    <h3>Introduction</h3>
    <p>
      Please note that you may be able to browse certain sections of the Platform without registering with
      us. We do not offer any product/service under this Platform outside India and your personal data will
      primarily be stored and processed in India. By visiting this Platform, providing your information or
      availing any product/service offered on the Platform, you expressly agree to be bound by the terms
      and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and
      conditions, and agree to be governed by the laws of India.
    </p>

    <h3>Collection</h3>
    <p>
      We collect personal data when you use our Platform or interact with us. This may include name, date of birth,
      address, telephone/mobile number, email ID and any information shared as proof of identity or address.
      Sensitive personal data (for example payment instrument info, biometric info) may be collected with your consent.
    </p>

    <h3>Usage</h3>
    <p>
      We use personal data to provide the services you request. Where we use personal data for marketing, you'll have an option to opt out.
      Uses include: order handling; enhance customer experience; resolve disputes; send offers and updates; detect and prevent fraud; enforce our terms.
    </p>

    <h3>Sharing</h3>
    <p>
      We may share your personal data with internal group entities and third parties such as sellers, logistics partners
      and payment providers to enable order fulfilment and related services. We may disclose personal data to government
      agencies or other authorised law enforcement agencies if required by law.
    </p>

    <h3>Security Precautions</h3>
    <p>
      We adopt reasonable security practices and procedures to protect your personal data. However, no data transmission can be guaranteed 100% secure.
      Please protect your account login and password.
    </p>

    <h3>Data Deletion &amp; Retention</h3>
    <p>
      You may delete your account using the Platform's settings, subject to pending orders/claims. We retain personal data only as long as necessary or as required by law.
      We may retain anonymised data for analysis.
    </p>

    <h3>Your Rights</h3>
    <p>
      You may access, rectify and update your personal data through Platform functionalities or by contacting us.
    </p>

    <h3>Consent &amp; Withdrawal</h3>
    <p>
      By using the Platform you consent to this Privacy Policy. You may withdraw consent by contacting our Grievance Officer (details below).
    </p>

    <h3>Changes to this Policy</h3>
    <p>
      We may update this Privacy Policy from time to time. Check this page periodically for changes.
    </p>

    <h3>Grievance Officer</h3>
    <p>
      <strong>Grievance Officer:</strong> <em>Insert name here</em><br />
      <strong>Designation:</strong> <em>Insert designation</em><br />
      <strong>Company:</strong> ScrollPagluSpot<br />
      <strong>Address:</strong> {{ registeredAddress }}
    </p>

    <h3>Contact Us</h3>
    <p>
      Phone: <strong>{{ phone }}</strong> (Mon–Fri {{ supportHours }})<br />
      Email: <strong><a :href="`mailto:${email}`">{{ email }}</a></strong>
    </p>

    <div class="policy-footer mt-4">
      <small>Last updated: {{ lastUpdated }}</small>
    </div>
  </main>
</template>

<script setup>
const websiteUrl = 'https://scrollpagluspot.vercel.app/'
const registeredAddress = 'RZH 705 GALI NO 15 RAJ NAGAR 2 PALAM COLONY NEW DELHI 110077, New Delhi, India'

// IMPORTANT: Replace these with the exact contact details from your PayU dashboard:
const phone = '+91 7827411020'
const email = 'rk4817341@gmail.com'

const supportHours = '09:00 - 18:00'
const lastUpdated = new Date().toLocaleDateString('en-GB')
</script>

<style scoped>
.policy-page { max-width: 900px; margin: 0 auto; color: #2b0b3a; }
</style>
