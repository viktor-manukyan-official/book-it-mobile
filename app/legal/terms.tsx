import { LegalDocument } from "../../src/components/LegalDocument";

export default function TermsScreen() {
  return (
    <LegalDocument
      title="Terms of Service"
      updatedAt="August 2026"
      intro="Welcome to BookIt. By creating an account or using the app you agree to these Terms. Please read them carefully."
      sections={[
        {
          heading: "1. Using BookIt",
          body: "BookIt lets you discover and book beauty & wellness appointments with independent venues. You must provide accurate information and be old enough to enter into a booking under the laws that apply to you.",
        },
        {
          heading: "2. Bookings & payment",
          body: "Appointments are provided by the venues, not by BookIt. Unless stated otherwise, you pay the venue directly at the time of your appointment. Prices, availability and cancellation rules are set by each venue.",
        },
        {
          heading: "3. Cancellations & no-shows",
          body: "You can cancel a booking from the app subject to the venue's cancellation policy. Repeated no-shows may lead to limits on your account.",
        },
        {
          heading: "4. Your account",
          body: "You are responsible for activity on your account and for keeping your phone number and login secure. Let us know immediately if you suspect unauthorized use.",
        },
        {
          heading: "5. Changes",
          body: "We may update these Terms as BookIt grows and expands to new places and services. We will notify you of material changes, and continued use means you accept the updated Terms.",
        },
        {
          heading: "6. Contact",
          body: "Questions about these Terms? Reach us at support@bookit.app.",
        },
      ]}
    />
  );
}
