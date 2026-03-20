# PropertyRegister Component

A responsive popup form for registering new properties that matches backend validation rules.

## Features

- ✅ Popup modal with backdrop
- ✅ Mobile-responsive design
- ✅ Client-side validation matching backend @Pattern annotations
- ✅ Backend error handling and display
- ✅ Form sections: Personal Info, Property Info, Address Info
- ✅ Real-time validation on field input
- ✅ Loading states and error display

## Usage

```jsx
import PropertyRegister from "./components/partnercomponent/PropertyRegister";
import { registerProperty } from "./api/authService";

function MyComponent() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      const response = await registerProperty(formData);
      if (response.data.success) {
        // Handle success
        alert("Property registered successfully!");
      }
    } catch (error) {
      // Error will be handled by PropertyRegister component
      throw error;
    }
  };

  return (
    <div>
      <button onClick={() => setIsFormOpen(true)}>Add Property</button>

      <PropertyRegister
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

## Props

- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Called when modal should be closed
- `onSubmit` (function): Called with form data when form is submitted

## Validation Rules

The component validates fields according to backend annotations:

### Personal Information

- **First Name**: Required, letters only, 1-44 chars
- **Last Name**: Required, letters only, 1-44 chars
- **Email**: Required, valid email format, max 45 chars
- **Phone**: Required, exactly 10 digits
- **Password**: Required, 8-20 chars, must include uppercase, lowercase, digit, special char

### Property Information

- **Property Name**: Required, letters and apostrophes only, 1-44 chars

### Address Information

- **Building Number**: Required, letters/digits/special chars, 1-45 chars
- **Street**: Required, letters/digits/spaces, 1-45 chars
- **City**: Required, letters only, 1-44 chars
- **State**: Required, letters only, 1-44 chars
- **Country**: Required, letters only, 1-44 chars
- **Zip Code**: Required, letters/digits only, 1-45 chars

## Mobile Responsiveness

- Stacks form fields vertically on mobile
- Full-width buttons on small screens
- Optimized touch targets
- Prevents iOS zoom on form inputs
- Scrollable modal content
