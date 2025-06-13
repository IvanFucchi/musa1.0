import {Link} from "react-router-dom";
import React from "react";

const Hero = () => {
  return (
    <section id='hero' className='mb-20 relative z-10 overflow-hidden'>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-[105%] bg-zinc-950">
        <video
          src="/hero/video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 object-cover z-0 blur-md w-full h-full"
        />
      </div>
      <div className="container mx-auto relative overflow-hidden rounded-lg">
        <div className="max-w-xl lg:ms-32">
          <div className="py-32 rounded-lg relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">Scopri l'arte in base al tuo mood</h1>
            <p className="mb-8 text-white">
              MUSA ti supporta nella scoperta di opere d’arte, musei, gallerie ed eventi culturali, valorizzando il tuo stato d’animo e le tue
              preferenze musicali, per offrirti percorsi su misura, consigli mirati e opportunità uniche di immergerti nell’arte e nella cultura.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/explore?place=roma&activity=arte" className="py-3 px-6 font-semibold rounded bg-white shadow hover:bg-zinc-200">Inizia ad esplorare</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
