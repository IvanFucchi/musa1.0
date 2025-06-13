import {Link} from "react-router-dom";
import React from "react";

const Banner = () => {
  return (
    <section id='disclaimer' className='relative z-10 overflow-hidden'>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-zinc-950">
        <img
          src="/hero/hero-bkg-2.jpg"
          className="absolute top-0 left-0 object-cover z-0 blur-md w-full h-full opacity-80"
          alt='bkg'
        />
      </div>
      <div className="container relative z-10 py-28">
        <div className="max-w-xl lg:ms-32">
          <h2 className="text-5xl font-bold text-white mb-4">Pronto a scoprire l'arte in un modo nuovo?</h2>
          <p className="text-white mb-8">
            Registrati gratuitamente e inizia a esplorare opere d'arte e luoghi culturali in base al tuo mood e ai tuoi gusti musicali.
          </p>
          <Link to="/register" className="py-3 px-6 font-semibold rounded bg-white shadow hover:bg-zinc-200">
            Inizia ad esplorare
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Banner;
