// Customer-facing appointment (booking) types, mirroring the `myAppointments`
// query on the backend AppointmentType.

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Appointment {
  id: string;
  companyId: string;
  status: AppointmentStatus;
  startTime: string; // ISO
  endTime: string; // ISO
  price: number;
  currency: string;
  service: { id: string; name: string };
  technician: { id: string; firstName: string; lastName: string };
  location: { id: string; name: string };
}
