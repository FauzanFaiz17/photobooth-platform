import React from 'react';


type ButtonVariant = 'primary' | 'secondary' | 'outlined';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  variant = 'primary',
  children,
  onClick,
  loading = false,
  className = '',
  ...props
}) => {
  const baseStyles = 
    "px-6 py-3 font-bold text-black border-4 border-black transition-all duration-75 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";

  // Variant styles: Warna mencolok dan solid drop shadow khas Neo-brutalism
  const variants = {
    primary: 
      "bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300",
    secondary: 
      "bg-pink-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-300",
    outlined: 
      "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
  };

  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};