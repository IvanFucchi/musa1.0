import React from 'react'
import {Link} from 'react-router-dom'
import {ArrowUpRightIcon} from "@heroicons/react/24/solid";

const cards = [
  {title: 'Opere d’arte', description: 'Dipinti, sculture e installazioni', to: '/opere', city: 'Milano'},
  {title: 'Musei e gallerie', description: 'Luoghi che ospitano collezioni', to: '/musei', city: 'Roma'},
  {title: 'Eventi', description: 'Mostre temporanee e performance', to: '/eventi', city: 'Venezia'},
  {title: 'Collezioni', description: 'Raccolte tematiche e monografiche', to: '/collezioni', city: 'Firenze'},
  {title: 'Connessioni musicali', description: 'Opera e musica a confronto', to: '/connessioni-musicali', city: 'Bologna'},
  {title: 'Itinerari', description: 'Percorsi culturali su mappa', to: '/itinerari', city: 'Torino'},
  {title: 'Architettura', description: 'Edifici storici e contemporanei', to: '/architettura', city: 'Genova'},
  {title: 'Teatro e spettacolo', description: 'Rappresentazioni e festival', to: '/teatro-spettacolo', city: 'Napoli'},
]

const Suggestions = () => {
  return (
    <section className="mb-20">
      <div className="container">
        <h2 className="font-bold text-3xl mb-10">Esplora per categoria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(({title, description, to, city}, i) => (
            <Link
              key={i}
              to={to}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md flex justify-between gap-2"
              title={`${description} — Città: ${city}`}
            >
              <div>
                <h3 className="text-lg text-zinc-950 font-bold mb-1">{title}</h3>
                <p className="text-sm text-zinc-600 mb-2 flex-grow">{description}</p>
                <span className="mt-auto text-sm font-semibold text-zinc-950">{city}</span>
              </div>
              <div>
                <div className={`w-8 h-8 rounded-full mb-4 bg-zinc-100 flex items-center justify-center`}>
                  <ArrowUpRightIcon className='size-4'/>
                </div>
              </div>

            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Suggestions
