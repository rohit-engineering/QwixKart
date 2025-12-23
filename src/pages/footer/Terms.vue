<template>
  <main class="policy-page container py-5">
    <h1 class="mb-3">Terms &amp; Conditions</h1>

    <p>
      This document is an electronic record in terms of Information Technology Act, 2000 and rules
      there under as applicable and the amended provisions pertaining to electronic records in various
      statutes as amended by the Information Technology Act, 2000. This electronic record is generated
      by a computer system and does not require any physical or digital signatures.
    </p>

    <p>
      This document is published in accordance with the provisions of Rule 3 (1) of the Information
      Technology (Intermediaries guidelines) Rules, 2011 that require publishing the rules and
      regulations, privacy policy and Terms of Use for access or usage of domain name
      <a :href="websiteUrl" target="_blank" rel="noopener">{{ websiteUrl }}</a> ('Website'), including the related mobile site and mobile
      application (hereinafter referred to as 'Platform').
    </p>

    <p>
      The Platform is owned by ScrollPagluSpot, a company incorporated under the Companies Act,
      1956 with its registered office at <strong>{{ registeredAddress }}</strong> (hereinafter referred to as ‘Platform Owner’, 'we', 'us',
      'our').
    </p>

    <p>
      Your use of the Platform and services and tools are governed by the following terms and
      conditions (“Terms of Use”) as applicable to the Platform including the applicable policies which
      are incorporated herein by way of reference. If You transact on the Platform, You shall be subject
      to the policies that are applicable to the Platform for such transaction. By mere use of the Platform,
      You shall be contracting with the Platform Owner and these terms and conditions including the
      policies constitute Your binding obligations, with Platform Owner. These Terms of Use relate to
      your use of our website, goods (as applicable) or services (as applicable) (collectively, 'Services').
    </p>

    <p>
      Any terms and conditions proposed by You which are in addition to or which conflict with these
      Terms of Use are expressly rejected by the Platform Owner and shall be of no force or effect.
      These Terms of Use can be modified at any time without assigning any reason. It is your
      responsibility to periodically review these Terms of Use to stay informed of updates.
    </p>

    <p>
      For the purpose of these Terms of Use, wherever the context so requires ‘you’, 'your' or ‘user’ shall
      mean any natural or legal person who has agreed to become a user/buyer on the Platform.
    </p>

    <h3>Acceptance</h3>
    <p>
      ACCESSING, BROWSING OR OTHERWISE USING THE PLATFORM INDICATES YOUR
      AGREEMENT TO ALL THE TERMS AND CONDITIONS UNDER THESE TERMS OF USE,
      SO PLEASE READ THE TERMS OF USE CAREFULLY BEFORE PROCEEDING.
    </p>

    <h3>Using the Platform</h3>
    <ul>
      <li>To access and use the Services, you agree to provide true, accurate and complete information.</li>
      <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials offered on this website or through the Services.</li>
      <li>Your use of our Services and the Platform is solely at your own risk.</li>
      <li>The contents of the Platform and the Services are proprietary to us and are licensed to us. You shall not claim any intellectual property rights in its contents.</li>
      <li>You agree not to use the Platform and/or Services for any purpose that is unlawful or forbidden by these Terms.</li>
      <li>The Platform may contain links to third-party websites. Those links are provided for your convenience; you will be governed by those third parties' policies on visiting them.</li>
      <li>Upon initiating a transaction you are entering a legally binding contract with the Platform Owner.</li>
    </ul>

    <h3>Indemnity &amp; Force Majeure</h3>
    <p>
      You shall indemnify and hold harmless Platform Owner, its affiliates, group companies and
      their respective officers, directors, agents, and employees, from any claim or demand, or actions
      including reasonable attorney's fees, made by any third party arising out of your breach of these Terms.
    </p>

    <p>
      Notwithstanding anything contained in these Terms of Use, the parties shall not be liable for any failure to perform an obligation under these Terms if performance is prevented or delayed by a force majeure event.
    </p>

    <h3>Governing Law &amp; Jurisdiction</h3>
    <p>
      These Terms and any dispute or claim relating to it, or its enforceability, shall be governed by
      and construed in accordance with the laws of India. All disputes arising out of or in connection
      with these Terms shall be subject to the exclusive jurisdiction of the courts in New Delhi and Delhi.
    </p>

    <h3>Contact</h3>
    <p>
      All concerns or communications relating to these Terms must be communicated to us using the contact information provided on this website.
    </p>

    <div class="policy-footer mt-4">
      <small>Last updated: {{ lastUpdated }}</small>
    </div>
  </main>
</template>

<script setup>
const websiteUrl = 'https://scrollpagluspot.vercel.app/'
const registeredAddress = 'RZH 705 GALI NO 15 RAJ NAGAR 2 PALAM COLONY NEW DELHI 110077, New Delhi, India'
const lastUpdated = new Date().toLocaleDateString('en-GB')
</script>

<style scoped>
.policy-page { max-width: 900px; margin: 0 auto; color: #2b0b3a; }
.policy-page h1 { font-family: 'Playfair Display', serif; color: #3a0ca3; }
.policy-page h3 { color: #6a4c93; margin-top: 1.2rem; }
.policy-page ul { margin-left: 1rem; }
</style>
