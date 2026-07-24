import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PartnerSignUp.module.css";
import {
  registerPartner,
  sendSignupOtp,
  verifySignupOtp,
  checkBusinessNameAvailability,
  checkPhoneAvailability,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "../../api/authService";
import { Link, useNavigate } from "react-router-dom";
import AddressForm from "../../components/partnercomponent/AddressForm";

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN_SECONDS = 30;

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "+1",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  businessType: "",
  businessName: "",
  businessDocument: null,
  buildingNo: "",
  street: "",
  city: "",
  district: "",
  state: "",
  country: "",
  zipCode: "",
};

const BUSINESS_TYPES = [
  { value: "Salon", label: "Salon", icon: "✂️" },
  { value: "Hospital", label: "Hospital", icon: "🏥" },
  { value: "Restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "University", label: "University", icon: "🎓" },
];

// A practical, curated set of dial codes (not the full ISO-3166 list) —
// covers the regions this app is most likely to see partners sign up
// from. Values are dial codes, not countries, so a couple of codes
// intentionally repeat under different country names (e.g. +1 for both
// the US and Canada) — that's fine, the backend only stores the code.
// `iso` is the ISO-3166-1 alpha-2 code, used to look up each country's
// flag icon (see flagIconUrl below).
const COUNTRY_CODES = [
  { code: "+1", country: "United States", iso: "US" },
  { code: "+1", country: "Canada", iso: "CA" },
  { code: "+44", country: "United Kingdom", iso: "GB" },
  { code: "+91", country: "India", iso: "IN" },
  { code: "+61", country: "Australia", iso: "AU" },
  { code: "+64", country: "New Zealand", iso: "NZ" },
  { code: "+49", country: "Germany", iso: "DE" },
  { code: "+33", country: "France", iso: "FR" },
  { code: "+34", country: "Spain", iso: "ES" },
  { code: "+39", country: "Italy", iso: "IT" },
  { code: "+31", country: "Netherlands", iso: "NL" },
  { code: "+32", country: "Belgium", iso: "BE" },
  { code: "+41", country: "Switzerland", iso: "CH" },
  { code: "+43", country: "Austria", iso: "AT" },
  { code: "+46", country: "Sweden", iso: "SE" },
  { code: "+47", country: "Norway", iso: "NO" },
  { code: "+45", country: "Denmark", iso: "DK" },
  { code: "+358", country: "Finland", iso: "FI" },
  { code: "+353", country: "Ireland", iso: "IE" },
  { code: "+351", country: "Portugal", iso: "PT" },
  { code: "+30", country: "Greece", iso: "GR" },
  { code: "+48", country: "Poland", iso: "PL" },
  { code: "+420", country: "Czech Republic", iso: "CZ" },
  { code: "+36", country: "Hungary", iso: "HU" },
  { code: "+40", country: "Romania", iso: "RO" },
  { code: "+7", country: "Russia", iso: "RU" },
  { code: "+380", country: "Ukraine", iso: "UA" },
  { code: "+90", country: "Turkey", iso: "TR" },
  { code: "+971", country: "United Arab Emirates", iso: "AE" },
  { code: "+966", country: "Saudi Arabia", iso: "SA" },
  { code: "+974", country: "Qatar", iso: "QA" },
  { code: "+965", country: "Kuwait", iso: "KW" },
  { code: "+973", country: "Bahrain", iso: "BH" },
  { code: "+968", country: "Oman", iso: "OM" },
  { code: "+972", country: "Israel", iso: "IL" },
  { code: "+20", country: "Egypt", iso: "EG" },
  { code: "+27", country: "South Africa", iso: "ZA" },
  { code: "+234", country: "Nigeria", iso: "NG" },
  { code: "+254", country: "Kenya", iso: "KE" },
  { code: "+233", country: "Ghana", iso: "GH" },
  { code: "+92", country: "Pakistan", iso: "PK" },
  { code: "+880", country: "Bangladesh", iso: "BD" },
  { code: "+94", country: "Sri Lanka", iso: "LK" },
  { code: "+977", country: "Nepal", iso: "NP" },
  { code: "+86", country: "China", iso: "CN" },
  { code: "+81", country: "Japan", iso: "JP" },
  { code: "+82", country: "South Korea", iso: "KR" },
  { code: "+852", country: "Hong Kong", iso: "HK" },
  { code: "+65", country: "Singapore", iso: "SG" },
  { code: "+60", country: "Malaysia", iso: "MY" },
  { code: "+66", country: "Thailand", iso: "TH" },
  { code: "+63", country: "Philippines", iso: "PH" },
  { code: "+84", country: "Vietnam", iso: "VN" },
  { code: "+62", country: "Indonesia", iso: "ID" },
  { code: "+886", country: "Taiwan", iso: "TW" },
  { code: "+52", country: "Mexico", iso: "MX" },
  { code: "+55", country: "Brazil", iso: "BR" },
  { code: "+54", country: "Argentina", iso: "AR" },
  { code: "+56", country: "Chile", iso: "CL" },
  { code: "+57", country: "Colombia", iso: "CO" },
  { code: "+51", country: "Peru", iso: "PE" },
];

const VALID_COUNTRY_CODES = new Set(COUNTRY_CODES.map((c) => c.code));

// Flag "emoji" (built from Unicode regional-indicator letter pairs) don't
// actually render as flags on Windows — most Windows fonts/browsers have no
// flag glyphs and fall back to showing the two bare letters (e.g. "IN"
// instead of 🇮🇳), which is exactly what a plain emoji-based approach
// produced here. Real flag images render identically on every OS, so we
// pull small flag icons from flagcdn.com (a free, widely-used public CDN)
// instead, keyed by the same ISO-3166-1 alpha-2 code.
function flagIconUrl(iso, retina = false) {
  const size = retina ? "48x36" : "24x18";
  return `https://flagcdn.com/${size}/${iso.toLowerCase()}.png`;
}

// Mirrors the backend's validation exactly (see
// PartnerUserSignUpRequest.java) so the vast majority of validation errors
// are caught client-side, before a round trip to the server — the previous
// version only checked "8+ characters" for password and left every other
// field's pattern unenforced, so users could pass client validation and
// still get a confusing 400 back from the API.
const PATTERNS = {
  name: /^[A-Za-z ]{1,44}$/,
  email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  phone: /^\d{10}$/,
  businessName: /^[A-Za-z' ]{1,44}$/,
  buildingNo: /^[A-Za-z0-9\-_()/]{1,45}$/,
  street: /^[A-Za-z0-9' ]{1,45}$/,
  city: /^[A-Za-z.' ]{1,44}$/,
  district: /^[A-Za-z' ]{1,44}$/,
  stateOrCountry: /^[A-Za-z ]{1,44}$/,
  zipCode: /^[A-Za-z0-9]{1,45}$/,
};

// Name/address-style fields where a lowercase letter at the start of the
// value (or after a space) gets auto-capitalized as the user types — e.g.
// "new york" -> "New York", "test one" -> "Test One". Deliberately excludes
// email, password, phone, and businessType (a dropdown, not free text)
// since capitalizing those wouldn't make sense.
const AUTO_CAPITALIZE_FIELDS = new Set([
  "firstName",
  "lastName",
  "businessName",
  "buildingNo",
  "street",
  "city",
  "district",
  "state",
  "country",
  "zipCode",
]);

// Enforces proper case, not just "capitalize the first letter": every
// word's first character is forced uppercase and everything after it is
// forced lowercase, so typing "TEST one" or "tEST ONE" both normalize to
// "Test One" instead of preserving whatever case the rest happened to be.
function capitalizeWords(value) {
  return value
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word,
    )
    .join(" ");
}

// Business Document — optional proof-of-legitimacy upload (e.g. a business
// license or registration certificate). Kept client-side only for now: the
// signup API takes a plain JSON body, so wiring this into the actual
// registration request needs a backend change that's out of scope here.
const BUSINESS_DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const BUSINESS_DOCUMENT_ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const BUSINESS_DOCUMENT_MAX_SIZE_MB = 5;

const PASSWORD_CHECKS = [
  { key: "length", label: "8-20 characters", test: (p) => p.length >= 8 && p.length <= 20 },
  { key: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "digit", label: "One number", test: (p) => /\d/.test(p) },
  { key: "special", label: "One special character (@#$%^&+=!)", test: (p) => /[@#$%^&+=!]/.test(p) },
];

function validate(form) {
  const errors = {};
  if (!form.firstName) errors.firstName = "First name is required";
  else if (!PATTERNS.name.test(form.firstName))
    errors.firstName = "Letters and spaces only";

  if (!form.lastName) errors.lastName = "Last name is required";
  else if (!PATTERNS.name.test(form.lastName))
    errors.lastName = "Letters and spaces only";

  if (!form.email) errors.email = "Email is required";
  else if (!PATTERNS.email.test(form.email)) errors.email = "Enter a valid email address";

  if (!form.countryCode) errors.countryCode = "Select a country code";
  else if (!VALID_COUNTRY_CODES.has(form.countryCode))
    errors.countryCode = "Select a valid country code";

  if (!form.phoneNumber) errors.phoneNumber = "Phone number is required";
  else if (!PATTERNS.phone.test(form.phoneNumber))
    errors.phoneNumber = "Must be exactly 10 digits";

  if (!form.password) errors.password = "Password is required";
  else if (!PASSWORD_CHECKS.every((c) => c.test(form.password)))
    errors.password = "Password doesn't meet all the requirements below";

  if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (form.confirmPassword !== form.password)
    errors.confirmPassword = "Passwords do not match";

  if (!form.businessType) errors.businessType = "Select a business type";

  if (!form.businessName) errors.businessName = "Business name is required";
  else if (!PATTERNS.businessName.test(form.businessName))
    errors.businessName = "Letters, spaces, and apostrophes only";

  if (!form.buildingNo) errors.buildingNo = "Building number is required";
  else if (!PATTERNS.buildingNo.test(form.buildingNo))
    errors.buildingNo = "Letters, numbers, - _ ( ) / only";

  if (!form.street) errors.street = "Street is required";
  else if (!PATTERNS.street.test(form.street))
    errors.street = "Letters, numbers, and spaces only";

  if (!form.city) errors.city = "City is required";
  else if (!PATTERNS.city.test(form.city)) errors.city = "Invalid city name";

  if (form.district && !PATTERNS.district.test(form.district))
    errors.district = "Letters and spaces only";

  if (!form.state) errors.state = "State is required";
  else if (!PATTERNS.stateOrCountry.test(form.state))
    errors.state = "Letters and spaces only";

  if (!form.country) errors.country = "Country is required";
  else if (!PATTERNS.stateOrCountry.test(form.country))
    errors.country = "Letters and spaces only";

  if (!form.zipCode) errors.zipCode = "Zip code is required";
  else if (!PATTERNS.zipCode.test(form.zipCode))
    errors.zipCode = "Letters and numbers only";

  return errors;
}

const SECTION_FIELDS = {
  1: [
    "firstName",
    "lastName",
    "email",
    "countryCode",
    "phoneNumber",
    "password",
    "confirmPassword",
  ],
  2: ["businessType", "businessName"],
  3: [
    "buildingNo",
    "street",
    "city",
    "district",
    "state",
    "country",
    "zipCode",
  ],
};

const TOTAL_STEPS = 3;

const STEP_META = {
  1: {
    title: "Personal Information",
    headline: "Tell us about yourself",
    nextLabel: "Next",
  },
  2: {
    title: "Business Information",
    headline: "Tell us about your business",
    nextLabel: "Next",
  },
  3: {
    title: "Business Address",
    headline: "Where's your business located?",
    nextLabel: "Create Partner Account",
  },
};

export default function PartnerSignUp() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Country code combobox (step 1) — a custom searchable dropdown replaces
  // the native <select> because native selects can't show a flag+text
  // option layout or a real filtered list as you type (only single-key
  // jump-to-match).
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  // Where to paint the dropdown, in viewport coordinates (see
  // openCountryDropdown) — computed from the trigger button's position so
  // the dropdown can use position:fixed instead of position:absolute.
  // An absolutely-positioned dropdown that pokes past the bottom of the
  // viewport still adds to the page's total scrollable height, which is
  // what was making the whole page grow a scrollbar every time it opened;
  // position:fixed is anchored to the viewport itself so it never does that.
  const [countryDropdownPos, setCountryDropdownPos] = useState(null);
  const countryPickerRef = useRef(null);
  const countryTriggerRef = useRef(null);
  const countrySearchInputRef = useRef(null);

  // Business Type combobox (step 2) — same reasoning as the country-code
  // picker: a native <select> kept showing a stray native-rendering
  // artifact on Windows Chrome that CSS resets (appearance:none,
  // background-image:none, etc.) couldn't fully suppress, so this is a
  // fully custom dropdown instead, with no native <select> involved at all.
  const [businessTypeDropdownOpen, setBusinessTypeDropdownOpen] = useState(false);
  const [businessTypeDropdownPos, setBusinessTypeDropdownPos] = useState(null);
  const businessTypePickerRef = useRef(null);
  const businessTypeTriggerRef = useRef(null);

  // Email OTP verification (step 1) — idle | sending | sent | verifying | verified
  const [otpState, setOtpState] = useState("idle");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [otpVerifiedEmail, setOtpVerifiedEmail] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpBoxRefs = useRef([]);
  const cooldownTimerRef = useRef(null);

  // Phone OTP verification (step 1) — same shape as email OTP above.
  // idle | sending | sent | verifying | verified
  const [phoneOtpState, setPhoneOtpState] = useState("idle");
  const [phoneOtpValue, setPhoneOtpValue] = useState("");
  const [phoneOtpError, setPhoneOtpError] = useState(null);
  const [phoneOtpVerifiedNumber, setPhoneOtpVerifiedNumber] = useState(null);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const phoneOtpBoxRefs = useRef([]);
  const phoneCooldownTimerRef = useRef(null);

  // "Phone number already in use" check — same on-blur/on-Next pattern as
  // the business-name check below, so an already-registered number is
  // flagged before the user even taps Verify. idle | checking | taken | available
  const [phoneNumberStatus, setPhoneNumberStatus] = useState("idle");
  const phoneNumberCheckedFor = useRef("");
  const phoneNumberCheckSeq = useRef(0);

  // "Business name already taken" check — NOT run on every keystroke.
  // Only fires when the user leaves the field (onBlur) or clicks Next.
  // idle | checking | taken | available
  const [businessNameStatus, setBusinessNameStatus] = useState("idle");
  const businessNameCheckedFor = useRef(""); // last name a check completed for
  const businessNameCheckSeq = useRef(0);
  const businessDocumentInputRef = useRef(null);

  const navigate = useNavigate();

  const isEmailVerified = otpState === "verified" && otpVerifiedEmail === form.email;
  const isPhoneVerified =
    phoneOtpState === "verified" && phoneOtpVerifiedNumber === form.phoneNumber;

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (phoneCooldownTimerRef.current) clearInterval(phoneCooldownTimerRef.current);
    };
  }, []);

  // Any further edit to the name invalidates the previous check result —
  // "Retry" is not the goal here, just making sure a stale "taken"/"available"
  // badge never lingers on a name the user has since changed.
  useEffect(() => {
    if (form.businessName.trim() !== businessNameCheckedFor.current) {
      setBusinessNameStatus("idle");
    }
  }, [form.businessName]);

  // Runs the availability check once, on demand (blur or Next click) rather
  // than per-keystroke. A sequence ref guards against a stale, slower
  // response landing after a newer check and overwriting current status.
  // Returns the resolved status so callers (like handleNext) can act on it
  // immediately instead of racing the state update.
  async function checkBusinessNameNow() {
    const name = form.businessName.trim();
    if (!name || !PATTERNS.businessName.test(name)) {
      setBusinessNameStatus("idle");
      return "idle";
    }
    if (businessNameCheckedFor.current === name && businessNameStatus !== "idle") {
      return businessNameStatus; // already checked this exact value
    }

    setBusinessNameStatus("checking");
    const seq = ++businessNameCheckSeq.current;

    try {
      const res = await checkBusinessNameAvailability(name);
      if (businessNameCheckSeq.current !== seq) return "checking"; // superseded
      const available = res?.data?.data?.available;
      const status = available === false ? "taken" : "available";
      businessNameCheckedFor.current = name;
      setBusinessNameStatus(status);
      return status;
    } catch {
      if (businessNameCheckSeq.current !== seq) return "checking";
      setBusinessNameStatus("idle");
      return "idle";
    }
  }

  function handleBusinessNameBlur() {
    checkBusinessNameNow();
  }

  // Same on-blur/on-Next "already in use" check as business name, but for
  // Phone Number — kept as a lighter-weight companion to the OTP flow
  // below: this catches an already-registered number the moment the user
  // leaves the field, rather than waiting for them to tap Verify and get
  // rejected there.
  useEffect(() => {
    if (form.phoneNumber.trim() !== phoneNumberCheckedFor.current) {
      setPhoneNumberStatus("idle");
    }
  }, [form.phoneNumber]);

  async function checkPhoneNumberNow() {
    const phoneNumber = form.phoneNumber.trim();
    if (phoneNumber.length !== 10) {
      setPhoneNumberStatus("idle");
      return "idle";
    }
    if (phoneNumberCheckedFor.current === phoneNumber && phoneNumberStatus !== "idle") {
      return phoneNumberStatus;
    }

    setPhoneNumberStatus("checking");
    const seq = ++phoneNumberCheckSeq.current;

    try {
      const res = await checkPhoneAvailability(phoneNumber);
      if (phoneNumberCheckSeq.current !== seq) return "checking";
      const available = res?.data?.data?.available;
      const status = available === false ? "taken" : "available";
      phoneNumberCheckedFor.current = phoneNumber;
      setPhoneNumberStatus(status);
      return status;
    } catch {
      if (phoneNumberCheckSeq.current !== seq) return "checking";
      setPhoneNumberStatus("idle");
      return "idle";
    }
  }

  function handlePhoneNumberBlur() {
    checkPhoneNumberNow();
  }

  // Business Document upload — a plain <input type="file"> is kept off-
  // screen and triggered via the styled "Choose file" button, since native
  // file inputs render inconsistently across browsers (same reasoning as
  // the custom Business Type dropdown).
  function handleBusinessDocumentChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (!BUSINESS_DOCUMENT_ACCEPTED_TYPES.includes(file.type)) {
      setErrors((s) => ({
        ...s,
        businessDocument: "Please upload a PDF, JPG, PNG, or Word document",
      }));
      e.target.value = "";
      return;
    }
    if (file.size > BUSINESS_DOCUMENT_MAX_SIZE_MB * 1024 * 1024) {
      setErrors((s) => ({
        ...s,
        businessDocument: `File is too large — max ${BUSINESS_DOCUMENT_MAX_SIZE_MB}MB`,
      }));
      e.target.value = "";
      return;
    }

    setErrors((s) => ({ ...s, businessDocument: undefined }));
    setForm((s) => ({ ...s, businessDocument: file }));
  }

  function handleRemoveBusinessDocument() {
    setForm((s) => ({ ...s, businessDocument: null }));
    setErrors((s) => ({ ...s, businessDocument: undefined }));
    if (businessDocumentInputRef.current) businessDocumentInputRef.current.value = "";
  }

  // Closes the country dropdown on outside click, same pattern used by
  // MapWithSearchBarMarker's address suggestions list. Also closes it on
  // any scroll/resize (capture:true catches scrolling inside nested
  // containers too) — since the dropdown is positioned from a one-time
  // measurement of the trigger's screen position, letting the page scroll
  // while it's open would leave it floating in the wrong spot.
  useEffect(() => {
    if (!countryDropdownOpen) return;
    function handleClickOutside(e) {
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target)) {
        closeCountryDropdown();
      }
    }
    function handleScrollOrResize() {
      closeCountryDropdown();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [countryDropdownOpen]);

  const selectedCountry =
    COUNTRY_CODES.find((c) => c.code === form.countryCode) || COUNTRY_CODES[0];

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) => c.country.toLowerCase().startsWith(q) || c.code.includes(q),
    );
  }, [countrySearch]);

  // Dropdown box dimensions, kept in sync with the fixed size set in
  // PartnerSignUp.module.css (.countryDropdown).
  const COUNTRY_DROPDOWN_WIDTH = 260;
  const COUNTRY_DROPDOWN_HEIGHT = 280;
  const COUNTRY_DROPDOWN_GAP = 4;

  function openCountryDropdown() {
    const rect = countryTriggerRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp =
        spaceBelow < COUNTRY_DROPDOWN_HEIGHT + COUNTRY_DROPDOWN_GAP &&
        rect.top > COUNTRY_DROPDOWN_HEIGHT + COUNTRY_DROPDOWN_GAP;
      const maxLeft = window.innerWidth - COUNTRY_DROPDOWN_WIDTH - COUNTRY_DROPDOWN_GAP;
      setCountryDropdownPos({
        top: openUp
          ? rect.top - COUNTRY_DROPDOWN_HEIGHT - COUNTRY_DROPDOWN_GAP
          : rect.bottom + COUNTRY_DROPDOWN_GAP,
        left: Math.max(COUNTRY_DROPDOWN_GAP, Math.min(rect.left, maxLeft)),
      });
    }
    setCountryDropdownOpen(true);
    setCountrySearch("");
    setTimeout(() => countrySearchInputRef.current?.focus(), 0);
  }

  function closeCountryDropdown() {
    setCountryDropdownOpen(false);
    setCountrySearch("");
    setCountryDropdownPos(null);
  }

  function selectCountryCode(code) {
    setForm((s) => ({ ...s, countryCode: code }));
    setErrors((s) => ({ ...s, countryCode: undefined }));
    setMessage(null);
    closeCountryDropdown();
  }

  // Same outside-click/scroll-close pattern as the country dropdown.
  useEffect(() => {
    if (!businessTypeDropdownOpen) return;
    function handleClickOutside(e) {
      if (
        businessTypePickerRef.current &&
        !businessTypePickerRef.current.contains(e.target)
      ) {
        closeBusinessTypeDropdown();
      }
    }
    function handleScrollOrResize() {
      closeBusinessTypeDropdown();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [businessTypeDropdownOpen]);

  const selectedBusinessType = BUSINESS_TYPES.find((bt) => bt.value === form.businessType);

  const BUSINESS_TYPE_DROPDOWN_GAP = 4;

  function openBusinessTypeDropdown() {
    const rect = businessTypeTriggerRef.current?.getBoundingClientRect();
    if (rect) {
      const dropdownHeight = BUSINESS_TYPES.length * 44 + 2 * 8; // rows + padding, matches CSS
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp =
        spaceBelow < dropdownHeight + BUSINESS_TYPE_DROPDOWN_GAP &&
        rect.top > dropdownHeight + BUSINESS_TYPE_DROPDOWN_GAP;
      setBusinessTypeDropdownPos({
        top: openUp
          ? rect.top - dropdownHeight - BUSINESS_TYPE_DROPDOWN_GAP
          : rect.bottom + BUSINESS_TYPE_DROPDOWN_GAP,
        left: rect.left,
        width: rect.width,
      });
    }
    setBusinessTypeDropdownOpen(true);
  }

  function closeBusinessTypeDropdown() {
    setBusinessTypeDropdownOpen(false);
    setBusinessTypeDropdownPos(null);
  }

  function selectBusinessType(value) {
    setForm((s) => ({ ...s, businessType: value }));
    setErrors((s) => ({ ...s, businessType: undefined }));
    setMessage(null);
    closeBusinessTypeDropdown();
  }

  function startResendCooldown() {
    setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function onChange(e) {
    const { name, value } = e.target;
    const nextValue = AUTO_CAPITALIZE_FIELDS.has(name)
      ? capitalizeWords(value)
      : value;
    setForm((s) => ({ ...s, [name]: nextValue }));
    setErrors((s) => ({ ...s, [name]: undefined }));
    setMessage(null);
  }

  // Editing the email after any OTP activity invalidates that activity —
  // the code was sent to (or verified for) a specific address.
  function handleEmailChange(e) {
    onChange(e);
    if (otpState !== "idle") {
      setOtpState("idle");
      setOtpValue("");
      setOtpError(null);
    }
  }

  // Lets the user unlock an already-verified email to edit it — they'll
  // need to re-verify whatever they type next.
  function handleChangeEmail() {
    setOtpState("idle");
    setOtpValue("");
    setOtpError(null);
    setOtpVerifiedEmail(null);
    setTimeout(() => document.querySelector('[name="email"]')?.focus(), 0);
  }

  async function handleSendOtp() {
    if (!PATTERNS.email.test(form.email)) {
      setErrors((s) => ({ ...s, email: "Enter a valid email address" }));
      scrollToField("email");
      return;
    }
    if (otpState === "sending" || resendCooldown > 0) return;
    setOtpState("sending");
    setOtpError(null);
    try {
      await sendSignupOtp(form.email);
      setOtpValue("");
      setOtpState("sent");
      startResendCooldown();
      setTimeout(() => otpBoxRefs.current[0]?.focus(), 0);
    } catch (err) {
      setOtpState("idle");
      setOtpError(
        err?.response?.data?.message || "Couldn't send the code. Please try again.",
      );
    }
  }

  async function handleVerifyOtp(codeOverride) {
    const code = codeOverride ?? otpValue;
    if (code.length !== OTP_LENGTH) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    setOtpState("verifying");
    setOtpError(null);
    try {
      await verifySignupOtp(form.email, code);
      setOtpState("verified");
      setOtpVerifiedEmail(form.email);
    } catch (err) {
      setOtpState("sent");
      setOtpError(err?.response?.data?.message || "Incorrect code. Please try again.");
    }
  }

  function handleOtpDigitChange(index, rawValue) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = otpValue.split("");
    next[index] = digit || "";
    const joined = next.join("").slice(0, OTP_LENGTH);
    setOtpValue(joined);
    setOtpError(null);

    if (digit && index < OTP_LENGTH - 1) {
      otpBoxRefs.current[index + 1]?.focus();
    }
    if (joined.length === OTP_LENGTH && joined.split("").every(Boolean)) {
      handleVerifyOtp(joined);
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      otpBoxRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setOtpValue(pasted);
    setOtpError(null);
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    otpBoxRefs.current[lastIndex]?.focus();
    if (pasted.length === OTP_LENGTH) {
      handleVerifyOtp(pasted);
    }
  }

  // ----------------------------------------------------------------
  // Phone OTP — mirrors the email OTP block above exactly, just backed by
  // sendPhoneOtp/verifyPhoneOtp and the phone-specific state declared near
  // the top of the component.
  // ----------------------------------------------------------------

  function startPhoneResendCooldown() {
    setPhoneResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    if (phoneCooldownTimerRef.current) clearInterval(phoneCooldownTimerRef.current);
    phoneCooldownTimerRef.current = setInterval(() => {
      setPhoneResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(phoneCooldownTimerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // Editing the phone number after any OTP activity invalidates that
  // activity — the code was sent to (or verified for) a specific number.
  function handlePhoneNumberChange(e) {
    onChange(e);
    if (phoneOtpState !== "idle") {
      setPhoneOtpState("idle");
      setPhoneOtpValue("");
      setPhoneOtpError(null);
    }
  }

  // Lets the user unlock an already-verified phone number to edit it —
  // they'll need to re-verify whatever they type next.
  function handleChangePhoneNumber() {
    setPhoneOtpState("idle");
    setPhoneOtpValue("");
    setPhoneOtpError(null);
    setPhoneOtpVerifiedNumber(null);
    setTimeout(() => document.querySelector('[name="phoneNumber"]')?.focus(), 0);
  }

  async function handleSendPhoneOtp() {
    if (form.phoneNumber.length !== 10) {
      setErrors((s) => ({ ...s, phoneNumber: "Enter a 10-digit phone number" }));
      scrollToField("phoneNumber");
      return;
    }
    // Same live check the blur handler runs — catches an already-registered
    // number even if the user never actually left the field (e.g. pasted
    // the number and immediately clicked Verify).
    const status = await checkPhoneNumberNow();
    if (status === "taken") {
      scrollToField("phoneNumber");
      return;
    }
    if (phoneOtpState === "sending" || phoneResendCooldown > 0) return;
    setPhoneOtpState("sending");
    setPhoneOtpError(null);
    try {
      await sendPhoneOtp(form.phoneNumber);
      setPhoneOtpValue("");
      setPhoneOtpState("sent");
      startPhoneResendCooldown();
      setTimeout(() => phoneOtpBoxRefs.current[0]?.focus(), 0);
    } catch (err) {
      setPhoneOtpState("idle");
      setPhoneOtpError(
        err?.response?.data?.message || "Couldn't send the code. Please try again.",
      );
    }
  }

  async function handleVerifyPhoneOtp(codeOverride) {
    const code = codeOverride ?? phoneOtpValue;
    if (code.length !== OTP_LENGTH) {
      setPhoneOtpError("Enter the 6-digit code.");
      return;
    }
    setPhoneOtpState("verifying");
    setPhoneOtpError(null);
    try {
      await verifyPhoneOtp(form.phoneNumber, code);
      setPhoneOtpState("verified");
      setPhoneOtpVerifiedNumber(form.phoneNumber);
    } catch (err) {
      setPhoneOtpState("sent");
      setPhoneOtpError(err?.response?.data?.message || "Incorrect code. Please try again.");
    }
  }

  function handlePhoneOtpDigitChange(index, rawValue) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = phoneOtpValue.split("");
    next[index] = digit || "";
    const joined = next.join("").slice(0, OTP_LENGTH);
    setPhoneOtpValue(joined);
    setPhoneOtpError(null);

    if (digit && index < OTP_LENGTH - 1) {
      phoneOtpBoxRefs.current[index + 1]?.focus();
    }
    if (joined.length === OTP_LENGTH && joined.split("").every(Boolean)) {
      handleVerifyPhoneOtp(joined);
    }
  }

  function handlePhoneOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !phoneOtpValue[index] && index > 0) {
      phoneOtpBoxRefs.current[index - 1]?.focus();
    }
  }

  function handlePhoneOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setPhoneOtpValue(pasted);
    setPhoneOtpError(null);
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    phoneOtpBoxRefs.current[lastIndex]?.focus();
    if (pasted.length === OTP_LENGTH) {
      handleVerifyPhoneOtp(pasted);
    }
  }

  // Section-level completion, used to drive the progress indicator — purely
  // a visual affordance so a long, three-part form doesn't feel like an
  // undifferentiated wall of inputs.
  const sectionStatus = useMemo(() => {
    const status = {};
    for (const [section, fields] of Object.entries(SECTION_FIELDS)) {
      const required = fields.filter((f) => f !== "district");
      status[section] = required.every((f) => String(form[f] || "").trim());
    }
    return status;
  }, [form]);

  function scrollToField(name) {
    document
      .querySelector(`[name="${name}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Only validates the fields that belong to the given step, so "Next"
  // never blocks on errors from a section the user hasn't reached yet.
  function validateStep(step) {
    const allErrors = validate(form);
    const fields = SECTION_FIELDS[step];
    const stepErrors = {};
    for (const f of fields) {
      if (allErrors[f]) stepErrors[f] = allErrors[f];
    }
    return stepErrors;
  }

  async function handleNext() {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      scrollToField(Object.keys(stepErrors)[0]);
      return;
    }
    if (currentStep === 1 && !isEmailVerified) {
      setOtpError((prev) => prev || "Please verify your email address to continue.");
      scrollToField("email");
      return;
    }
    if (currentStep === 1 && !isPhoneVerified) {
      setPhoneOtpError((prev) => prev || "Please verify your phone number to continue.");
      scrollToField("phoneNumber");
      return;
    }
    if (currentStep === 2) {
      // Covers the case where the user never blurred the field (e.g.
      // clicked straight from Business Type into Next) — make sure we have
      // a fresh answer before letting them proceed.
      const status = await checkBusinessNameNow();
      if (status === "taken") {
        scrollToField("businessName");
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Lets the user jump back to an already-visited step via the progress
  // dots. Jumping forward past the current step is disabled — those
  // sections haven't been validated yet.
  function goToStep(step) {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Final-submit safety net: PartnerUserServiceImpl can still reject a
  // phone/business-name/email as "already in use" even after the live
  // checks passed (e.g. someone else grabbed it in the seconds between
  // checking and submitting). That comes back as a flat message rather
  // than a field-keyed error map, so this maps it to whichever field's
  // popover it's actually about — reusing the same "taken" popovers the
  // live checks already show — instead of only a generic banner at the
  // top of the form. Returns true if it found a field to attach to.
  function applyServerErrorToField(message) {
    if (!message) return false;
    const m = message.toLowerCase();
    if (m.includes("phone")) {
      setPhoneNumberStatus("taken");
      phoneNumberCheckedFor.current = form.phoneNumber.trim();
      setCurrentStep(1);
      setTimeout(() => scrollToField("phoneNumber"), 0);
      return true;
    }
    if (m.includes("business name")) {
      setBusinessNameStatus("taken");
      businessNameCheckedFor.current = form.businessName.trim();
      setCurrentStep(2);
      setTimeout(() => scrollToField("businessName"), 0);
      return true;
    }
    if (m.includes("email")) {
      setErrors((prev) => ({ ...prev, email: message }));
      setCurrentStep(1);
      setTimeout(() => scrollToField("email"), 0);
      return true;
    }
    return false;
  }

  async function onSubmit(e) {
    e.preventDefault();

    // On steps 1-2, the "submit" event (button click or Enter key) just
    // advances the wizard — the real API call only happens on the final step.
    if (currentStep < TOTAL_STEPS) {
      handleNext();
      return;
    }

    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) {
      // Jump back to whichever step actually owns the first invalid field,
      // since only the active step's fields are rendered right now.
      const firstErrorField = Object.keys(v)[0];
      const stepWithError = Object.entries(SECTION_FIELDS).find(([, fields]) =>
        fields.includes(firstErrorField),
      )?.[0];
      if (stepWithError) setCurrentStep(Number(stepWithError));
      setTimeout(() => scrollToField(firstErrorField), 0);
      return;
    }
    setSubmitting(true);
    try {
      // confirmPassword only exists to validate client-side, and
      // businessDocument isn't wired to the API yet (it's a File object,
      // and the signup endpoint currently takes plain JSON) — neither has
      // a place in the backend DTO.
      const { confirmPassword, businessDocument, ...payload } = form;
      const res = await registerPartner(payload);
      if (res?.data?.success) {
        navigate("/partner/signup/success", {
          state: { email: form.email, emailPreVerified: isEmailVerified },
        });
      } else {
        const text = res?.data?.message || "Registration failed";
        setMessage({ type: "error", text });
      }
    } catch (err) {
      const responseData = err?.response?.data;

      // Handle validation errors from backend
      if (responseData && responseData.data && typeof responseData.data === "object") {
        const fieldErrors = { ...responseData.data };
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setMessage(null);
          const stepWithError = Object.entries(SECTION_FIELDS).find(([, fields]) =>
            fields.some((f) => fieldErrors[f]),
          )?.[0];
          if (stepWithError) setCurrentStep(Number(stepWithError));
        } else {
          const text = responseData?.message || err.message || "Registration failed";
          if (!applyServerErrorToField(text)) {
            setMessage({ type: "error", text });
          } else {
            setMessage(null);
          }
        }
      } else {
        const text =
          err?.response?.data?.message || err.message || "Registration failed";
        if (!applyServerErrorToField(text)) {
          setMessage({ type: "error", text });
        } else {
          setMessage(null);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.mainContainer}>
      <div className={styles.header}>
        <div className={styles.brandMark} aria-hidden="true">
          <span className={styles.brandMarkInner} />
        </div>
        <h1 className={styles.title}>Join Our Partner Network</h1>
      </div>
      <p className={styles.loginPrompt}>
        Already have an account?{" "}
        <Link to="/partner/login" className={styles.loginLink}>
          Sign in <span aria-hidden="true">→</span>
        </Link>
      </p>

      {/* Progress indicator — a slim 3-segment bar; completed segments
          are clickable so the user can jump back to a prior step. The
          ← Back icon button lives lower down, next to each step's
          "Step X of Y" caption instead of up here. */}
      <div className={styles.progress} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        {[1, 2, 3].map((n) => (
          <div key={n} className={styles.progressStep}>
            <button
              type="button"
              className={`${styles.progressDot} ${
                n <= currentStep ? styles.progressDotDone : ""
              } ${n < currentStep ? styles.progressDotClickable : ""}`}
              onClick={() => goToStep(n)}
              disabled={n >= currentStep}
              aria-label={`${n < currentStep ? "Go back to step" : "Step"} ${n}: ${STEP_META[n].title}`}
              aria-current={n === currentStep ? "step" : undefined}
            />
          </div>
        ))}
      </div>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {/* Personal Information Section */}
        {currentStep === 1 && (
        <div className={styles.section}>
          <div className={styles.stepCaptionRow}>
            {currentStep > 1 && (
              <button
                type="button"
                className={styles.backIconButton}
                onClick={handleBack}
                disabled={submitting}
                aria-label="Go back to the previous step"
              >
                ←
              </button>
            )}
            <p className={styles.stepCaption}>Step 1 of {TOTAL_STEPS}</p>
          </div>
          <h2 className={styles.stepHeadline}>{STEP_META[1].headline}</h2>
          <div className={styles.sectionContent}>
            <div className={styles.row}>
              <label className={styles.label}>
                <span>
                  First Name <span className={styles.required}>*</span>
                </span>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  autoFocus
                />
                {/* Live popover — appears the moment a disallowed character
                    is typed, disappears once the value is letters/spaces
                    only again. Same pattern as the phone-number digit
                    popover. */}
                {form.firstName && !PATTERNS.name.test(form.firstName) && (
                  <div className={styles.error}>
                    <span className={styles.checkDotDanger} aria-hidden="true" />
                    Only letters and spaces allowed
                  </div>
                )}
                {errors.firstName && !form.firstName && (
                  <div className={styles.error}>{errors.firstName}</div>
                )}
              </label>
              <label className={styles.label}>
                <span>
                  Last Name <span className={styles.required}>*</span>
                </span>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                />
                {form.lastName && !PATTERNS.name.test(form.lastName) && (
                  <div className={styles.error}>
                    <span className={styles.checkDotDanger} aria-hidden="true" />
                    Only letters and spaces allowed
                  </div>
                )}
                {errors.lastName && !form.lastName && (
                  <div className={styles.error}>{errors.lastName}</div>
                )}
              </label>
            </div>

            <div className={styles.label}>
              <span>
                Email Address <span className={styles.required}>*</span>
              </span>

              {/* The row itself never changes height or content structure
                  across idle/sent/verified — just the input's
                  disabled-ness and which action button sits next to it —
                  so clicking Verify can never move anything else on the
                  page. The OTP entry UI is a floating popover below this
                  row (see .otpPopover), not additional inline content. */}
              <div className={styles.emailRow}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleEmailChange}
                  disabled={isEmailVerified || otpState === "sent" || otpState === "verifying"}
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  placeholder="example@gmail.com"
                  autoComplete="email"
                />
                {isEmailVerified ? (
                  <>
                    <span className={styles.verifiedBadge}>
                      <span aria-hidden="true">✓</span> Verified
                    </span>
                    <button
                      type="button"
                      className={styles.changeEmailLink}
                      onClick={handleChangeEmail}
                    >
                      Change
                    </button>
                  </>
                ) : otpState === "sent" || otpState === "verifying" ? (
                  <button
                    type="button"
                    className={styles.changeEmailLink}
                    onClick={handleChangeEmail}
                  >
                    Change
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.verifyButton}
                    onClick={handleSendOtp}
                    disabled={otpState === "sending"}
                  >
                    {otpState === "sending" ? "Sending…" : "Verify"}
                  </button>
                )}
              </div>

              {(otpState === "sent" || otpState === "verifying") && (
                <div className={styles.otpPopover}>
                  <p className={styles.otpHint}>
                    Enter the 6-digit code sent to <strong>{form.email}</strong>
                  </p>
                  <div className={styles.otpInputs} onPaste={handleOtpPaste}>
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpBoxRefs.current[i] = el)}
                        className={`${styles.otpBox} ${otpError ? styles.otpBoxError : ""}`}
                        inputMode="numeric"
                        maxLength={1}
                        value={otpValue[i] || ""}
                        onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        disabled={otpState === "verifying"}
                        aria-label={`Digit ${i + 1} of verification code`}
                      />
                    ))}
                  </div>
                  {/* Rendered inside the popover (normal flow, not another
                      floating .error) so a wrong-code message can never end
                      up hidden behind the popover itself — the two were
                      both position:absolute anchored to the same spot
                      before, so the error was invisible underneath it. */}
                  {otpState === "sent" && otpError && (
                    <p className={styles.otpErrorText}>
                      <span className={styles.checkDotDanger} aria-hidden="true" />
                      {otpError}
                    </p>
                  )}
                  {otpState === "verifying" ? (
                    <p className={styles.otpHint}>Verifying…</p>
                  ) : (
                    <button
                      type="button"
                      className={styles.resendLink}
                      onClick={handleSendOtp}
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                    </button>
                  )}
                </div>
              )}

              {errors.email && <div className={styles.error}>{errors.email}</div>}
              {otpState !== "sent" && otpState !== "verifying" && otpError && (
                <div className={styles.error}>{otpError}</div>
              )}
            </div>

            <div className={styles.label}>
              <span>
                Phone Number <span className={styles.required}>*</span>
              </span>
              <div className={styles.phoneRow}>
                <div className={styles.countryPicker} ref={countryPickerRef}>
                  <button
                    type="button"
                    name="countryCode"
                    ref={countryTriggerRef}
                    className={`${styles.countryTrigger} ${errors.countryCode ? styles.inputError : ""}`}
                    onClick={() =>
                      countryDropdownOpen ? closeCountryDropdown() : openCountryDropdown()
                    }
                    aria-haspopup="listbox"
                    aria-expanded={countryDropdownOpen}
                    aria-label="Country code"
                  >
                    <img
                      src={flagIconUrl(selectedCountry.iso)}
                      srcSet={`${flagIconUrl(selectedCountry.iso, true)} 2x`}
                      alt=""
                      className={styles.flagIcon}
                    />
                    <span>{selectedCountry.code}</span>
                    <svg
                      className={`${styles.countryChevron} ${
                        countryDropdownOpen ? styles.countryChevronOpen : ""
                      }`}
                      viewBox="0 0 12 8"
                      aria-hidden="true"
                    >
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </button>

                  {countryDropdownOpen && countryDropdownPos && (
                    <div
                      className={styles.countryDropdown}
                      style={{ top: countryDropdownPos.top, left: countryDropdownPos.left }}
                    >
                      <input
                        ref={countrySearchInputRef}
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") closeCountryDropdown();
                          if (e.key === "Enter" && filteredCountries[0]) {
                            e.preventDefault();
                            selectCountryCode(filteredCountries[0].code);
                          }
                        }}
                        className={styles.countrySearchInput}
                        placeholder="Search country…"
                        aria-label="Search country"
                      />
                      <ul className={styles.countryList} role="listbox">
                        {filteredCountries.length === 0 && (
                          <li className={styles.countryEmpty}>No matches</li>
                        )}
                        {filteredCountries.map((c) => (
                          <li key={`${c.code}-${c.country}`}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={c.code === form.countryCode}
                              className={`${styles.countryOption} ${
                                c.code === form.countryCode ? styles.countryOptionSelected : ""
                              }`}
                              onClick={() => selectCountryCode(c.code)}
                            >
                              <img
                                src={flagIconUrl(c.iso)}
                                srcSet={`${flagIconUrl(c.iso, true)} 2x`}
                                alt=""
                                className={styles.flagIcon}
                              />
                              <span className={styles.countryOptionName}>{c.country}</span>
                              <span className={styles.countryOptionCode}>{c.code}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className={styles.phoneInputWrapper}>
                  <input
                    name="phoneNumber"
                    type="tel"
                    inputMode="numeric"
                    value={form.phoneNumber}
                    onChange={handlePhoneNumberChange}
                    onBlur={handlePhoneNumberBlur}
                    disabled={
                      isPhoneVerified ||
                      phoneOtpState === "sent" ||
                      phoneOtpState === "verifying"
                    }
                    className={`${styles.input} ${
                      errors.phoneNumber || phoneNumberStatus === "taken"
                        ? styles.inputError
                        : ""
                    }`}
                    placeholder="10-digit phone number"
                    autoComplete="tel"
                    maxLength={10}
                  />
                  {isPhoneVerified ? (
                    <>
                      <span className={styles.verifiedBadge}>
                        <span aria-hidden="true">✓</span> Verified
                      </span>
                      <button
                        type="button"
                        className={styles.changeEmailLink}
                        onClick={handleChangePhoneNumber}
                      >
                        Change
                      </button>
                    </>
                  ) : phoneOtpState === "sent" || phoneOtpState === "verifying" ? (
                    <button
                      type="button"
                      className={styles.changeEmailLink}
                      onClick={handleChangePhoneNumber}
                    >
                      Change
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.verifyButton}
                      onClick={handleSendPhoneOtp}
                      disabled={phoneOtpState === "sending"}
                    >
                      {phoneOtpState === "sending" ? "Sending…" : "Verify"}
                    </button>
                  )}
                  {/* Same floating, non-layout-shifting popover pattern as
                      the password checklist / confirm-password mismatch
                      notice — shows as soon as typing starts, disappears
                      the instant there are exactly 10 digits. */}
                  {form.phoneNumber && form.phoneNumber.length !== 10 && (
                    <div className={styles.error}>
                      <span className={styles.checkDotDanger} aria-hidden="true" />
                      Phone number must contain 10 numbers
                    </div>
                  )}
                </div>
              </div>

              {(phoneOtpState === "sent" || phoneOtpState === "verifying") && (
                <div className={styles.otpPopover}>
                  <p className={styles.otpHint}>
                    Enter the 6-digit code sent to{" "}
                    <strong>
                      {form.countryCode} {form.phoneNumber}
                    </strong>
                  </p>
                  <div className={styles.otpInputs} onPaste={handlePhoneOtpPaste}>
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => (phoneOtpBoxRefs.current[i] = el)}
                        className={`${styles.otpBox} ${phoneOtpError ? styles.otpBoxError : ""}`}
                        inputMode="numeric"
                        maxLength={1}
                        value={phoneOtpValue[i] || ""}
                        onChange={(e) => handlePhoneOtpDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handlePhoneOtpKeyDown(i, e)}
                        disabled={phoneOtpState === "verifying"}
                        aria-label={`Digit ${i + 1} of phone verification code`}
                      />
                    ))}
                  </div>
                  {phoneOtpState === "sent" && phoneOtpError && (
                    <p className={styles.otpErrorText}>
                      <span className={styles.checkDotDanger} aria-hidden="true" />
                      {phoneOtpError}
                    </p>
                  )}
                  {phoneOtpState === "verifying" ? (
                    <p className={styles.otpHint}>Verifying…</p>
                  ) : (
                    <button
                      type="button"
                      className={styles.resendLink}
                      onClick={handleSendPhoneOtp}
                      disabled={phoneResendCooldown > 0}
                    >
                      {phoneResendCooldown > 0
                        ? `Resend code (${phoneResendCooldown}s)`
                        : "Resend code"}
                    </button>
                  )}
                </div>
              )}

              {errors.countryCode && (
                <div className={styles.error}>{errors.countryCode}</div>
              )}
              {phoneNumberStatus === "taken" && (
                <div className={styles.error}>
                  <span className={styles.checkDotDanger} aria-hidden="true" />
                  This phone number is already in use
                </div>
              )}
              {/* Only falls back to this generic message when the field is
                  empty — otherwise the live "must contain 10 numbers"
                  popover above is already covering it more specifically,
                  and showing both at once would stack two popovers on
                  top of each other. */}
              {errors.phoneNumber && !form.phoneNumber && (
                <div className={styles.error}>{errors.phoneNumber}</div>
              )}
              {phoneOtpState !== "sent" && phoneOtpState !== "verifying" && phoneOtpError && (
                <div className={styles.error}>{phoneOtpError}</div>
              )}
            </div>

            <div className={styles.row}>
            <label className={styles.label}>
              <span>
                Password <span className={styles.required}>*</span>
              </span>
              <div className={styles.passwordFieldWrapper}>
                <div className={styles.passwordWrapper}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`${styles.input} ${styles.passwordInput} ${
                      errors.password ? styles.inputError : ""
                    }`}
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {(passwordFocused || form.password) &&
                  (() => {
                    const pendingChecks = PASSWORD_CHECKS.filter(
                      (c) => !c.test(form.password),
                    );
                    if (pendingChecks.length === 0) return null;
                    // A floating popover (not inline flow) so the checklist
                    // never pushes the Confirm Password field below it out
                    // of alignment — it just overlays on top instead. A
                    // 2-column grid keeps it compact as a wide block rather
                    // than one tall column, and naturally shrinks toward a
                    // single row as requirements get met and drop out.
                    return (
                      <ul className={styles.passwordChecklist}>
                        {pendingChecks.map((c) => (
                          <li key={c.key} className={styles.checkPending}>
                            <span className={styles.checkDot} aria-hidden="true" />
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
              </div>
              {/* Only falls back to this generic message when the field is
                  empty — otherwise the requirements checklist above is
                  already covering it. */}
              {errors.password && !form.password && (
                <div className={styles.error}>{errors.password}</div>
              )}
            </label>

            <label className={styles.label}>
              <span>
                Confirm Password <span className={styles.required}>*</span>
              </span>
              <div className={styles.passwordFieldWrapper}>
                <div className={styles.passwordWrapper}>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={onChange}
                    className={`${styles.input} ${styles.passwordInput} ${
                      errors.confirmPassword ? styles.inputError : ""
                    }`}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* A floating popover, same non-layout-shifting pattern as
                    the password requirements checklist — appears as soon
                    as the user starts typing a mismatched value, and
                    disappears the instant it matches (no button click
                    needed, this re-renders on every keystroke). */}
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <div className={styles.error}>
                    <span className={styles.checkDotDanger} aria-hidden="true" />
                    Passwords don't match yet
                  </div>
                )}
              </div>
              {/* Only falls back to this generic message when the field is
                  empty — otherwise the live mismatch popover above is
                  already covering it. */}
              {errors.confirmPassword && !form.confirmPassword && (
                <div className={styles.error}>{errors.confirmPassword}</div>
              )}
            </label>
            </div>
          </div>
        </div>
        )}

        {/* Business Information Section */}
        {currentStep === 2 && (
        <div className={styles.section}>
          <div className={styles.stepCaptionRow}>
            {currentStep > 1 && (
              <button
                type="button"
                className={styles.backIconButton}
                onClick={handleBack}
                disabled={submitting}
                aria-label="Go back to the previous step"
              >
                ←
              </button>
            )}
            <p className={styles.stepCaption}>Step 2 of {TOTAL_STEPS}</p>
          </div>
          <h2 className={styles.stepHeadline}>{STEP_META[2].headline}</h2>
          <div className={styles.sectionContent}>
            <label className={styles.label}>
              <span>
                Business Type <span className={styles.required}>*</span>
              </span>
              <div className={styles.selectWrapper} ref={businessTypePickerRef}>
                <button
                  type="button"
                  name="businessType"
                  ref={businessTypeTriggerRef}
                  className={`${styles.input} ${styles.selectTrigger} ${
                    errors.businessType ? styles.inputError : ""
                  } ${!form.businessType ? styles.selectPlaceholder : ""}`}
                  onClick={() =>
                    businessTypeDropdownOpen
                      ? closeBusinessTypeDropdown()
                      : openBusinessTypeDropdown()
                  }
                  aria-haspopup="listbox"
                  aria-expanded={businessTypeDropdownOpen}
                >
                  <span>{selectedBusinessType?.label || "Select your business type"}</span>
                  <svg
                    className={`${styles.selectChevron} ${
                      businessTypeDropdownOpen ? styles.selectChevronOpen : ""
                    }`}
                    viewBox="0 0 12 8"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </button>

                {businessTypeDropdownOpen && businessTypeDropdownPos && (
                  <ul
                    className={styles.simpleDropdown}
                    style={{
                      top: businessTypeDropdownPos.top,
                      left: businessTypeDropdownPos.left,
                      width: businessTypeDropdownPos.width,
                    }}
                    role="listbox"
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <li key={bt.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={bt.value === form.businessType}
                          className={`${styles.simpleDropdownOption} ${
                            bt.value === form.businessType
                              ? styles.simpleDropdownOptionSelected
                              : ""
                          }`}
                          onClick={() => selectBusinessType(bt.value)}
                        >
                          {bt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {errors.businessType && (
                <div className={styles.error}>{errors.businessType}</div>
              )}
            </label>

            <label className={styles.label}>
              <span>
                Business Name <span className={styles.required}>*</span>
              </span>
              <input
                name="businessName"
                value={form.businessName}
                onChange={onChange}
                onBlur={handleBusinessNameBlur}
                className={`${styles.input} ${errors.businessName || businessNameStatus === "taken" ? styles.inputError : ""}`}
                placeholder="Enter your business name"
                autoComplete="organization"
              />
              <span className={styles.fieldHint}>
                Letters, spaces, and apostrophes only
              </span>
              {businessNameStatus === "taken" && (
                <div className={styles.error}>
                  <span className={styles.checkDotDanger} aria-hidden="true" />
                  Business name already taken, try a different one
                </div>
              )}
              {errors.businessName && !form.businessName && (
                <div className={styles.error}>{errors.businessName}</div>
              )}
            </label>

            <label className={styles.label}>
              <span>
                Business Document <span className={styles.optional}>(optional)</span>
              </span>
              <input
                ref={businessDocumentInputRef}
                type="file"
                accept={BUSINESS_DOCUMENT_ACCEPT}
                onChange={handleBusinessDocumentChange}
                className={styles.fileInputHidden}
                id="businessDocumentInput"
              />
              <div className={styles.fileUploadRow}>
                <button
                  type="button"
                  className={styles.fileUploadButton}
                  onClick={() => businessDocumentInputRef.current?.click()}
                >
                  Choose file
                </button>
                {form.businessDocument ? (
                  <span className={styles.fileChip}>
                    <span className={styles.fileChipName} title={form.businessDocument.name}>
                      {form.businessDocument.name}
                    </span>
                    <button
                      type="button"
                      className={styles.fileChipRemove}
                      onClick={handleRemoveBusinessDocument}
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <span className={styles.fileEmptyHint}>No file chosen</span>
                )}
              </div>
              <span className={styles.fieldHint}>
                A license, registration certificate, or any document that helps us
                verify your business (PDF, JPG, PNG, or Word — max {BUSINESS_DOCUMENT_MAX_SIZE_MB}MB).
              </span>
              {errors.businessDocument && (
                <div className={styles.error}>{errors.businessDocument}</div>
              )}
            </label>
          </div>
        </div>
        )}

        {/* Address Information Section */}
        {currentStep === 3 && (
        <div className={styles.section}>
          <div className={styles.stepCaptionRow}>
            {currentStep > 1 && (
              <button
                type="button"
                className={styles.backIconButton}
                onClick={handleBack}
                disabled={submitting}
                aria-label="Go back to the previous step"
              >
                ←
              </button>
            )}
            <p className={styles.stepCaption}>Step 3 of {TOTAL_STEPS}</p>
          </div>
          <h2 className={styles.stepHeadline}>{STEP_META[3].headline}</h2>
          <div className={styles.sectionContent}>
            <AddressForm form={form} onChange={onChange} errors={errors} />
          </div>
        </div>
        )}

        {message && (
          <div
            className={`${styles.message} ${
              message.type === "error"
                ? styles.errorMessage
                : styles.successMessage
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <div className={styles.stepActions}>
          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className={styles.spinner}></span>
                Creating Account...
              </>
            ) : (
              <>
                {STEP_META[currentStep].nextLabel}
                {currentStep < TOTAL_STEPS && (
                  <span className={styles.buttonArrow} aria-hidden="true">
                    →
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
