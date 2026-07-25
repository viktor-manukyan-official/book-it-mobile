export interface Salon {
  id: string;
  name: string;
  category: "salon" | "barbershop" | "clinic";
  area: string;
  rating: number;
  reviewCount: number;
  address: string;
  hours: string;
  description: string;
  coverColor: string;
  services: Service[];
  timeSlots: string[];
}

export interface Service {
  name: string;
  price: number;
  duration: string;
}

export interface ProfileMenuItem {
  icon: string;
  label: string;
}

export const CATEGORIES = ["All", "Salons", "Barbershops", "Clinics"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_FILTER_MAP: Record<Category, string | null> = {
  All: null,
  Salons: "salon",
  Barbershops: "barbershop",
  Clinics: "clinic",
};

export const SALONS: Salon[] = [
  {
    id: "1",
    name: "Kentron Luxury Spa",
    category: "salon",
    area: "Kentron",
    rating: 4.8,
    reviewCount: 124,
    address: "15 Abovyan St, Kentron, Yerevan",
    hours: "10:00 AM – 9:00 PM",
    description:
      "A premium beauty and wellness salon in the heart of Yerevan offering a full range of hair, skin, and nail services.",
    coverColor: "#A78BFA",
    services: [
      { name: "Haircut & Style", price: 8000, duration: "45 min" },
      { name: "Hair Coloring", price: 15000, duration: "90 min" },
      { name: "Manicure", price: 5000, duration: "30 min" },
      { name: "Facial Treatment", price: 12000, duration: "60 min" },
    ],
    timeSlots: [
      "10:00 AM",
      "11:30 AM",
      "01:00 PM",
      "02:30 PM",
      "04:00 PM",
      "05:30 PM",
    ],
  },
  {
    id: "2",
    name: "Saryan Barber Co.",
    category: "barbershop",
    area: "Kentron",
    rating: 4.6,
    reviewCount: 89,
    address: "22 Saryan St, Kentron, Yerevan",
    hours: "9:00 AM – 8:00 PM",
    description:
      "Classic and modern barbering in a relaxed atmosphere. Walk-ins welcome.",
    coverColor: "#F59E0B",
    services: [
      { name: "Haircut & Style", price: 6000, duration: "30 min" },
      { name: "Beard Trim", price: 4000, duration: "20 min" },
      { name: "Hot Towel Shave", price: 5000, duration: "25 min" },
      { name: "Hair & Beard Combo", price: 9000, duration: "50 min" },
    ],
    timeSlots: [
      "9:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "02:00 PM",
      "03:30 PM",
      "05:00 PM",
    ],
  },
  {
    id: "3",
    name: "Arabkir Wellness Clinic",
    category: "clinic",
    area: "Arabkir",
    rating: 4.9,
    reviewCount: 56,
    address: "8 Komitas Ave, Arabkir, Yerevan",
    hours: "8:00 AM – 6:00 PM",
    description:
      "Professional dermatology and aesthetic treatments with board-certified specialists.",
    coverColor: "#34D399",
    services: [
      { name: "Skin Consultation", price: 10000, duration: "30 min" },
      { name: "Laser Hair Removal", price: 20000, duration: "45 min" },
      { name: "Chemical Peel", price: 18000, duration: "40 min" },
      { name: "Botox Treatment", price: 35000, duration: "30 min" },
    ],
    timeSlots: ["8:00 AM", "9:30 AM", "11:00 AM", "01:00 PM", "03:00 PM"],
  },
  {
    id: "4",
    name: "Cascade Beauty Studio",
    category: "salon",
    area: "Kentron",
    rating: 4.5,
    reviewCount: 201,
    address: "3 Cascade Alley, Kentron, Yerevan",
    hours: "10:00 AM – 8:00 PM",
    description:
      "Trendy beauty studio near the Cascade with expert colorists and stylists.",
    coverColor: "#EC4899",
    services: [
      { name: "Blowout", price: 5000, duration: "30 min" },
      { name: "Balayage", price: 25000, duration: "120 min" },
      { name: "Eyebrow Shaping", price: 3000, duration: "15 min" },
      { name: "Gel Nails", price: 7000, duration: "45 min" },
    ],
    timeSlots: [
      "10:00 AM",
      "11:30 AM",
      "01:00 PM",
      "03:00 PM",
      "04:30 PM",
      "06:00 PM",
    ],
  },
  {
    id: "5",
    name: "Mashtots Men's Grooming",
    category: "barbershop",
    area: "Arabkir",
    rating: 4.3,
    reviewCount: 67,
    address: "45 Mashtots Ave, Arabkir, Yerevan",
    hours: "10:00 AM – 7:00 PM",
    description:
      "Premium men's grooming lounge offering traditional and contemporary cuts.",
    coverColor: "#6366F1",
    services: [
      { name: "Classic Cut", price: 5000, duration: "25 min" },
      { name: "Beard Sculpt", price: 4500, duration: "20 min" },
      { name: "Scalp Treatment", price: 7000, duration: "30 min" },
    ],
    timeSlots: ["10:00 AM", "11:00 AM", "12:30 PM", "02:00 PM", "04:00 PM"],
  },
];

export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  { icon: "time-outline", label: "My History" },
  { icon: "language-outline", label: "Language Selection" },
  { icon: "help-circle-outline", label: "Help & Support" },
];

export function formatPrice(price: number): string {
  return `${price.toLocaleString()} \u058F`;
}
