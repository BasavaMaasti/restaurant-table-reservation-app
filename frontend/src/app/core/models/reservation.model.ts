export interface Reservation {
  _id: string;
  customer: any;
  restaurant: any;
  table: any;
  reservationDate: string;
  timeSlot: { startTime: string; endTime: string };
  guestCount: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  occasion?: string;
  qrCode?: string;
  confirmationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  checkedInAt?: string;
  completedAt?: string;
  createdAt: string;
}
