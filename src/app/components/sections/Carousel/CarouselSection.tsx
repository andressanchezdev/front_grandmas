import React, { useEffect, useState } from 'react';
import { IMAGENES_CARRUSEL } from '../../hooks/landingShared';

export function CarouselSection() {
  const [indiceCarrusel, setIndiceCarrusel] = useState(0);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setIndiceCarrusel((prev) => (prev + 1) % IMAGENES_CARRUSEL.length);
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, []);

  return (
    <section
      id="inicio"
      className="relative h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] overflow-hidden"
    >
      <div className="relative h-full">
        {IMAGENES_CARRUSEL.map((imagen, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === indiceCarrusel ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={imagen.url} alt={imagen.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-white">
                <h1 className="text-white mb-2 sm:mb-3 md:mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                  {imagen.titulo}
                </h1>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-white/90 max-w-2xl">
                  {imagen.subtitulo}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {IMAGENES_CARRUSEL.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === indiceCarrusel ? 'bg-white w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
