<template>
  <div class="auth-page d-flex justify-content-center align-items-center">
    <div class="auth-card p-4" :class="{ 'shake-invalid': formInvalid }">
      <h3 class="auth-title">Create your account</h3>
      <p class="auth-subtitle">
        Join the GenZ Shop community and keep all your favorites in one place.
      </p>

      <form @submit.prevent="onSignup" novalidate>
        <!-- Full Name -->
        <div class="mb-3 text-start">
          <label class="form-label">Full name</label>
          <input
            v-model="full_name"
            @input="sanitizeName"
            :class="['form-control', { 'border-invalid': nameError, 'border-valid': !nameError && full_name }]"
            placeholder="e.g. Aanya Kapoor"
            required
            autocomplete="name"
          />
          <small v-if="nameError" class="field-error">{{ nameError }}</small>
        </div>

        <!-- Phone -->
<div class="mb-3 text-start">
  <label class="form-label">Phone</label>
  <input
    v-model="phone"
    @input="sanitizePhone"
    :class="['form-control', { 'border-invalid': phoneError, 'border-valid': !phoneError && phone }]"
    placeholder="10-digit Indian mobile number"
    maxlength="10"
    inputmode="numeric"
    required
  />
  <small v-if="phoneError" class="field-error">{{ phoneError }}</small>
</div>


        <!-- Gender -->
        <div class="mb-3 text-start">
          <label class="form-label d-block">Gender</label>
          <div class="gender-options">
            <label
              class="gender-pill"
              :class="{ active: gender === 'male' }"
            >
              <input
                type="radio"
                value="male"
                v-model="gender"
              />
              <span>Male</span>
            </label>

            <label
              class="gender-pill"
              :class="{ active: gender === 'female' }"
            >
              <input
                type="radio"
                value="female"
                v-model="gender"
              />
              <span>Female</span>
            </label>
          </div>
          <small v-if="genderError" class="field-error">{{ genderError }}</small>
        </div>

        <!-- City -->
        <div class="mb-3 text-start">
          <label class="form-label">City</label>
          <input
            v-model="city"
            @input="sanitizeCity"
            :class="['form-control', { 'border-invalid': cityError, 'border-valid': !cityError && city }]"
            placeholder="e.g. Mumbai"
            required
          />
          <small v-if="cityError" class="field-error">{{ cityError }}</small>
        </div>

        <!-- Email -->
        <div class="mb-3 text-start email-field">
          <label class="form-label">Email</label>

          <div class="email-input-wrapper">
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="you@example.com"
              @input="validateEmail"
              required
              :class="{
                'border-checking': checkingEmail,
                'border-valid': emailValid && !checkingEmail,
                'border-invalid': !emailValid && !checkingEmail && emailMessage
              }"
            />
            <span
              class="email-status"
              :class="{
                checking: checkingEmail,
                valid: emailValid && !checkingEmail,
                invalid: !emailValid && !checkingEmail && emailMessage
              }"
            >
              <i v-if="checkingEmail" class="fas fa-spinner fa-spin"></i>
              <i v-else-if="emailValid" class="fas fa-check-circle"></i>
              <i v-else-if="!emailValid && emailMessage" class="fas fa-times-circle"></i>
            </span>
          </div>
          <p
            v-if="emailMessage"
            class="email-message show"
            :class="{ valid: emailValid, invalid: !emailValid }"
          >
            {{ emailMessage }}
          </p>
        </div>

        <!-- Password -->
        <div class="mb-3 text-start">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            placeholder="Minimum 6 characters"
            @input="validatePassword"
            required
          />
          <div class="password-rules">
            <div class="strength-bar">
              <div :class="['bar', passwordStrength]"></div>
            </div>
            <small :class="['password-hint', passwordStrength]">
              {{ passwordMessage }}
            </small>
          </div>
        </div>

        <!-- Submit -->
        <button :disabled="loading" class="btn btn-primary w-100 signup-btn">
          <span v-if="!loading">Create account</span>
          <span v-else>Creating…</span>
        </button>
      </form>

      <p class="email-info mt-3 text-center">
        Keep shopping, comment, share & review products on GenZ Shop.
      </p>

      <p class="mt-3 text-center already-account">
        Already have an account?
        <router-link to="/login" class="link-gradient">Log in</router-link>
      </p>
    </div>

    <!-- Thank You Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-icon">
          <div class="modal-icon-circle">
            <i class="fas fa-user-check"></i>
          </div>
        </div>
        <h2 class="modal-title">Welcome to GenZ Shop</h2>
        <p class="modal-sub">
          Your account is ready. Personalise your profile and start exploring curated picks.
        </p>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="continueToProfile">
            Go to my profile
          </button>
          <button class="btn btn-ghost" @click="closeModal">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useSupabase'
