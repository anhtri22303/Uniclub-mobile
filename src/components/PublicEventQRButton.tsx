import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import QRModal from './QRModal';

interface PublicEventQRButtonProps {
  event: {
    id: number;
    name: string;
    checkInCode: string;
  };
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
  className?: string;
}

export default function PublicEventQRButton({
  event,
  variant = 'default',
  size = 'default',
  className = '',
}: PublicEventQRButtonProps) {
  const [showQrModal, setShowQrModal] = useState(false);

  const handleOpenQRModal = () => {
    setShowQrModal(true);
  };

  const buttonClasses = `flex-row items-center justify-center rounded-lg ${
    size === 'sm' ? 'px-3 py-2' : 'px-4 py-3'
  } ${
    variant === 'outline'
      ? 'bg-white border-2 border-blue-600'
      : 'bg-gradient-to-r from-blue-600 to-indigo-600'
  } ${className}`;

  const textClasses = `font-semibold ${size === 'sm' ? 'text-sm' : 'text-base'} ${
    variant === 'outline' ? 'text-blue-600' : 'text-white'
  }`;

  return (
    <>
      <TouchableOpacity
        onPress={handleOpenQRModal}
        className={buttonClasses}
      >
        <Ionicons
          name="qr-code"
          size={size === 'sm' ? 16 : 20}
          color={variant === 'outline' ? '#2563eb' : '#fff'}
        />
        <Text className={`${textClasses} ml-2`}>QR Public Event</Text>
      </TouchableOpacity>

      <QRModal
        open={showQrModal}
        onOpenChange={setShowQrModal}
        eventName={event.name}
        eventId={event.id}
        checkInCode={event.checkInCode}
        isPublicEvent={true}
      />
    </>
  );
}
