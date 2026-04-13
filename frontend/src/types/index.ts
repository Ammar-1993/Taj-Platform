export interface Role {
  id: number;
  name: string;
}

export interface GradeLevel {
  id: number;
  name: string;
  session_price?: string;
}

export interface Subject {
  id: number;
  name: string;
}

export interface TeacherProfile {
  id: number;
  user_id: number;
  subject_id: number;
  bio: string;
  is_verified: boolean;
  average_rating: number;
  reviews_count: number;
  subject?: Subject;
  national_id_path?: string;
  degree_path?: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  grade_level_id: number;
  is_active: boolean;
  can_book_independently?: boolean;
  grade_level?: {
    id: number;
    name: string;
  };
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: string;
  transactions?: {
    data: WalletTransaction[];
  };
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  amount: string;
  type: "deposit" | "withdrawal";
  description: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_active?: boolean;
  roles: Role[];
  wallet?: Wallet;
  student_profile?: StudentProfile;
  teacher_profile?: TeacherProfile;
  active_slots_count?: number;
}

export interface TeacherSlot {
  id: number;
  teacher_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked";
}

export type SlotsByDate = Record<string, TeacherSlot[]>;

export interface TeacherProfileFormData {
  subject_id: string;
  bio: string;
  national_id?: File | null;
  degree?: File | null;
}

export interface PayoutRequest {
  id: number;
  amount: string;
  bank_name: string;
  status: string;
  created_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  student_id: number;
  teacher_id: number;
  rating: number;
  comment?: string;
}

export interface Booking {
  id: number;
  student_id: number;
  teacher_id: number;
  teacher_slot_id: number;
  booking_date: string;
  session_price: string;
  net_paid: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "refunded";
  student?: User;
  teacher?: User;
  teacher_slot?: TeacherSlot;
  review?: Review;
}

export interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  booking_id?: number;
  admin_reply?: string;
  updated_at: string;
}

export interface SupportTicketCreatePayload {
  subject: string;
  description: string;
  booking_id?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  notifiable_id: number;
  data: {
    message: string;
    booking_id: number;
    booking_date: string;
    time: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface ChildWallet {
  id: number;
  balance: string;
  user: User;
}

export interface ParentDashboardData {
  parent_balance: string;
  total_spent: string;
  wallets: ChildWallet[];
  bookings: Booking[];
}