import { useToast } from 'vue-toastification'
import { supabase } from '../composables/useSupabase'


// Utility: entropy score (rough measure of password complexity)
function passwordEntropy(pw) {
  const unique = new Set(pw).size
  return Math.log2(Math.pow(unique, pw.length))
}

// Utility: debounce
function debounce(fn, delay = 400) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', '10minutemail.com', 'tempmail.io', 'tempmail.com',
  'guerrillamail.com', 'yopmail.com', 'maildrop.cc', 'trashmail.com',
  'getnada.com', 'fakeinbox.com', 'spambog.com', 'dispostable.com',
  'example.com', 'test.com', 'example.org'
])
const SUSPICIOUS_LOCAL = [
  /^(test|asdf|user|sample|none|na|null|check|trial|demo|fake|xyz|test1|test2|test3|test4|gmail|hi|hello|fuck|chill|temp|user|sample|abc|admin|root|hello|hi|no[-_]?reply)[0-9._-]*$/i,
  /^[0-9]{5,}$/,
  /^([a-z0-9])\1{4,}$/i
]

export default {
  setup() {
    const router = useRouter()
    const { signup, user } = useAuth()
    const toast = useToast()

    const email = ref('')
    const password = ref('')
    const full_name = ref('')
    const phone = ref('')
    const gender = ref('')
    const city = ref('')

    const loading = ref(false)
    const showModal = ref(false)
    const formInvalid = ref(false)

    const nameError = ref('')
    const phoneError = ref('')
    const genderError = ref('')
    const cityError = ref('')
    const emailValid = ref(false)
    const emailMessage = ref('')
    const checkingEmail = ref(false)

    const passwordStrength = ref('weak')
    const passwordMessage = ref('Must include letters, numbers, and be at least 6 chars.')

    onMounted(() => {
      if (user.value) router.push('/profile')
    })

    const sanitizeName = () => {
      full_name.value = full_name.value
        .replace(/[^A-Za-z\s'-]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()

      if (!full_name.value) {
        nameError.value = 'Please enter your name.'
        return
      }

      const parts = full_name.value.split(' ').filter(Boolean)

      if (full_name.value.length < 3) {
        nameError.value = 'Name is too short.'
        return
      }

      const fakeNamePatterns = [
        /\b(test|demo|fake|abc|abcd|xyz|qwerty|asdf|user|sample|none|na|null|check|trial|hello|hi)\b/i,
        /^[a-z]{1,2}$/i,
        /^([a-z])\1{2,}$/i
      ]
      if (fakeNamePatterns.some(rx => rx.test(full_name.value))) {
        nameError.value = 'Please use a valid name.'
        return
      }

      if (parts.length === 1 && full_name.value.length < 4) {
        nameError.value = 'Please enter a more complete name.'
        return
      }

      nameError.value = ''
    }

    const sanitizePhone = () => {
  // keep only digits, max 10
  phone.value = phone.value.replace(/\D/g, '').slice(0, 10)

  if (!phone.value) {
    phoneError.value = 'Please enter your phone number.'
    return
  }

  // Indian mobile: 10 digits, starting with 6–9
  const indianMobileRegex = /^[6-9]\d{9}$/

  if (!indianMobileRegex.test(phone.value)) {
    phoneError.value = 'Enter a valid 10-digit Indian mobile number.'
  } else {
    phoneError.value = ''
  }
}

    const sanitizeCity = () => {
      city.value = city.value
        .replace(/[^A-Za-z\s'-]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()

      if (!city.value) {
        cityError.value = 'Please enter your city.'
        return
      }

      if (city.value.length < 2) {
        cityError.value = 'City name is too short.'
        return
      }

      cityError.value = ''
    }

    const validateGender = () => {
      if (!gender.value) {
        genderError.value = 'Please select your gender.'
      } else {
        genderError.value = ''
      }
    }

    const validatePassword = () => {
      const val = password.value
      const hasLetter = /[A-Za-z]/.test(val)
      const hasNumber = /\d/.test(val)
      const hasSymbol = /[^A-Za-z0-9]/.test(val)
      const len = val.length
      const ent = passwordEntropy(val)

      if (!hasLetter || !hasNumber || len < 6) {
        passwordStrength.value = 'weak'
        passwordMessage.value = '⚠️ Must include letters, numbers & be 6+ chars.'
      } else if (ent > 45 && hasSymbol && len >= 10) {
        passwordStrength.value = 'strong'
        passwordMessage.value = '✅ Excellent! Rock-solid password 🔐'
      } else if (ent > 30 && len >= 8) {
        passwordStrength.value = 'medium'
        passwordMessage.value = '👌 Good! Add symbols or length for more strength.'
      } else {
        passwordStrength.value = 'weak'
        passwordMessage.value = '⚠️ Password too simple.'
      }
    }

    // --- Advanced Email Validation ---
    const _checkEmail = async () => {
      const raw = email.value.trim().toLowerCase()
      emailValid.value = false
      emailMessage.value = ''
      checkingEmail.value = true

      if (!raw.includes('@')) {
        emailMessage.value = 'Please enter a valid email.'
        checkingEmail.value = false
        return
      }

      const [local, domain] = raw.split('@')
      if (!local || !domain) {
        emailMessage.value = 'Please enter a valid email.'
        checkingEmail.value = false
        return
      }

      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRx.test(raw)) {
        emailMessage.value = 'Invalid email format.'
        checkingEmail.value = false
        return
      }

      if (SUSPICIOUS_LOCAL.some(rx => rx.test(local))) {
        emailMessage.value = '🚫 Email looks like a test/demo account.'
        checkingEmail.value = false
        return
      }

      const d = domain.toLowerCase()
      if (
        DISPOSABLE_DOMAINS.has(d) ||
        /tempmail|example.com|example.org|test.com|abc.com|mailinator.com|tempmail.com|tempmail.io|10minutemail.com|yopmail.com|guerrillamail.com|trashmail.com|fakeinbox.com|dispostable.com|getnada.com|mailinator|10minutemail|guerrillamail|yopmail/i.test(
          d
        )
      ) {
        emailMessage.value = '🚫 Disposable or fake mail providers are not allowed.'
        checkingEmail.value = false
        return
      }

      if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(domain)) {
        emailMessage.value = 'Invalid domain format.'
        checkingEmail.value = false
        return
      }

      try {
        const res = await fetch('/api/verify_email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: raw })
        })
        const data = await res.json()
        if (!data.ok) {
          emailMessage.value = data.message || 'Email domain not deliverable.'
          checkingEmail.value = false
          return
        }
      } catch {
        // ignore backend issues silently
      }

      checkingEmail.value = false
      emailValid.value = true
      emailMessage.value = '✅ Verified — looks safe to use!'
    }

    const validateEmail = debounce(_checkEmail, 400)

    const onSignup = async () => {
  sanitizeName()
  sanitizePhone()
  sanitizeCity()
  validateGender()
  validatePassword()

  if (
  nameError.value ||
  phoneError.value ||
  genderError.value ||
  cityError.value ||
  passwordStrength.value === 'weak'
) {
  formInvalid.value = true
  toast.error('Please fix highlighted fields before continuing.')
  setTimeout(() => (formInvalid.value = false), 600)
  return
}

  loading.value = true
  const normalizedEmail = email.value.trim().toLowerCase()

  try {
    // 🔁 Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (emailCheckError) {
      console.warn('Email uniqueness check error:', emailCheckError.message)
    }

    if (existingEmail) {
      loading.value = false
      toast.error('This email is already registered. Please log in instead.')
      return
    }

    // 🔁 Check if phone already exists
    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone.value)
      .maybeSingle()

    if (phoneCheckError) {
      console.warn('Phone uniqueness check error:', phoneCheckError.message)
    }

    if (existingPhone) {
      loading.value = false
      toast.error('This phone number is already registered. Please log in instead.')
      return
    }

    // ⬇️ pass gender & city to signup (same as before, but with normalized email)
    await signup(
      normalizedEmail,
      password.value,
      full_name.value,
      phone.value,
      gender.value,
      city.value
    )
    showModal.value = true
  } catch (err) {
    toast.error(err.message || 'Something went wrong during signup.')
  } finally {
    loading.value = false
  }
}

    const closeModal = () => (showModal.value = false)
    const continueToProfile = () => {
      showModal.value = false
      router.push('/profile')
    }

    return {
      email,
      password,
      full_name,
      phone,
      gender,
      city,
      nameError,
      phoneError,
      genderError,
      cityError,
      emailValid,
      emailMessage,
      checkingEmail,
      passwordStrength,
      passwordMessage,
      validatePassword,
      validateEmail,
      sanitizeName,
      sanitizePhone,
      sanitizeCity,
      loading,
      onSignup,
      showModal,
      closeModal,
      continueToProfile,
      formInvalid
    }
  }
}
</script>

