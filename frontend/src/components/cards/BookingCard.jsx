import { Calendar, MapPin, KeyRound, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const BookingCard = ({
  booking,
  onChat,
  onViewDetails,
  onAction,
  actionLabel,
  t = (k, o) => o?.defaultValue || k,
  className = ''
}) => {
  if (!booking) return null;

  const partner = booking.worker || booking.user || {};
  const formattedDate = booking.scheduledDate ? format(new Date(booking.scheduledDate), 'dd MMM yyyy, h:mm a') : '';

  return (
    <Card variant="elevated" padding="md" className={`space-y-4 text-left ${className}`}>
      {/* Header: Service + Status */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h4 className="text-base sm:text-lg font-bold text-slate-900 capitalize truncate">
            {t(`services.${booking.service}`, { defaultValue: booking.service })}
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
            <Calendar size={13} className="text-slate-400" />
            <span>{formattedDate}</span>
          </p>
        </div>

        <Badge status={booking.status} size="sm" />
      </div>

      {/* Partner Info & Address */}
      <div className="space-y-2 text-xs sm:text-sm text-slate-600">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-800 truncate">
            {partner.name || 'Service Partner'}
          </span>

          {booking.totalPrice && (
            <span className="font-bold text-slate-900">
              ₹{booking.totalPrice}
            </span>
          )}
        </div>

        {booking.address && (
          <p className="text-xs text-slate-500 flex items-start gap-1">
            <MapPin size={13} className="shrink-0 mt-0.5 text-slate-400" />
            <span className="line-clamp-1">{booking.address}</span>
          </p>
        )}
      </div>

      {/* OTP Display Chips when active */}
      {(booking.startOTP || booking.completionOTP) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {booking.startOTP && !booking.startOTPVerified && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <KeyRound size={14} className="text-amber-600" />
              <span>Start OTP: {booking.startOTP}</span>
            </div>
          )}

          {booking.completionOTP && !booking.completionOTPVerified && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <KeyRound size={14} className="text-emerald-600" />
              <span>Completion OTP: {booking.completionOTP}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        {onChat && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onChat}
            iconLeft={MessageSquare}
          >
            {t('common.chat', { defaultValue: 'Chat' })}
          </Button>
        )}

        {onViewDetails && (
          <Button
            size="sm"
            variant="outline"
            onClick={onViewDetails}
          >
            {t('common.viewDetails', { defaultValue: 'Details' })}
          </Button>
        )}

        {actionLabel && onAction && (
          <Button
            size="sm"
            variant="primary"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BookingCard;
