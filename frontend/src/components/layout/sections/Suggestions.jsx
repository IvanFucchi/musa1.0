import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ArrowUpRightIcon} from '@heroicons/react/24/solid';

const cards = [
  {
    title: 'Opere d’arte',
    description: 'Dipinti, sculture e installazioni',
    city: 'Milano',
    activity: 'arte',
  },
  {
    title: 'Musei e gallerie',
    description: 'Luoghi che ospitano collezioni',
    city: 'Roma',
    activity: 'musei',
  },
  {
    title: 'Eventi',
    description: 'Mostre temporanee e performance',
    city: 'Venezia',
    activity: 'eventi',
  },
  {
    title: 'Collezioni',
    description: 'Raccolte tematiche e monografiche',
    city: 'Firenze',
    activity: 'collezioni',
  },
  {
    title: 'Connessioni musicali',
    description: 'Opera e musica a confronto',
    city: 'Bologna',
    activity: 'musica',
  },
  {
    title: 'Itinerari',
    description: 'Percorsi culturali su mappa',
    city: 'Torino',
    activity: 'itinerari',
  },
  {
    title: 'Architettura',
    description: 'Edifici storici e contemporanei',
    city: 'Genova',
    activity: 'architettura',
  },
  {
    title: 'Teatro e spettacolo',
    description: 'Rappresentazioni e festival',
    city: 'Napoli',
    activity: 'teatro',
  },
];

const Suggestions = () => {
  const location = useLocation();

  return (
    <section className="mb-20">
      <div className="container">
        <h2 className="font-bold text-3xl mb-10">Esplora per categoria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(({title, description, city, activity}, i) => {
            const placeParam = encodeURIComponent(city.toLowerCase());
            const activityParam = encodeURIComponent(activity.toLowerCase());
            const exploreUrl = `/explore?place=${placeParam}&activity=${activityParam}`;

            return (
              <Link
                key={i}
                to={exploreUrl}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md flex justify-between gap-2"
                title={`${description} — Città: ${city}`}
              >
                <div>
                  <h3 className="text-lg text-zinc-950 font-bold mb-1">{title}</h3>
                  <p className="text-sm text-zinc-600 mb-2 flex-grow">{description}</p>
                  <span className="mt-auto text-sm font-semibold text-zinc-950">{city}</span>
                </div>

                <div>
                  <div className="w-8 h-8 rounded-full mb-4 bg-zinc-100 flex items-center justify-center">
                    <ArrowUpRightIcon className="h-5 w-5 text-zinc-700"/>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Suggestions;
