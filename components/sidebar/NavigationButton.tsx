// components/sidebar/NavigationButton.tsx (Modificado)
import Link from 'next/link';
import Image from 'next/image';

interface NavigationButtonProps {
  iconSrc: string;
  label: string;
  href?: string; // Hacemos href opcional
  onClick?: () => void; // Añadimos onClick
  isActive?: boolean;
}

export function NavigationButton({ iconSrc, label, href, onClick, isActive }: NavigationButtonProps) {
  const buttonClasses = `
    flex items-center gap-4 p-3 rounded-lg text-lg font-semibold transition-colors duration-200
    ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
  `;

  if (href) {
    return (
      <Link href={href} passHref>
        <button className={buttonClasses}> {/* Usar un button dentro del Link para estilos */}
          <Image src={iconSrc} alt={label} width={24} height={24} className="flex-shrink-0" />
          <span className="flex-grow text-left">{label}</span>
        </button>
      </Link>
    );
  }

  // Si no hay href, se usa solo con onClick
  return (
    <button onClick={onClick} className={buttonClasses}>
      <Image src={iconSrc} alt={label} width={24} height={24} className="flex-shrink-0" />
      <span className="flex-grow text-left">{label}</span>
    </button>
  );
}