<style scoped lang="scss">
/* === Page Base === */
.auth-page {
  min-height: 100vh;
  padding: 2rem;
  background: radial-gradient(circle at top left, #e5e7fb 0, #f5f7fb 40%, #f9fafb 100%);
  display: flex;
}

/* Card */
.auth-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow:
    0 18px 45px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.06);
  padding: 2rem;
  width: 100%;
  max-width: 460px;
  text-align: center;
  position: relative;
  backdrop-filter: blur(18px);
}

/* shake when invalid submit */
.shake-invalid {
  animation: invalidShake 0.45s ease;
}

/* === Titles === */
.auth-title {
  font-size: 1.7rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.auth-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Gender */
.gender-options {
  display: flex;
  gap: 0.5rem;
}

.gender-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.gender-pill input {
  display: none;
}

.gender-pill span {
  pointer-events: none;
}

.gender-pill.active {
  border-color: #4f46e5;
  background-color: #eef2ff;
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.1);
}


/* === Trust Badge === */
.trust-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: linear-gradient(120deg, #eef2ff, #f5f3ff);
  border: 1px solid rgba(129, 140, 248, 0.3);
}

.trust-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 0, #4f46e5, #6366f1);
  color: #f9fafb;
  font-size: 0.85rem;
}

.trust-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.trust-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}

