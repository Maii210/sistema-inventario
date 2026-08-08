import React from 'react';
import { Sparkles, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-t from-essence-navy to-essence-purple text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-8 w-8 text-essence-light" />
              <div>
                <h3 className="font-playfair text-2xl font-bold">Essence</h3>
                <p className="text-sm text-essence-light">Perfumería Premium</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Descubre el mundo de las fragancias con nuestra colección exclusiva de perfumes premium. 
              Cada fragancia cuenta una historia única.
            </p>
            <div className="flex space-x-4">
              <button className="p-2 bg-essence-plum hover:bg-essence-rose rounded-full transition-colors">
                <Instagram className="h-4 w-4" />
              </button>
              <button className="p-2 bg-essence-plum hover:bg-essence-rose rounded-full transition-colors">
                <Facebook className="h-4 w-4" />
              </button>
              <button className="p-2 bg-essence-plum hover:bg-essence-rose rounded-full transition-colors">
                <Twitter className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-essence-light">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-essence-light transition-colors">Catálogo</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Nuevos Lanzamientos</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Ofertas Especiales</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Test de Fragancia</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Regalos</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-essence-light">Atención al Cliente</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-essence-light transition-colors">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Política de Devoluciones</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-essence-light transition-colors">Contáctanos</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-essence-light">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-essence-light flex-shrink-0" />
                <span>Av. 16 de Julio 1234, La Paz, Bolivia</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-essence-light flex-shrink-0" />
                <span>+591 2-2345678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-essence-light flex-shrink-0" />
                <span>contacto@essence.com</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h5 className="font-medium mb-2 text-essence-light">Horarios de Atención</h5>
              <p className="text-xs text-gray-300">
                Lunes a Viernes: 9:00 - 19:00<br />
                Sábados: 9:00 - 17:00<br />
                Domingos: 10:00 - 15:00
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center text-sm text-gray-300">
          <p>&copy; 2024 Essence Perfumería. Todos los derechos reservados.</p>
          <p className="mt-2">Diseñado con ❤️ para los amantes de las fragancias premium</p>
        </div>
      </div>
    </footer>
  );
}