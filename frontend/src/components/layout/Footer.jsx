import React from 'react'
import {Link} from 'react-router-dom'
import {DocumentTextIcon, ShieldCheckIcon} from '@heroicons/react/24/solid'
import {SiFacebook, SiInstagram, SiX, SiCookiecutter} from '@icons-pack/react-simple-icons'

const footerSections = [
  {
    title: 'MUSA',
    items: [
      {
        type: 'text',
        content: `Esplora l'arte e la cultura attraverso una nuova prospettiva. Scopri luoghi, opere ed eventi artistici in base al tuo mood e ai tuoi gusti musicali.`
      }
    ]
  },
  {
    title: 'Link Utili',
    items: [
      {type: 'link', label: 'Home', to: '/', icon: DocumentTextIcon},
      {type: 'link', label: 'Esplora', to: '/explore', icon: DocumentTextIcon},
      {type: 'link', label: 'Accedi', to: '/login', icon: DocumentTextIcon},
    ]
  },
  {
    title: 'Policy',
    items: [
      {type: 'link', label: 'Privacy Policy', to: '/privacy-policy', icon: DocumentTextIcon},
      {type: 'link', label: 'Cookie Policy', to: '/cookie-policy', icon: SiCookiecutter},
      {type: 'link', label: 'Termini e Condizioni', to: '/terms-and-conditions', icon: ShieldCheckIcon}
    ]
  },
  {
    title: 'Contatti',
    items: [
      {type: 'text', content: 'info@musa-app.com'},
      {
        type: 'social',
        links: [
          {label: 'Facebook', href: '#', icon: SiFacebook},
          {label: 'Instagram', href: '#', icon: SiInstagram},
          {label: 'Twitter', href: '#', icon: SiX}
        ]
      }
    ]
  }
]

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-zinc-800 text-white py-14">
      <div className="container">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xl font-bold mb-4">{section.title}</h3>

              {/* Link Items */}
              {section.items.some(item => item.type === 'link') && (
                <ul className="space-y-2">
                  {section.items
                    .filter(item => item.type === 'link')
                    .map((linkItem, j) => (
                      <li key={j}>
                        <Link
                          to={linkItem.to}
                          className="flex items-center text-gray-300 hover:text-white transition-colors text-sm"
                        >
                          <linkItem.icon className="h-4 w-4 mr-2" aria-hidden="true"/>
                          {linkItem.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}

              {/* Text Items */}
              {section.items
                .filter(item => item.type === 'text')
                .map((textItem, k) => (
                  <p key={k} className="text-gray-200 mb-2 text-sm">
                    {textItem.content}
                  </p>
                ))}

              {/* Social Icons */}
              {section.items
                .filter(item => item.type === 'social')
                .map((socialItem, m) => (
                  <div key={m} className="flex space-x-4 mt-4">
                    {socialItem.links.map((social, n) => {
                      const Icon = social.icon
                      return (
                        <a
                          key={n}
                          href={social.href}
                          aria-label={social.label}
                          className="text-gray-300 hover:text-white transition-colors"
                        >
                          <Icon size={24} title={social.label}/>
                        </a>
                      )
                    })}
                  </div>
                ))}
            </div>
          ))}
        </div>

        <hr className={'my-10 border-gray-600'}/>
        <span className='text-sm'>&copy; {year} MUSA. Tutti i diritti riservati.</span>

      </div>
    </footer>
  )
}

export default Footer