.trust-sub {
  font-size: 0.75rem;
  color: #6b7280;
}

/* === Email Validation === */
.email-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.email-status {
  position: absolute;
  right: 12px;
  font-size: 1.1rem;
  transition: all 0.25s ease;
  opacity: 0;
  transform: scale(0.85);
}

.email-status.checking {
  color: #a855f7;
  opacity: 1;
  transform: scale(1);
}

.email-status.valid {
  color: #16a34a;
  opacity: 1;
  transform: scale(1.05);
}

.email-status.invalid {
  color: #dc2626;
  opacity: 1;
  transform: scale(1);
}

/* === Email Message === */
.email-message {
  font-size: 0.8rem;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.email-message.show {
  opacity: 1;
}

.email-message.valid {
  color: #15803d;
}

.email-message.invalid {
  color: #b91c1c;
}

/* small field error */
.field-error {
  display: block;
  margin-top: 4px;
  color: #b91c1c;
  font-size: 0.8rem;
}

/* === Password strength bar === */
.password-rules {
  margin-top: 6px;
}
.strength-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 5px;
}
.strength-bar .bar {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 999px;
}
.bar.weak {
  width: 33%;
  background: #ef4444;
}
.bar.medium {
  width: 66%;
  background: #f59e0b;
}
.bar.strong {
  width: 100%;
  background: #16a34a;
}

.password-hint {
  font-size: 0.8rem;
}
.password-hint.weak {
  color: #b91c1c;
}
.password-hint.medium {
  color: #b45309;
}
.password-hint.strong {
  color: #15803d;
}

/* === Dynamic Border Feedback === */
.form-control {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  font-size: 0.9rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  background-color: #f9fafb;
}

.form-control:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.12);
  background-color: #ffffff;
}

.border-checking {
  border-color: #a855f7 !important;
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.18);
}

.border-valid {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 1px rgba(22, 163, 74, 0.16);
}

.border-invalid {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.16);
}

/* === Button & Link === */
.btn-primary {
  background: linear-gradient(120deg, #4f46e5, #7c3aed);
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(88, 80, 236, 0.28);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.signup-btn {
  margin-top: 0.5rem;
}

.link-gradient {
  background: linear-gradient(120deg, #4f46e5, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 500;
  text-decoration: none;
}

.link-gradient:hover {
  text-decoration: underline;
}

.email-info {
  font-size: 0.8rem;
  color: #6b7280;
}

.already-account {
  font-size: 0.9rem;
  color: #4b5563;
}

/* === Modal === */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  z-index: 2000;
}

.modal-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.8rem 1.6rem 1.6rem;
  width: 90%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.4);
  position: relative;
  animation: popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.modal-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: radial-gradient(circle at 10% 0, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f9fafb;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.45);
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.4rem;
}

.modal-sub {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

/* modal actions */
.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.btn-ghost {
  background: transparent;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.7rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4b5563;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.btn-ghost:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

/* === Keyframes === */
@keyframes invalidShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

@keyframes popIn {
  0% {
    transform: translateY(12px) scale(0.96);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* === Responsive === */
@media (max-width: 600px) {
  .auth-page {
    padding: 1.25rem;
  }
  .auth-card {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }
  .auth-title {
    font-size: 1.5rem;
  }
}
</style>
