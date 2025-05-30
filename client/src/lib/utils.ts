import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarGradient(index: number): string {
  const gradients = [
    'gradient-blue',
    'gradient-purple', 
    'gradient-pink',
    'gradient-green',
    'gradient-yellow',
    'gradient-indigo',
    'gradient-red',
    'gradient-teal',
  ];
  return gradients[index % gradients.length];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    'president': 'bg-purple-100 text-purple-800',
    'vice-president': 'bg-blue-100 text-blue-800',
    'secretary': 'bg-amber-100 text-amber-800',
    'head': 'bg-green-100 text-green-800',
    'vice-head': 'bg-indigo-100 text-indigo-800',
    'member': 'bg-gray-100 text-gray-800',
  };
  return colors[position] || 'bg-gray-100 text-gray-800';
}

export function getMemberTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'alumni': 'bg-gray-100 text-gray-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}
