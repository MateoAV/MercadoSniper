'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Car, 
  Bell, 
  Database, 
  BarChart3, 
  Search, 
  Archive,
  X
} from 'lucide-react';
import { Fragment } from 'react';
import { Transition } from '@headlessui/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Buscar Vehículos', href: '/search', icon: Search },
  { name: 'Mis Vehículos', href: '/vehicles', icon: Car },
  { name: 'Vehículos Canónicos', href: '/canonical-vehicles', icon: Archive },
  { name: 'Alertas', href: '/alerts', icon: Bell },
  { name: 'Scraping', href: '/scraping', icon: Database },
  { name: 'Analíticas', href: '/analytics', icon: BarChart3 },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isCurrentPath = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      <Transition show={isOpen} as={Fragment}>
        <div className="relative z-50 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" onClick={onClose} />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar sidebar</span>
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <SidebarContent 
                  navigation={navigation} 
                  isCurrentPath={isCurrentPath}
                  onItemClick={onClose}
                />
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent 
          navigation={navigation} 
          isCurrentPath={isCurrentPath}
        />
      </div>
    </>
  );
}

interface SidebarContentProps {
  navigation: any[];
  isCurrentPath: (href: string) => boolean;
  onItemClick?: () => void;
}

function SidebarContent({ navigation, isCurrentPath, onItemClick }: SidebarContentProps) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-lg lg:shadow-none border-r border-gray-200">
      <div className="flex h-16 shrink-0 items-center lg:hidden">
        <span className="text-xl font-bold text-gray-900">MercadoSniper</span>
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={`group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-medium transition-colors ${
                      isCurrentPath(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon
                      className={`h-6 w-6 shrink-0 ${
                        isCurrentPath(item.href)
                          ? 'text-primary-700'
                          : 'text-gray-400 group-hover:text-primary-700'
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
} 