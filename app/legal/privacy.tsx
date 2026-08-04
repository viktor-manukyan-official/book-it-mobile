import { LegalDocument } from "../../src/components/LegalDocument";

export default function PrivacyScreen() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updatedAt="August 2026"
      intro="This Policy explains what information BookIt collects, how we use it, and the choices you have. We collect only what we need to run the booking service."
      sections={[
        {
          heading: "1. Information we collect",
          body: "Your phone number (used to sign you in), the name and email you provide, and the bookings you make. We also collect basic device and usage data to keep the app secure and reliable.",
        },
        {
          heading: "2. How we use it",
          body: "To create your account, send verification codes, confirm and manage your appointments, and improve the app. Your phone number is never shown to the venues you book with.",
        },
        {
          heading: "3. Sharing",
          body: "We share only the details a venue needs to fulfil your booking (such as your name and appointment time). We do not sell your personal information.",
        },
        {
          heading: "4. Your location",
          body: "If you allow it, we use your location to show nearby venues. You can turn this off in your device settings at any time; BookIt still works without it.",
        },
        {
          heading: "5. Data retention & your rights",
          body: "We keep your information for as long as your account is active. You can request access to or deletion of your data by contacting us.",
        },
        {
          heading: "6. Contact",
          body: "Privacy questions or requests? Email privacy@bookit.app.",
        },
      ]}
    />
  );
}
